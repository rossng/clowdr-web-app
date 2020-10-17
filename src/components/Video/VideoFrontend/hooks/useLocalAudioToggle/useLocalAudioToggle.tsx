import { useCallback } from 'react';
import useIsTrackEnabled from '../useIsTrackEnabled/useIsTrackEnabled';
import useVideoContext from '../useVideoContext/useVideoContext';

export default function useLocalAudioToggle() {
    const { room: { localParticipant }, audioTrack, getLocalAudioTrack } = useVideoContext();
    const isEnabled = useIsTrackEnabled(audioTrack);

    const stopAudio = useCallback(() => {
        console.log(`Stopping ${audioTrack?.id}`);
        audioTrack?.disable();

        if (audioTrack) {
            const localTrackPublication = localParticipant?.unpublishTrack(audioTrack);
            // TODO: remove when SDK implements this event. See: https://issues.corp.twilio.com/browse/JSDK-2592
            localParticipant?.emit('trackUnpublished', localTrackPublication);
        }
        audioTrack?.stop();

    }, [audioTrack, localParticipant]);

    const enableAudio = useCallback(() => {
        if (!audioTrack) {
            getLocalAudioTrack().promise.then(track => {
                track?.enable();
            });
        }
    }, [audioTrack, getLocalAudioTrack]);

    const toggleAudioEnabled = useCallback(() => {
        if (isEnabled) {
            stopAudio();
        } else {
            enableAudio();
        }
    }, [enableAudio, isEnabled, stopAudio]);

    return [isEnabled, toggleAudioEnabled, stopAudio, enableAudio] as const;
}
