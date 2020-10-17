import { LocalAudioTrack } from 'twilio-video';
import { useCallback, useMemo, useState } from 'react';
import useIsTrackEnabled from '../useIsTrackEnabled/useIsTrackEnabled';
import useVideoContext from '../useVideoContext/useVideoContext';
import useLocalTracks, { useLocalAudioTrack } from '../../components/VideoProvider/useLocalTracks/useLocalTracks';

export default function useLocalAudioToggle() {
    const { room: { localParticipant }, audioTrack, getLocalAudioTrack } = useVideoContext();
    const isEnabled = useIsTrackEnabled(audioTrack);

    const stopAudio = useCallback(() => {
        audioTrack?.stop();

        if (audioTrack) {
            const localTrackPublication = localParticipant?.unpublishTrack(audioTrack);
            // TODO: remove when SDK implements this event. See: https://issues.corp.twilio.com/browse/JSDK-2592
            localParticipant?.emit('trackUnpublished', localTrackPublication);
        }
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
