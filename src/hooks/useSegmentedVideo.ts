import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { SegmentedVideo, Segment } from '../types';

export function useSegmentedVideo(segmentedVideoId: string | undefined) {
    const [segmentedVideo, setSegmentedVideo] = useState<SegmentedVideo | null>(null);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadSegmentedVideo = useCallback(async () => {
        if (!segmentedVideoId) {
            setSegmentedVideo(null);
            setSegments([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const found = await api.getSegmentedVideo(segmentedVideoId);

            if (found) {
                setSegmentedVideo(found);
                const segmentedVideoSegments = await api.getSegmentsByUuids(found.segmentIds);
                setSegments(segmentedVideoSegments);
            } else {
                setSegmentedVideo(null);
                setSegments([]);
            }
        } catch (e) {
            console.error('Error loading segmented video:', e);
            setSegmentedVideo(null);
            setSegments([]);
        } finally {
            setIsLoading(false);
        }
    }, [segmentedVideoId]);

    useEffect(() => {
        loadSegmentedVideo();
    }, [loadSegmentedVideo]);

    const deleteSegment = async (segmentUuid: string) => {
        if (segmentedVideoId) {
            await api.deleteSegment(segmentUuid, segmentedVideoId);
            await loadSegmentedVideo();
        }
    };


    const deleteSegmentedVideo = async () => {
        if (!segmentedVideoId) return;
        await api.deleteSegmentedVideo(segmentedVideoId);
    };

    return {
        segmentedVideo,
        segments,
        isLoading,
        refreshSegmentedVideo: loadSegmentedVideo,
        deleteSegment,
        deleteSegmentedVideo
    };
}

