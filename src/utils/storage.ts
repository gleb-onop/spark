import type { Playlist, Video } from '../types';

const PLAYLISTS_KEY = 'spark_playlists';
const VIDEOS_KEY = 'spark_videos';

export const storage = {
    getPlaylists: (): Playlist[] => {
        try {
            const data = localStorage.getItem(PLAYLISTS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error parsing playlists:', e);
            return [];
        }
    },

    savePlaylists: (playlists: Playlist[]) => {
        localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
    },

    getVideos: (): Video[] => {
        try {
            const data = localStorage.getItem(VIDEOS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error parsing videos:', e);
            return [];
        }
    },

    saveVideos: (videos: Video[]) => {
        localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
    },

    addPlaylist: (name: string): Playlist => {
        const playlists = storage.getPlaylists();
        const newPlaylist: Playlist = {
            uuid: crypto.randomUUID(),
            name,
            createdAt: Date.now(),
            videoIds: [],
        };
        storage.savePlaylists([newPlaylist, ...playlists]);
        return newPlaylist;
    },

    deletePlaylist: (uuid: string) => {
        const playlists = storage.getPlaylists().filter(p => p.uuid !== uuid);
        storage.savePlaylists(playlists);

        // Also cleanup orphaned videos if needed, though spec says "all videos of all playlists" are in spark_videos
        // For now just removing the playlist reference is enough as per spec structure
    },

    addVideo: (video: Omit<Video, 'uuid' | 'createdAt'>, playlistUuid: string): Video => {
        const videos = storage.getVideos();
        const newVideo: Video = {
            ...video,
            uuid: crypto.randomUUID(),
            createdAt: Date.now(),
        };

        storage.saveVideos([...videos, newVideo]);

        const playlists = storage.getPlaylists();
        const updatedPlaylists = playlists.map(p => {
            if (p.uuid === playlistUuid) {
                return { ...p, videoIds: [...p.videoIds, newVideo.uuid] };
            }
            return p;
        });
        storage.savePlaylists(updatedPlaylists);

        return newVideo;
    },

    deleteVideo: (videoUuid: string, playlistUuid: string) => {
        const videos = storage.getVideos().filter(v => v.uuid !== videoUuid);
        storage.saveVideos(videos);

        const playlists = storage.getPlaylists();
        const updatedPlaylists = playlists.map(p => {
            if (p.uuid === playlistUuid) {
                return { ...p, videoIds: p.videoIds.filter(id => id !== videoUuid) };
            }
            return p;
        });
        storage.savePlaylists(updatedPlaylists);
    },

    addPlaylistWithVideo: (playlistName: string, videoData: Omit<Video, 'uuid' | 'createdAt'>): { playlist: Playlist; video: Video } => {
        const newPlaylist = storage.addPlaylist(playlistName);

        const videos = storage.getVideos();
        const newVideo: Video = {
            ...videoData,
            uuid: crypto.randomUUID(),
            createdAt: Date.now(),
        };
        storage.saveVideos([...videos, newVideo]);

        const playlists = storage.getPlaylists();
        const updatedPlaylists = playlists.map(p => {
            if (p.uuid === newPlaylist.uuid) {
                return { ...p, videoIds: [newVideo.uuid] };
            }
            return p;
        });
        storage.savePlaylists(updatedPlaylists);

        return { playlist: newPlaylist, video: newVideo };
    }
};
