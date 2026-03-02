import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../utils/storage';
import type { Playlist, Video } from '../types';
import ShelfCard from '../components/ShelfCard.tsx';

const PlaylistsPage = () => {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [videos, setVideos] = useState<Video[]>([]);

    useEffect(() => {
        setPlaylists(storage.getPlaylists());
        setVideos(storage.getVideos());
    }, []);

    if (playlists.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                <span className="text-5xl mb-5 text-accent">✦</span>
                <h2 className="text-xl mb-2 font-bold">Пока нет плейлистов</h2>
                <p className="text-inactive text-sm mb-8">
                    Создайте первый и добавьте видео
                </p>
                <Link
                    to="/add"
                    className="w-full p-4 bg-transparent border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl text-inherit font-semibold cursor-pointer hover:border-accent hover:text-accent transition-colors no-underline text-center"
                >
                    Создать плейлист
                </Link>
            </div>
        );
    }

    return (
        <div className="px-5 pb-5">
            {playlists.map(playlist => {
                const playlistVideos = videos.filter(v => playlist.videoIds.includes(v.uuid));
                return (
                    <section key={playlist.uuid} className="mb-8">
                        <div className="flex justify-between items-baseline mb-3">
                            <Link
                                to={`/playlist/${playlist.uuid}`}
                                className="no-underline text-inherit flex items-baseline gap-2 group"
                            >
                                <h2 className="m-0 text-lg font-bold group-hover:text-accent transition-colors">{playlist.name}</h2>
                                <span className="text-xs text-inactive">{playlistVideos.length}</span>
                            </Link>
                            <Link
                                to={`/playlist/${playlist.uuid}`}
                                className="text-xs text-accent no-underline font-semibold"
                            >
                                все →
                            </Link>
                        </div>

                        <div className="no-scrollbar flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2">
                            {playlistVideos.map(video => (
                                <ShelfCard key={video.uuid} video={video} playlistId={playlist.uuid} />
                            ))}
                            <ShelfCard playlistId={playlist.uuid} isPlaceholder />
                        </div>
                    </section>
                );
            })}

            <Link
                to="/add"
                className="block w-full p-4 bg-transparent border border-dashed border-gray-300 dark:border-white/20 rounded-xl text-inherit font-semibold mt-5 cursor-pointer hover:border-accent hover:text-accent transition-colors no-underline text-center"
            >
                Создать плейлист
            </Link>
        </div>
    );
};

export default PlaylistsPage;
