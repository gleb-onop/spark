import type { SegmentedVideo, Segment } from '../types';
import { generateUUID } from '../utils/uuid';

// Fake delay to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const SEGMENTED_VIDEOS_KEY = 'spark_segmented_videos';
const SEGMENTS_KEY = 'spark_segments';

const getFromStorage = <T>(key: string): T[] => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error(`Error parsing ${key}:`, e);
        return [];
    }
};

const saveToStorage = <T>(key: string, data: T[]) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const api = {
    // Segmented Videos
    getSegmentedVideos: async (): Promise<SegmentedVideo[]> => {
        await delay(700);
        return getFromStorage<SegmentedVideo>(SEGMENTED_VIDEOS_KEY);
    },

    getSegmentedVideo: async (uuid: string): Promise<SegmentedVideo | undefined> => {
        await delay(200);
        return getFromStorage<SegmentedVideo>(SEGMENTED_VIDEOS_KEY).find(p => p.uuid === uuid);
    },

    addSegmentedVideo: async (name: string): Promise<SegmentedVideo> => {
        await delay(500);
        const segmentedVideos = getFromStorage<SegmentedVideo>(SEGMENTED_VIDEOS_KEY);
        const newSegmentedVideo: SegmentedVideo = {
            uuid: generateUUID(),
            name,
            createdAt: Date.now(),
            segmentIds: [],
        };
        saveToStorage(SEGMENTED_VIDEOS_KEY, [newSegmentedVideo, ...segmentedVideos]);
        return newSegmentedVideo;
    },


    deleteSegmentedVideo: async (uuid: string): Promise<void> => {
        await delay(500);
        const allSegmentedVideos = getFromStorage<SegmentedVideo>(SEGMENTED_VIDEOS_KEY);
        const segmentedVideoToDelete = allSegmentedVideos.find(p => p.uuid === uuid);

        if (segmentedVideoToDelete) {
            const allSegments = getFromStorage<Segment>(SEGMENTS_KEY);
            const remainingSegments = allSegments.filter(v => !segmentedVideoToDelete.segmentIds.includes(v.uuid));
            saveToStorage(SEGMENTS_KEY, remainingSegments);
        }

        const remainingSegmentedVideos = allSegmentedVideos.filter(p => p.uuid !== uuid);
        saveToStorage(SEGMENTED_VIDEOS_KEY, remainingSegmentedVideos);
    },

    reorderSegments: async (segmentedVideoId: string, segmentIds: string[]): Promise<void> => {
        await delay(400);
        const segmentedVideos = getFromStorage<SegmentedVideo>(SEGMENTED_VIDEOS_KEY);
        const updatedSegmentedVideos = segmentedVideos.map(p => {
            if (p.uuid === segmentedVideoId) {
                return { ...p, segmentIds };
            }
            return p;
        });
        saveToStorage(SEGMENTED_VIDEOS_KEY, updatedSegmentedVideos);
    },

    // Segments
    getSegments: async (): Promise<Segment[]> => {
        await delay(300);
        return getFromStorage<Segment>(SEGMENTS_KEY);
    },

    getSegment: async (uuid: string): Promise<Segment | undefined> => {
        await delay(200);
        return getFromStorage<Segment>(SEGMENTS_KEY).find(v => v.uuid === uuid);
    },

    getSegmentsByUuids: async (uuids: string[]): Promise<Segment[]> => {
        await delay(300);
        const allSegments = getFromStorage<Segment>(SEGMENTS_KEY);
        return uuids
            .map(uuid => allSegments.find(s => s.uuid === uuid))
            .filter((s): s is Segment => !!s);
    },

    addSegment: async (segmentData: Omit<Segment, 'uuid' | 'createdAt'>, segmentedVideoUuid: string): Promise<Segment> => {
        await delay(600);
        const segments = getFromStorage<Segment>(SEGMENTS_KEY);
        const newSegment: Segment = {
            ...segmentData,
            uuid: generateUUID(),
            createdAt: Date.now(),
        };

        saveToStorage(SEGMENTS_KEY, [...segments, newSegment]);

        const segmentedVideos = getFromStorage<SegmentedVideo>(SEGMENTED_VIDEOS_KEY);
        const updatedSegmentedVideos = segmentedVideos.map(p => {
            if (p.uuid === segmentedVideoUuid) {
                return { ...p, segmentIds: [...p.segmentIds, newSegment.uuid] };
            }
            return p;
        });
        saveToStorage(SEGMENTED_VIDEOS_KEY, updatedSegmentedVideos);

        return newSegment;
    },

    updateSegment: async (uuid: string, updated: Partial<Segment>): Promise<void> => {
        await delay(400);
        const segments = getFromStorage<Segment>(SEGMENTS_KEY).map(v =>
            v.uuid === uuid ? { ...v, ...updated } : v as Segment
        );
        saveToStorage(SEGMENTS_KEY, segments);
    },

    deleteSegment: async (segmentUuid: string, segmentedVideoUuid?: string): Promise<void> => {
        await delay(500);
        const segments = getFromStorage<Segment>(SEGMENTS_KEY).filter(v => v.uuid !== segmentUuid);
        saveToStorage(SEGMENTS_KEY, segments);

        const segmentedVideos = getFromStorage<SegmentedVideo>(SEGMENTED_VIDEOS_KEY);
        const updatedSegmentedVideos = segmentedVideos.map(p => {
            if (segmentedVideoUuid && p.uuid !== segmentedVideoUuid) return p;
            return {
                ...p,
                segmentIds: p.segmentIds.filter(id => id !== segmentUuid)
            };
        });
        saveToStorage(SEGMENTED_VIDEOS_KEY, updatedSegmentedVideos);
    },

    addSegmentedVideoWithSegment: async (segmentedVideoName: string, segmentData: Omit<Segment, 'uuid' | 'createdAt'>): Promise<{ segmentedVideo: SegmentedVideo; segment: Segment }> => {
        const newSegmentedVideo = await api.addSegmentedVideo(segmentedVideoName);
        const newSegment = await api.addSegment(segmentData, newSegmentedVideo.uuid);
        const updatedSegmentedVideo = await api.getSegmentedVideo(newSegmentedVideo.uuid);
        return { segmentedVideo: updatedSegmentedVideo!, segment: newSegment };
    }
};
