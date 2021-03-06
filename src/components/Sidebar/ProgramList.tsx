import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ProgramSession, ProgramSessionEvent } from "@clowdr-app/clowdr-db-schema";
import { makeCancelable } from "@clowdr-app/clowdr-db-schema/build/Util";
import useConference from "../../hooks/useConference";
import useLogger from "../../hooks/useLogger";
import useDataSubscription from "../../hooks/useDataSubscription";
import TrackMarker from "../Pages/Program/All/TrackMarker";
import useMaybeUserProfile from "../../hooks/useMaybeUserProfile";
import { generateTimeText } from "../../classes/Utils";
import { Tooltip } from "@material-ui/core";

export type ProgramSessionWithStartEnd = {
    session: ProgramSession;
    earliestStart: Date;
    latestEnd: Date;
};

interface Props {
    sessions: Array<ProgramSessionWithStartEnd>;
    events: Array<ProgramSessionEvent>;
    /**
     * Time boundaries to group items into, in minutes.
     *
     * Groups are automatically created for items before and after the
     * boundaries specified, to include up to a distance of 10 years.
     */
    timeBoundaries: Array<number>;
    watchedSessions?: Array<string>;
    watchedEvents?: Array<string>;
}

function arrangeBoundaries(timeBoundaries: Array<number>)
    : [Array<{ start: number, end: number, isLast: boolean }>, number] {
    const now = Date.now();
    const boundaries = timeBoundaries
        .sort((x, y) => x < y ? -1 : x === y ? 0 : 1) // Order them
        .map(x => x * 60 * 1000); // Convert to milliseconds
    const boundaryPairs: Array<{ start: number, end: number, isLast: boolean }> = [];
    const insaneLengthOfTime = 1000 * 60 * 60 * 24 * 365 * 10; // Ten years in ms
    if (boundaries.length > 0) {
        const boundaryStart = now - insaneLengthOfTime;
        const boundaryEnd = now + boundaries[0];
        boundaryPairs.push({
            start: boundaryStart,
            end: boundaryEnd,
            isLast: boundaries.length === 1
        });
    }
    for (let i = 0; i < boundaries.length; i++) {
        const boundaryStart = now + boundaries[i];
        let boundaryEnd;
        if (i + 1 < boundaries.length) {
            boundaryEnd = now + boundaries[i + 1];
        }
        else {
            boundaryEnd = now + insaneLengthOfTime;
        }

        boundaryPairs.push({
            start: boundaryStart,
            end: boundaryEnd,
            isLast: i === boundaries.length - 1
        });
    }
    return [boundaryPairs, now];
}

interface ItemRenderData {
    title: string;
    track: {
        id: string;
        name: string;
        colour: string;
    };
    isWatched: boolean;
    additionalClasses: string;
    url: string;
    sortValue: number;
    startTime: Date;

    item: {
        type: "event";
        data: ProgramSessionEvent;
    } | {
        type: "session";
        data: ProgramSession;
    };
}

interface GroupRenderData {
    key: string;
    timeText: string;
    items: Array<ItemRenderData>;
}

interface RenderData {
    groups: Array<GroupRenderData>;
}

export default function ProgramList(props: Props) {
    const conf = useConference();
    const currentUserProfile = useMaybeUserProfile();
    const [renderData, setRenderData] = useState<RenderData>({ groups: [] });
    const logger = useLogger("Sidebar/Program");
    const [refreshRequired, setRefreshRequired] = useState(true);
    /* For debugging */
    logger.disable();

    // Compute render data
    useEffect(() => {
        async function buildRenderData(): Promise<RenderData> {
            if (refreshRequired) {
                setRefreshRequired(false);
            }

            const groupedItems: {
                [timeBoundary: number]: {
                    startTime: Date,
                    endTime: Date,
                    sessions: Array<ProgramSessionWithStartEnd>,
                    events: Array<ProgramSessionEvent>,
                    isLast: boolean
                }
            } = {};
            const [boundaries, now] = arrangeBoundaries(props.timeBoundaries);
            // Initialise empty groups
            for (const boundary of boundaries) {
                groupedItems[boundary.start] = {
                    startTime: new Date(boundary.start),
                    endTime: new Date(boundary.end),
                    sessions: [],
                    events: [],
                    isLast: boundary.isLast
                };
            }

            // Place sessions into groups
            for (const session of props.sessions) {
                for (const boundary of boundaries) {
                    if (boundary.end <= now) {
                        if (session.latestEnd.getTime() <= boundary.end) {
                            groupedItems[boundary.start].sessions.push(session);
                            break;
                        }
                    }
                    else {
                        if (session.earliestStart.getTime() <= boundary.end) {
                            groupedItems[boundary.start].sessions.push(session);
                            break;
                        }
                    }
                }
            }

            // Place events into groups
            for (const event of props.events) {
                for (const boundary of boundaries) {
                    if (boundary.end <= now) {
                        if (event.endTime.getTime() <= boundary.end) {
                            groupedItems[boundary.start].events.push(event);
                            break;
                        }
                    }
                    else {
                        if (event.startTime.getTime() <= boundary.end) {
                            groupedItems[boundary.start].events.push(event);
                            break;
                        }
                    }
                }
            }

            // Filter out empty groups
            for (const groupKey in groupedItems) {
                if (groupKey in groupedItems) {
                    const group = groupedItems[groupKey];
                    if (group.events.length === 0 && group.sessions.length === 0) {
                        delete groupedItems[groupKey];
                        logger.info(`Deleting empty group: ${groupKey}`);
                    }
                }
            }

            // Build render data
            const newRenderData: RenderData = {
                groups: []
            };
            for (const groupKey in groupedItems) {
                if (groupKey in groupedItems) {
                    const group = groupedItems[groupKey];
                    let timeText: string;
                    if (group.endTime.getTime() <= now) {
                        timeText = "Past";
                    }
                    else if (group.startTime.getTime() <= now) {
                        timeText = "Happening now";
                    }
                    else {
                        const startTime = group.startTime.getTime();
                        const endTime = group.endTime.getTime();
                        const { distance: startDistance, units: startUnits } = generateTimeText(startTime, now);
                        const { distance: endDistance, units: endUnits } = generateTimeText(endTime, now);
                        if (group.isLast) {
                            timeText = `Beyond ${startDistance} ${startUnits}`;
                        }
                        else if (startUnits === endUnits ||
                            startUnits === (endUnits + "s")) {
                            timeText = `Starts in ${startDistance} to ${endDistance} ${endUnits}`;
                        }
                        else {
                            timeText = `Starts in ${startDistance} ${startUnits} to ${endDistance} ${endUnits}`;
                        }
                    }

                    logger.info(timeText, group);
                    let items: Array<ItemRenderData>;
                    items = await Promise.all(group.sessions.map(async sessionWSE => {
                        const session = sessionWSE.session;
                        const track = await session.track;
                        const result: ItemRenderData = {
                            title: session.title,
                            url: `/session/${session.id}`,
                            startTime: sessionWSE.earliestStart,
                            track: { id: track.id, name: track.shortName, colour: track.colour },
                            isWatched: !!props.watchedSessions?.includes(session.id),
                            item: { type: "session", data: session },
                            sortValue: sessionWSE.earliestStart.getTime(),
                            additionalClasses: "session" // TODO: Add .no-events if displaying events
                        };
                        return result;
                    }));
                    items = items.concat(await Promise.all(group.events.map(async event => {
                        const track = await event.track;
                        const result: ItemRenderData = {
                            title: (await event.item).title,
                            url: `/event/${event.id}`,
                            startTime: event.startTime,
                            track: { id: track.id, name: track.shortName, colour: track.colour },
                            isWatched: !!props.watchedEvents?.includes(event.id),
                            item: { type: "event", data: event },
                            sortValue: event.startTime.getTime(),
                            additionalClasses: "event"
                        };
                        return result;
                    })));

                    const groupRenderData: GroupRenderData = {
                        key: groupKey,
                        timeText,
                        items: items.sort((x, y) => x.sortValue < y.sortValue ? -1 : x.sortValue > y.sortValue ? 1 : 0)
                    };
                    newRenderData.groups.push(groupRenderData);
                }
            }

            logger.info("Props.events (inner)", props.events);
            logger.info("Render data (inner)", newRenderData);

            return newRenderData;
        }

        let cancel: () => void = () => { };
        async function doBuildRenderData() {
            try {
                const p = makeCancelable(buildRenderData());
                cancel = p.cancel;
                const d = await p.promise;
                setRenderData(d);
            }
            catch (e) {
                if (!e.isCanceled) {
                    throw e;
                }
            }
            finally {
                cancel = () => { };
            }
        }

        doBuildRenderData();

        return cancel;
    }, [logger, props.events, props.sessions, props.timeBoundaries, props.watchedEvents, props.watchedSessions, refreshRequired]);


    // Subscribe to data events

    const onDataUpdated = useCallback(function _onDataUpdated() {
        setRefreshRequired(true);
    }, []);

    useDataSubscription(
        "ProgramTrack",
        onDataUpdated,
        null,
        false,
        conf);

    useDataSubscription(
        "ProgramItem",
        onDataUpdated,
        null,
        false,
        conf);

    logger.info("Props.events", props.events);
    logger.info("Render data", renderData);

    const groupElems: Array<JSX.Element> = [];

    const doToggleFollow = useCallback(async function _doToggleFollow(table: "session" | "event", id: string) {
        try {
            if (currentUserProfile) {
                const p = makeCancelable((async () => {
                    const watched = await currentUserProfile.watched;
                    if (table === "session") {
                        if (!watched.watchedSessions.includes(id)) {
                            watched.watchedSessions.push(id);
                        }
                        else {
                            watched.watchedSessions = watched.watchedSessions.filter(x => x !== id);
                        }
                    }
                    else if (table === "event") {
                        if (!watched.watchedEvents.includes(id)) {
                            watched.watchedEvents.push(id);
                        }
                        else {
                            watched.watchedEvents = watched.watchedEvents.filter(x => x !== id);
                        }
                    }

                    await watched.save();
                })());
                await p.promise;
            }
        }
        catch (e) {
            if (!e.isCanceled) {
                throw e;
            }
        }
        // ESLint/React are too stupid to know that `watchedId` is what drives `watched`
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserProfile?.watchedId]);

    for (const group of renderData.groups) {
        const itemElems: Array<JSX.Element> = [];
        for (const item of group.items) {
            const table = item.item.type;
            const id = item.item.data.id;
            const startTime = item.startTime;
            itemElems.push(
                <Tooltip title={`Starts at ${startTime.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit"
                })} your time`} key={item.item.data.id}>
                    <li key={item.item.data.id} className={item.additionalClasses + (item.isWatched ? " watched" : "")}>
                        <Link to={item.url}>
                            <h3>{item.title}</h3>
                        </Link>
                        {item.isWatched
                            ? <button className="watch" onClick={(ev) => {
                                ev.preventDefault();
                                ev.stopPropagation();
                                doToggleFollow(table, id);
                            }}><i className="fas fa-star"></i></button>
                            : <button className="watch" onClick={(ev) => {
                                ev.preventDefault();
                                ev.stopPropagation();
                                doToggleFollow(table, id);
                            }}><i className="far fa-star"></i></button>}
                        <Link className="track" to={`/track/${item.track.id}`}>
                            <TrackMarker track={item.track.colour} small={true} />
                            <span>{item.track.name}</span>
                        </Link>
                    </li>
                </Tooltip>);
        }

        const groupElem = <div className="group" key={group.key}>
            <div className="time">{group.timeText}</div>
            <ul className="items">
                {itemElems}
            </ul>
        </div>;

        groupElems.push(groupElem);
    }

    return <div className="program">
        {groupElems.reduce((acc, x) => <>{acc}{x}</>, <></>)}
    </div>;
}
