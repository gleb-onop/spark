import type { Playlist, Fragment } from '../types';

const PLAYLISTS_KEY = 'spark_playlists';
const FRAGMENTS_KEY = 'spark_fragments';

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

    getFragments: (): Fragment[] => {
        try {
            const data = localStorage.getItem(FRAGMENTS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error parsing fragments:', e);
            return [];
        }
    },

    saveFragments: (fragments: Fragment[]) => {
        localStorage.setItem(FRAGMENTS_KEY, JSON.stringify(fragments));
    },

    addPlaylist: (name: string): Playlist => {
        const playlists = storage.getPlaylists();
        const newPlaylist: Playlist = {
            uuid: crypto.randomUUID(),
            name,
            createdAt: Date.now(),
            fragmentIds: [],
        };
        storage.savePlaylists([newPlaylist, ...playlists]);
        return newPlaylist;
    },

    deletePlaylist: (uuid: string) => {
        const allPlaylists = storage.getPlaylists();
        const playlistToDelete = allPlaylists.find(p => p.uuid === uuid);

        if (playlistToDelete) {
            const allFragments = storage.getFragments();
            const remainingFragments = allFragments.filter(v => !playlistToDelete.fragmentIds.includes(v.uuid));
            storage.saveFragments(remainingFragments);
        }

        const remainingPlaylists = allPlaylists.filter(p => p.uuid !== uuid);
        storage.savePlaylists(remainingPlaylists);
    },

    updatePlaylist: (updated: Playlist) => {
        const playlists = storage.getPlaylists().map(p =>
            p.uuid === updated.uuid ? updated : p
        );
        storage.savePlaylists(playlists);
    },

    getFragment: (uuid: string): Fragment | undefined => {
        return storage.getFragments().find(v => v.uuid === uuid);
    },

    updateFragment: (uuid: string, updated: Partial<Fragment>) => {
        const fragments = storage.getFragments().map(v =>
            v.uuid === uuid ? { ...v, ...updated } : v
        );
        storage.saveFragments(fragments);
    },

    addFragment: (fragment: Omit<Fragment, 'uuid' | 'createdAt'>, playlistUuid: string): Fragment => {
        const fragments = storage.getFragments();
        const newFragment: Fragment = {
            ...fragment,
            uuid: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        };

        storage.saveFragments([...fragments, newFragment]);

        const playlists = storage.getPlaylists();
        const updatedPlaylists = playlists.map(p => {
            if (p.uuid === playlistUuid) {
                return { ...p, fragmentIds: [...p.fragmentIds, newFragment.uuid] };
            }
            return p;
        });
        storage.savePlaylists(updatedPlaylists);

        return newFragment;
    },

    deleteFragment: (fragmentUuid: string, playlistUuid?: string) => {
        if (playlistUuid) {
            const playlists = storage.getPlaylists();
            const updatedPlaylists = playlists.map(p => {
                if (p.uuid === playlistUuid) {
                    return { ...p, fragmentIds: p.fragmentIds.filter(id => id !== fragmentUuid) };
                }
                return p;
            });
            storage.savePlaylists(updatedPlaylists);
        } else {
            const fragments = storage.getFragments().filter(v => v.uuid !== fragmentUuid);
            storage.saveFragments(fragments);

            const playlists = storage.getPlaylists();
            const updatedPlaylists = playlists.map(p => ({
                ...p,
                fragmentIds: p.fragmentIds.filter(id => id !== fragmentUuid)
            }));
            storage.savePlaylists(updatedPlaylists);
        }
    },

    addPlaylistWithFragment: (playlistName: string, fragmentData: Omit<Fragment, 'uuid' | 'createdAt'>): { playlist: Playlist; fragment: Fragment } => {
        const newPlaylist = storage.addPlaylist(playlistName);

        const fragments = storage.getFragments();
        const newFragment: Fragment = {
            ...fragmentData,
            uuid: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        };
        storage.saveFragments([...fragments, newFragment]);

        const playlists = storage.getPlaylists();
        const updatedPlaylists = playlists.map(p => {
            if (p.uuid === newPlaylist.uuid) {
                return { ...p, fragmentIds: [newFragment.uuid] };
            }
            return p;
        });
        storage.savePlaylists(updatedPlaylists);

        return { playlist: newPlaylist, fragment: newFragment };
    }
};
