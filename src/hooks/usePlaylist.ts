import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import type { Playlist, Video } from '../types';

export const usePlaylist = (playlistId: string | undefined) => {
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadPlaylist = useCallback(() => {
        if (!playlistId) {
            setIsLoading(false);
            return;
        }

        const allPlaylists = storage.getPlaylists();
        const current = allPlaylists.find(p => p.uuid === playlistId);
        if (current) {
            setPlaylist(current);
            const allVideos = storage.getVideos();
            setVideos(allVideos.filter(v => current.videoIds.includes(v.uuid)));
        }
        setIsLoading(false);
    }, [playlistId]);

    useEffect(() => {
        loadPlaylist();
    }, [loadPlaylist]);

    const deleteVideo = (videoUuid: string) => {
        if (!playlistId) return;
        storage.deleteVideo(videoUuid, playlistId);
        loadPlaylist();
    };

    const renamePlaylist = (newName: string) => {
        if (!playlist) return;
        const updated = { ...playlist, name: newName.trim() };
        storage.updatePlaylist(updated);
        setPlaylist(updated);
    };

    return {
        playlist,
        videos,
        isLoading,
        refresh: loadPlaylist,
        deleteVideo,
        renamePlaylist
    };
};
