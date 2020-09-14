import React, { useEffect } from "react";
import useDocTitle from "../../../hooks/useDocTitle";
import ChatFrame from "../../Chat/ChatFrame/ChatFrame";

export default function ChatView() {
    const docTitle = useDocTitle();
    useEffect(() => {
        docTitle.set("Chat Room X");
    }, [docTitle]);
    return <>
        <ChatFrame />
    </>;
}