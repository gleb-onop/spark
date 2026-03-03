import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../utils/storage';
import type { Playlist, Video } from '../types';
import ShelfCard from '../components/ShelfCard.tsx';
import { Plus, Sparkles, ChevronRight } from 'lucide-react';

const PlaylistsPage = () => {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [videos, setVideos] = useState<Video[]>([]);

    useEffect(() => {
        setPlaylists(storage.getPlaylists());
        setVideos(storage.getVideos());
    }, []);

    if (playlists.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center px-5 py-24 text-center">
                <Sparkles className="w-16 h-16 mb-5 text-accent animate-pulse" />
                <h2 className="text-2xl mb-2 font-extrabold tracking-tight">Пока нет плейлистов</h2>
                <p className="text-muted-foreground text-sm mb-8 max-w-[240px]">
                    Создайте свой первый плейлист и начните учить английский
                </p>
                <Link
                    to="/add"
                    className="flex items-center justify-center gap-2 w-full p-4 bg-transparent border-2 border-dashed border-border rounded-2xl text-foreground font-bold hover:border-accent hover:text-accent transition-all no-underline shadow-sm"
                >
                    <Plus className="h-5 w-5" />
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
                                className="no-underline text-inherit flex items-center gap-2 group"
                            >
                                <h2 className="m-0 text-xl font-extrabold tracking-tight group-hover:text-accent transition-colors">{playlist.name}</h2>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">{playlistVideos.length}</span>
                            </Link>
                            <Link
                                to={`/playlist/${playlist.uuid}`}
                                className="text-xs text-accent no-underline font-bold flex items-center gap-0.5 hover:translate-x-1 transition-transform"
                            >
                                все <ChevronRight className="h-3 w-3" />
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
                className="flex items-center justify-center gap-2 w-full p-5 bg-transparent border-2 border-dashed border-border rounded-2xl text-foreground font-bold mt-8 hover:border-accent hover:text-accent transition-all no-underline shadow-sm mb-10"
            >
                <Plus className="h-5 w-5" />
                Создать плейлист
            </Link>
        </div>
    );
};

export default PlaylistsPage;
