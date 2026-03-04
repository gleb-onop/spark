import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import type { Playlist, Fragment } from '../types';

export function usePlaylist(playlistId: string | undefined) {
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [fragments, setFragments] = useState<Fragment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadPlaylist = useCallback(() => {
        if (!playlistId) {
            setPlaylist(null);
            setFragments([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const allPlaylists = storage.getPlaylists();
        const found = allPlaylists.find(p => p.uuid === playlistId);

        if (found) {
            setPlaylist(found);
            const allFragments = storage.getFragments();
            // Filter fragments that belong to this playlist using fragmentIds array
            const playlistFragments = allFragments.filter(v => found.fragmentIds.includes(v.uuid));
            // Sort fragments by createdAt timestamp
            const sortedFragments = [...playlistFragments].sort((a, b) =>
                a.createdAt.localeCompare(b.createdAt)
            );
            setFragments(sortedFragments);
        } else {
            setPlaylist(null);
            setFragments([]);
        }
        setIsLoading(false);
    }, [playlistId]);

    useEffect(() => {
        loadPlaylist();
    }, [loadPlaylist]);

    const deleteFragment = (fragmentUuid: string) => {
        if (playlistId) {
            storage.deleteFragment(fragmentUuid, playlistId);
            loadPlaylist();
        }
    };

    const renamePlaylist = (newName: string) => {
        if (!playlist) return;
        const updated = { ...playlist, name: newName.trim() };
        storage.updatePlaylist(updated);
        setPlaylist(updated);
    };

    return {
        playlist,
        fragments,
        isLoading,
        refreshPlaylist: loadPlaylist,
        deleteFragment,
        renamePlaylist
    };
}
