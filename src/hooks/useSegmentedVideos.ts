import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { SegmentedVideo, Segment } from '../types';

export const useSegmentedVideos = () => {
    const [segmentedVideos, setSegmentedVideos] = useState<SegmentedVideo[]>([]);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [videosData, segmentsData] = await Promise.all([
                api.getSegmentedVideos(),
                api.getSegments()
            ]);
            setSegmentedVideos(videosData);
            setSegments(segmentsData);
        } catch (e) {
            console.error('Error loading data:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return {
        segmentedVideos,
        segments,
        isLoading,
        refresh: loadData
    };
};
