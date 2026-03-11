import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SegmentedVideo, Segment } from '../types';

interface UseSegmentNavigationProps {
    segmentedVideo: SegmentedVideo | null;
    segment: Segment | null | undefined;
    segmentedVideoId: string | undefined;
    isLooping: boolean;
}

export const useSegmentNavigation = ({
    segmentedVideo,
    segment,
    segmentedVideoId,
    isLooping
}: UseSegmentNavigationProps) => {
    const navigate = useNavigate();

    const onComplete = useCallback(() => {
        if (!segmentedVideo || !segment || !segmentedVideoId) return;

        const currentIndex = segmentedVideo.segmentIds.indexOf(segment.uuid);

        if (currentIndex < segmentedVideo.segmentIds.length - 1) {
            navigate(`/segmented-videos/${segmentedVideoId}/segments/${segmentedVideo.segmentIds[currentIndex + 1]}`);
        } else if (isLooping) {
            navigate(`/segmented-videos/${segmentedVideoId}/segments/${segmentedVideo.segmentIds[0]}`);
        } else {
            navigate(`/segmented-videos/${segmentedVideoId}`);
        }
    }, [segmentedVideo, segment, segmentedVideoId, navigate, isLooping]);

    return {
        onComplete
    };
};
