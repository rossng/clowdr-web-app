import React, { useEffect, useRef, useState } from "react";
import "./MessageList.scss";
import "../../Profile/FlairChip/FlairChip.scss";

import IMessage from "../../../classes/Chat/IMessage";
import { LoadingSpinner } from "../../LoadingSpinner/LoadingSpinner";
import useSafeAsync from "../../../hooks/useSafeAsync";
import useMaybeChat from "../../../hooks/useMaybeChat";
import InfiniteScroll from "react-infinite-scroll-component";
import { Paginator } from "twilio-chat/lib/interfaces/paginator";
import assert from "assert";
import { ChannelEventNames } from "../../../classes/Chat/Services/Twilio/Channel";
import useConference from "../../../hooks/useConference";
import { addError } from "../../../classes/Notifications/Notifications";

import useUserProfile from "../../../hooks/useUserProfile";
import Message, { RenderedMessage, renderMessage } from "./Message";

interface Props {
    chatId: string;
    hideMessageReportButtons?: boolean;
}

export default function MessageList(props: Props) {
    const conf = useConference();
    const userProfile = useUserProfile();
    const [messagePager, setMessagesPager] = useState<Paginator<IMessage> | null>(null);
    const [messages, setMessages] = useState<Array<IMessage>>([]);
    const [renderedMessages, setRenderedMessages] = useState<Array<RenderedMessage>>([]);
    const mChat = useMaybeChat();
    const scrollerRef = useRef<HTMLDivElement>(null);

    function sortMessages(msgs: Array<IMessage>): Array<IMessage> {
        return msgs.sort((x, y) => (x.index < y.index ? -1 : x.index === y.index ? 0 : 1));
    }

    useEffect(() => {
        const listeners: Map<ChannelEventNames, string | null> = new Map();
        const chat = mChat;

        async function attach() {
            if (chat) {
                listeners.set(
                    "messageRemoved",
                    await chat.channelEventOn(props.chatId, "messageRemoved", {
                        componentName: "MessageList",
                        caller: "setMessages",
                        function: async msg => {
                            const newMessages = messages.filter(x => x.index !== msg.index);
                            setMessages(newMessages);
                        },
                    })
                );

                listeners.set(
                    "messageAdded",
                    await chat.channelEventOn(props.chatId, "messageAdded", {
                        componentName: "MessageList",
                        caller: "setMessages",
                        function: async msg => {
                            const newMessages = [...messages, msg];
                            await chat.setLastReadIndex(props.chatId, msg.index, 0);
                            setMessages(sortMessages(newMessages));
                        },
                    })
                );

                listeners.set(
                    "messageUpdated",
                    await chat.channelEventOn(props.chatId, "messageUpdated", {
                        componentName: "MessageList",
                        caller: "setMessages",
                        function: async msg => {
                            if (
                                msg.updateReasons.includes("body") ||
                                msg.updateReasons.includes("author") ||
                                msg.updateReasons.includes("attributes")
                            ) {
                                const newMessages = messages.map(x => {
                                    if (x.index === msg.message.index) {
                                        return msg.message;
                                    } else {
                                        return x;
                                    }
                                });
                                setMessages(newMessages);
                            }
                        },
                    })
                );
            }
        }

        attach();

        return function detach() {
            if (chat) {
                const keys = listeners.keys();
                for (const key of keys) {
                    const listener = listeners.get(key);
                    if (listener) {
                        chat.channelEventOff(props.chatId, key, listener);
                    }
                }
            }
        };
    }, [mChat, messages, props.chatId]);

    useSafeAsync(
        async () => {
            if (mChat) {
                try {
                    const pager = await mChat.getMessages(props.chatId, 10);
                    if (pager) {
                        const msgs = pager.items;
                        if (msgs.length > 0) {
                            mChat.setLastReadIndex(props.chatId, msgs[msgs.length - 1].index, 0);
                        }
                        return { messages: msgs, pager };
                    }
                } catch (e) {
                    console.error("Failed to fetch chat messages.", e);
                    addError("Failed to fetch chat messages.");
                }
            }
            return null;
        },
        (
            data: {
                messages: IMessage[];
                pager: Paginator<IMessage>;
            } | null
        ) => {
            if (data) {
                setMessages(data.messages);
                setMessagesPager(data.pager);
            } else {
                setMessages([]);
                setMessagesPager(null);
            }
        },
        [mChat, props.chatId],
        "MessageList:getMessages"
    );

    // This hook fires after the first batch of messages are retrieved and continues until there are
    // either no more messages or the container is scrollable
    useSafeAsync(
        async () => {
            if (messagePager) {
                if (
                    scrollerRef.current &&
                    scrollerRef.current.scrollHeight <= scrollerRef.current.clientHeight &&
                    messagePager.hasPrevPage
                ) {
                    try {
                        return await getNextPageMessages();
                    } catch (e) {
                        console.error("Failed to fetch chat messages.", e);
                        addError("Failed to fetch chat messages.");
                    }
                }
                return "no change";
            }
            return null;
        },
        (data: { messages: IMessage[]; pager: Paginator<IMessage> } | "no change" | null) => {
            if (data) {
                if (data !== "no change") {
                    setMessages(data.messages);
                    setMessagesPager(data.pager);
                }
            }
            // If the pager has gone but there are still messages cached, remove them
            if (messages.length > 0) {
                setMessages([]);
            }
        },
        [messagePager],
        "MessageList:getMessagesUntilScrollable"
    );

    useSafeAsync(
        async () => Promise.all(messages.map(async message => renderMessage(conf, userProfile, props.chatId, message))),
        setRenderedMessages,
        [messages],
        "MessageList:renderMessages"
    );

    async function getNextPageMessages() {
        assert(messagePager);
        assert(messagePager.hasPrevPage);

        const prevPage = await messagePager.prevPage();

        const items = prevPage.items;
        const existingMsgIdxs = messages.map(x => x.index);
        const newMessages = [...messages];
        for (const item of items) {
            const idx = existingMsgIdxs.indexOf(item.index);
            if (idx > -1) {
                newMessages.splice(idx, 1, item);
            } else {
                newMessages.push(item);
            }
        }

        return { messages: sortMessages(newMessages), pager: prevPage };
    }

    async function loadMoreMessages() {
        const { messages: _messages, pager } = await getNextPageMessages();
        setMessagesPager(pager);
        setMessages(_messages);
    }

    return (
        <div id={props.chatId} className="message-list" ref={scrollerRef}>
            <InfiniteScroll
                dataLength={messages.length}
                next={async () => await loadMoreMessages()}
                inverse={true}
                // Has to be applied as style not scss
                style={{ display: "flex", flexDirection: "column-reverse" }}
                hasMore={messagePager === null || messagePager.hasPrevPage}
                loader={<LoadingSpinner />}
                endMessage={<p className="start-of-chat">Beginning of chat.</p>}
                scrollableTarget={props.chatId}
            >
                <div>
                    {renderedMessages.map(x => (
                        <Message key={x.sid} msg={x} hideReportButton={props.hideMessageReportButtons} />
                    ))}
                </div>
            </InfiniteScroll>
        </div>
    );
}
