import { useCallback } from 'react';
import useVideoContext from '../useVideoContext/useVideoContext';

export default function useLocalVideoToggle() {
    const { room: { localParticipant }, videoTrack, getLocalVideoTrack } = useVideoContext();

    const stopVideo = useCallback(() => {
        videoTrack?.stop();

        if (videoTrack) {
            const localTrackPublication = localParticipant?.unpublishTrack(videoTrack);
            localParticipant?.emit('trackUnpublished', localTrackPublication);
        }
    }, [localParticipant, videoTrack]);

    const enableVideo = useCallback(() => {
        if (!videoTrack) {
            getLocalVideoTrack().promise.then(track => {
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
