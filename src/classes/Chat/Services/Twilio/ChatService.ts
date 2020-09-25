import { Conference, ConferenceConfiguration, UserProfile } from "clowdr-db-schema/src/classes/DataLayer";
import IChatManager from "../../IChatManager";
import IChatService from "../../IChatService";
import Channel from "./Channel";
import { default as LocalStorage_TwilioChatToken } from "../../../LocalStorage/TwilioChatToken";
import DebugLogger from "clowdr-db-schema/src/classes/DebugLogger";
import assert from "assert";
import * as Twilio from "twilio-chat";
import { Channel as TwilioChannel } from "twilio-chat/lib/channel";
import { ChannelDescriptor as TwilioChannelDescriptor } from "twilio-chat/lib/channeldescriptor";
import { Paginator } from "twilio-chat/lib/interfaces/paginator";

export default class TwilioChatService implements IChatService {
    private twilioToken: string | null = null;
    conference: Conference | null = null;
    private profile: UserProfile | null = null;
    private sessionToken: string | null = null;

    private twilioClient: Twilio.Client | null = null;

    private _REACT_APP_TWILIO_CALLBACK_URL: string | null = null;

    private logger: DebugLogger = new DebugLogger("TwilioChatService");

    constructor(private manager: IChatManager) {
        // TODO: Remove this line in production
        this.logger.enable();
    }

    async setup(conference: Conference, profile: UserProfile, sessionToken: string) {
        this.conference = conference;
        this.profile = profile;
        this.sessionToken = sessionToken;

        if (!this.twilioToken) {
            if (LocalStorage_TwilioChatToken.twilioChatToken) {
                const token = LocalStorage_TwilioChatToken.twilioChatToken;
                const expiry = LocalStorage_TwilioChatToken.twilioChatTokenExpiry;
                const confId = LocalStorage_TwilioChatToken.twilioChatTokenConferenceId;
                const profileId = LocalStorage_TwilioChatToken.twilioChatUserProfileId;
                this.twilioToken = null;

                if (confId && token && expiry) {
                    if (confId === conference.id &&
                        profileId === profile.id &&
                        expiry.getTime() >= Date.now()) {
                        this.twilioToken = token;
                        this.logger.info("Twilio token found in local storage (considered valid).");
                    }
                }

                if (!this.twilioToken) {
                    this.logger.info("Twilio token found in local storage considered invalid (expired, different conference, or some other issue).");
                }
            }
        }

        let retry: boolean;
        let attempCount = 0;

        do {
            retry = false;
            attempCount++;

            if (!this.twilioToken) {
                const { token, expiry } = await this.fetchFreshToken();
                if (token) {
                    this.twilioToken = token;
                    LocalStorage_TwilioChatToken.twilioChatToken = token;
                    LocalStorage_TwilioChatToken.twilioChatTokenExpiry = expiry;
                    LocalStorage_TwilioChatToken.twilioChatTokenConferenceId = conference.id;
                    LocalStorage_TwilioChatToken.twilioChatUserProfileId = profile.id;

                    this.logger.info("Twilio token obtained.");
                }
                else {
                    this.twilioToken = null;
                    LocalStorage_TwilioChatToken.twilioChatToken = null;
                    LocalStorage_TwilioChatToken.twilioChatTokenExpiry = null;
                    LocalStorage_TwilioChatToken.twilioChatTokenConferenceId = null;
                    LocalStorage_TwilioChatToken.twilioChatUserProfileId = null;

                    this.logger.warn("Twilio token not obtained.");
                    throw new Error("Twilio token not obtained.");
                }
            }

            assert(this.twilioToken);

            try {
                // TODO: Increase log level if debugger enabled?
                this.twilioClient = await Twilio.Client.create(this.twilioToken);
                this.logger.info("Created Twilio client.");

                // Ensure we fetched this before the service becomes available
                await this.get_REACT_APP_TWILIO_CALLBACK_URL()

                // Enable underlying service features
                this.enableAutoRenewConnection();
                this.enableAutoJoinOnInvite();

                // TODO: Attach to events
            }
            catch (e) {
                this.twilioClient = null;
                if (e.toString().includes("expired")) {
                    this.logger.info("Twilio token (probably) expired.");

                    this.twilioToken = null;

                    if (attempCount < 2) {
                        retry = true;
                    }
                }

                if (!retry) {
                    this.logger.error("Could not create Twilio client!", e);
                    throw e;
                }
            }
        }
        while (retry);
    }

    async teardown() {
        if (this.twilioClient) {
            await this.twilioClient.shutdown();
            this.twilioClient = null;
        }
    }


    private async get_REACT_APP_TWILIO_CALLBACK_URL(): Promise<string> {
        if (!this._REACT_APP_TWILIO_CALLBACK_URL) {
            assert(this.conference);
            const results = await ConferenceConfiguration.getByKey("REACT_APP_TWILIO_CALLBACK_URL", this.conference.id);
            if (results.length > 0) {
                this._REACT_APP_TWILIO_CALLBACK_URL = results[0].value;
            }
            else {
                this.logger.warn("Twilio not configured for this conference.");
                throw new Error("Twilio not configured for this conference.");
            }
        }
        return this._REACT_APP_TWILIO_CALLBACK_URL;
    }

    private async fetchFreshToken(): Promise<{
        token: string | null,
        expiry: Date | null
    }> {
        assert(this.profile);
        assert(this.conference);

        this.logger.info(`Fetching fresh chat token for ${this.profile.displayName} (${this.profile.id}), ${this.conference.name} (${this.conference.id})`);

        const result = await this.requestClowdrTwilioBackend("token");
        return { token: result.token, expiry: new Date(result.expiry) };
    }

    async requestClowdrTwilioBackend(
        endpoint: "token" | "create" | "invite" | "addMember",
        data: any = {}
    ) {
        assert(this.sessionToken);
        assert(this.conference);

        data.identity = this.sessionToken;
        data.conference = this.conference.id;

        const callbackUrl = await this.get_REACT_APP_TWILIO_CALLBACK_URL();
        const res = await fetch(
            `${callbackUrl}/chat/${endpoint}`,
            {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        const result = await res.json();
        if (res.status !== 200) {
            throw new Error(result.status);
        }
        return result;
    }

    private convertChannels(chans: Array<TwilioChannel> | undefined): Array<Channel> {
        return chans?.map(chan => {
            return new Channel({ c: chan }, this);
        }) ?? [];
    }
    private async acquireAllChannels(pages: Paginator<TwilioChannel> | undefined): Promise<Array<Channel>> {
        let channels: Array<Channel> = this.convertChannels(pages?.items);
        while (pages?.hasNextPage) {
            pages = await pages.nextPage();
            channels = channels.concat(this.convertChannels(pages?.items));
        }
        return channels;
    }

    private convertChannelDescriptors(chans: Array<TwilioChannelDescriptor> | undefined): Array<Channel> {
        return chans?.map(chan => {
            return new Channel({ d: chan }, this);
        }) ?? [];
    }
    private async acquireAllChannelsFromDescriptors(pages: Paginator<TwilioChannelDescriptor> | undefined): Promise<Array<Channel>> {
        let channels: Array<Channel> = this.convertChannelDescriptors(pages?.items);
        while (pages?.hasNextPage) {
            pages = await pages.nextPage();
            channels = channels.concat(this.convertChannelDescriptors(pages?.items));
        }
        return channels;
    }

    async allChannels(): Promise<Array<Channel>> {
        const publicChannels = await this.publicChannels();
        let userChannels = await this.userChannels();
        const publicChannelIds = publicChannels.map(x => x.sid);
        userChannels = userChannels.filter(x => !publicChannelIds.includes(x.sid));
        return publicChannels.concat(userChannels);
    }
    async publicChannels(): Promise<Array<Channel>> {
        return this.acquireAllChannelsFromDescriptors(await this.twilioClient?.getPublicChannelDescriptors());
    }
    async userChannels(): Promise<Array<Channel>> {
        return this.acquireAllChannelsFromDescriptors(await this.twilioClient?.getUserChannelDescriptors());
    }
    async activeChannels(): Promise<Array<Channel>> {
        return this.acquireAllChannels(await this.twilioClient?.getSubscribedChannels());
    }

    async createChannel(invite: Array<UserProfile>, isPrivate: boolean, title: string): Promise<Channel> {
        assert(this.twilioClient);
        assert(invite.length > 0);

        const result = await this.requestClowdrTwilioBackend("create", {
            invite: invite.map(x => x.id),
            mode: isPrivate ? "private" : "public",
            title
        });
        return new Channel({ c: await this.twilioClient.getChannelBySid(result.channelSID) }, this);
    }

    async enableAutoRenewConnection(): Promise<void> {
        this.logger.info("Enabling auto-renew connection.");
        this.twilioClient?.on("tokenAboutToExpire", async () => {
            assert(this.conference);
            assert(this.profile);

            this.logger.info("Token about to expire");

            const { token, expiry } = await this.fetchFreshToken();
            if (token) {
                this.twilioToken = token;
                LocalStorage_TwilioChatToken.twilioChatToken = token;
                LocalStorage_TwilioChatToken.twilioChatTokenExpiry = expiry;
                LocalStorage_TwilioChatToken.twilioChatTokenConferenceId = this.conference.id;
                LocalStorage_TwilioChatToken.twilioChatUserProfileId = this.profile.id;

                this.logger.info("Twilio token for renewal obtained.");

                await this.twilioClient?.updateToken(token);
            }
            else {
                this.twilioToken = null;
                LocalStorage_TwilioChatToken.twilioChatToken = null;
                LocalStorage_TwilioChatToken.twilioChatTokenExpiry = null;
                LocalStorage_TwilioChatToken.twilioChatTokenConferenceId = null;
                LocalStorage_TwilioChatToken.twilioChatUserProfileId = null;

                this.logger.warn("Twilio token for renewal not obtained.");
                throw new Error("Twilio token for renewal not obtained.");
            }
        });
    }

    async enableAutoJoinOnInvite(): Promise<void> {
        this.logger.info("Enabling auto-join on invited.");
        this.twilioClient?.on("channelInvited", async (channel) => {
            channel.join();
        });
    }
}
