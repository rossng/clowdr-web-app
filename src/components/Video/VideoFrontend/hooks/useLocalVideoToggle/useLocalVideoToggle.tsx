import { useCallback, useRef } from 'react';
import useVideoContext from '../useVideoContext/useVideoContext';

export default function useLocalVideoToggle() {
    const { room: { localParticipant }, videoTrack, getLocalVideoTrack } = useVideoContext();
    const previousDeviceIdRef = useRef<string>();

    const stopVideo = useCallback(() => {
        if (videoTrack) {
            previousDeviceIdRef.current = videoTrack.mediaStreamTrack.getSettings().deviceId;
        }

        videoTrack?.disable();

        if (videoTrack) {
            const localTrackPublication = localParticipant?.unpublishTrack(videoTrack);
            localParticipant?.emit('trackUnpublished', localTrackPublication);
        }
        videoTrack?.stop();
    }, [localParticipant, videoTrack]);

    const enableVideo = useCallback(() => {
        if (!videoTrack) {
            getLocalVideoTrack({ deviceId: { exact: previousDeviceIdRef.current } }).promise.then(track => {
                track?.enable();
            });
        }
    }, [getLocalVideoTrack, videoTrack]);

    const toggleVideoEnabled = useCallback(() => {
        if (videoTrack) {
            stopVideo();
        } else {
            enableVideo();
        }
    }, [enableVideo, stopVideo, videoTrack]);

    return [!!videoTrack, toggleVideoEnabled, stopVideo, enableVideo] as const;
}
