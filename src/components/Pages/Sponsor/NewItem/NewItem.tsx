import React, { useState } from "react";
import Parse from "parse";
import VideoItem from "../VideoItem/VideoItem";
import useConference from "../../../../hooks/useConference";

interface Props {
    sponsorId: string;
}

type State = "addingText" | "addingVideo" | "addingButton" | "choose";

export default function NewItem(props: Props) {
    const conference = useConference();
    const [state, setState] = useState<State>("choose");

    async function createVideoContent(videoURL: string) {
        await Parse.Cloud.run("create-sponsorContent", {
            sponsor: props.sponsorId,
            conference: conference.id,
            videoURL,
        });
        setState("choose");
    }

    function getContents() {
        switch (state) {
            case "choose":
                return (
                    <div className="content-item__button">
                        <button onClick={() => setState("addingText")}>
                            <i className="fas fa-align-left"></i> Add text
                        </button>
                        <button onClick={() => setState("addingVideo")}>
                            <i className="fas fa-video"></i> Add video
                        </button>
                        <button onClick={() => setState("addingButton")}>
                            <i className="fas fa-square"></i> Add button
                        </button>
                    </div>
                );
            case "addingButton":
                return <></>;
            case "addingText":
                return <></>;
            case "addingVideo":
                return <VideoItem editing={true} videoURL="" updateVideoURL={createVideoContent} />;
        }
    }

    return (
        <div className="content-item">
            <div className="content-item__buttons">
                {state !== "choose" && (
                    <button onClick={() => setState("choose")} aria-label="Cancel">
                        <i className="fas fa-window-close"></i>
                    </button>
                )}
            </div>
            {getContents()}
        </div>
    );
}
