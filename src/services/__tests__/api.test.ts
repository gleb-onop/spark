import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '../api';
import { generateUUID } from '../../utils/uuid';

describe('api service', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('segmented videos', () => {
        it('adds and retrieves segmented videos', async () => {
            const name = 'Test Collection';
            const created = await api.addSegmentedVideo(name);

            expect(created.name).toBe(name);
            expect(created.uuid).toBeDefined();

            const all = await api.getSegmentedVideos();
            expect(all).toHaveLength(1);
            expect(all[0].name).toBe(name);
        });

        it('gets a single segmented video by uuid', async () => {
            const created = await api.addSegmentedVideo('Find Me');
            const found = await api.getSegmentedVideo(created.uuid);
            expect(found?.name).toBe('Find Me');
        });

        it('deletes a segmented video and its segments', async () => {
            const video = await api.addSegmentedVideo('To Delete');
            const segmentData = {
                description: 'Seg to delete',
                timeStart: '0:00',
                timeEnd: '0:10',
                video: {
                    uuid: 'v1',
                    youtubeId: 'yt1',
                    description: '',
                    duration: 100,
                    isEmbeddable: true,
                    isVertical: false,
                    createdAt: Date.now()
                }
            };

            await api.addSegment(segmentData, video.uuid);

            await api.deleteSegmentedVideo(video.uuid);

            const videos = await api.getSegmentedVideos();
            const segments = await api.getSegments();

            expect(videos).toHaveLength(0);
            expect(segments).toHaveLength(0);
        });

        it('reorders segments', async () => {
            const video = await api.addSegmentedVideo('Reorder');
            const ids = ['id1', 'id2', 'id3'];
            await api.reorderSegments(video.uuid, ids);

            const found = await api.getSegmentedVideo(video.uuid);
            expect(found?.segmentIds).toEqual(ids);
        });
    });

    describe('segments', () => {
        it('adds a segment to a segmented video', async () => {
            const video = await api.addSegmentedVideo('Host');
            const segmentData = {
                description: 'New segment',
                timeStart: '1:00',
                timeEnd: '2:00',
                video: {
                    uuid: 'v2',
                    youtubeId: 'yt2',
                    description: '',
                    duration: 300,
                    isEmbeddable: true,
                    isVertical: false,
                    createdAt: Date.now()
                }
            };

            const segment = await api.addSegment(segmentData, video.uuid);
            expect(segment.description).toBe('New segment');

            const updatedVideo = await api.getSegmentedVideo(video.uuid);
            expect(updatedVideo?.segmentIds).toContain(segment.uuid);
        });

        it('updates a segment', async () => {
            const video = await api.addSegmentedVideo('Update host');
            const segment = await api.addSegment({
                description: 'Old desc',
                timeStart: '0:00',
                timeEnd: '0:10',
                video: {
                    uuid: 'v3',
                    youtubeId: 'yt3',
                    description: '',
                    duration: 100,
                    isEmbeddable: true,
                    isVertical: false,
                    createdAt: Date.now()
                }
            }, video.uuid);

            await api.updateSegment(segment.uuid, { description: 'New desc' });
            const found = await api.getSegment(segment.uuid);
            expect(found?.description).toBe('New desc');
        });

        it('deletes a segment and updates the video collection', async () => {
            const video = await api.addSegmentedVideo('Delete host');
            const segment = await api.addSegment({
                description: 'Short snippet',
                timeStart: '0:00',
                timeEnd: '0:05',
                video: {
                    uuid: 'v4',
                    youtubeId: 'yt4',
                    description: '',
                    duration: 10,
                    isEmbeddable: true,
                    isVertical: false,
                    createdAt: Date.now()
                }
            }, video.uuid);

            await api.deleteSegment(segment.uuid, video.uuid);

            const foundSegment = await api.getSegment(segment.uuid);
            const foundVideo = await api.getSegmentedVideo(video.uuid);

            expect(foundSegment).toBeUndefined();
            expect(foundVideo?.segmentIds).not.toContain(segment.uuid);
        });
    });

    describe('combined operations', () => {
        it('adds a segmented video with an initial segment', async () => {
            const segmentData = {
                description: 'Initial',
                timeStart: '0:00',
                timeEnd: '1:00',
                video: {
                    uuid: 'v5',
                    youtubeId: 'yt5',
                    description: '',
                    duration: 60,
                    isEmbeddable: true,
                    isVertical: false,
                    createdAt: Date.now()
                }
            };

            const { segmentedVideo, segment } = await api.addSegmentedVideoWithSegment('Hybrid', segmentData);

            expect(segmentedVideo.name).toBe('Hybrid');
            expect(segment.description).toBe('Initial');
            expect(segmentedVideo.segmentIds).toContain(segment.uuid);
        });
    });
});
