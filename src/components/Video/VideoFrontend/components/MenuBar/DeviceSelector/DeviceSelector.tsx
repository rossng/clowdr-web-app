import React, { useState } from 'react';
import AudioInputList from './AudioInputList/AudioInputList';
import AudioOutputList from './AudioOutputList/AudioOutputList';
import { Dialog, DialogContent, Button } from '@material-ui/core';
import VideoInputList from './VideoInputList/VideoInputList';
import "./DeviceSelector.scss";

export function DeviceSelector() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                aria-label="Settings"
                className="device-selector__button">
                <i className={"fas fa-cog"}></i>
            </button>
            <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
                <DialogContent className="dialog-content">
                    <div className="list-selection">
                        <AudioInputList />
                    </div>
                    <div className="list-selection">
                        <AudioOutputList />
                    </div>
                    <div className="list-selection">
                        <VideoInputList />
                    </div>
                    <Button className="done-button" onClick={() => setIsOpen(false)}>
                        Done
                    </Button>
                </DialogContent>
            </Dialog>
        </>
    );
}
