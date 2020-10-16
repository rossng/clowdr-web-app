import React from 'react';
import fscreen from 'fscreen';
import useFullScreenToggle from '../../../hooks/useFullScreenToggle/useFullScreenToggle';
import "./ToggleFullScreenButton.scss";

export default function ToggleFullscreenButton() {
    const [isFullScreen, toggleFullScreen] = useFullScreenToggle();

    return fscreen.fullscreenEnabled ? (
        <button
            aria-label={`full screen`}
            onClick={toggleFullScreen}
            className="fullscreen-button">
            <i className={`fas fa-${isFullScreen ? "compress" : "expand"}`}></i>
        </button>
    ) : null;
}
