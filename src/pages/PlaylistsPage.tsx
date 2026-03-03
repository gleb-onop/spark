import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../utils/storage';
import type { Playlist, Video } from '../types';
import ShelfCard from '../components/ShelfCard.tsx';
import { Plus, Sparkles, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';

const PlaylistsPage = () => {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [videos, setVideos] = useState<Video[]>([]);

    useEffect(() => {
        setPlaylists(storage.getPlaylists());
        setVideos(storage.getVideos());
    }, []);

    if (playlists.length === 0) {
        return (
            <div className="flex flex-col min-h-screen">
                <PageHeader title="Spark" />
                <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 text-center animate-in fade-in zoom-in duration-500">
                    <div className="p-6 bg-accent/10 rounded-full mb-6">
                        <Sparkles className="w-12 h-12 text-accent" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight mb-2">Начнем обучение?</h2>
                    <p className="text-muted-foreground text-sm mb-10 max-w-[280px] leading-relaxed">
                        Создайте свой первый плейлист и добавляйте видео для изучения английского.
                    </p>
                    <Button asChild size="lg" className="w-full h-16 rounded-2xl shadow-xl shadow-brand/20 bg-brand hover:bg-brand/90 text-white font-bold text-lg">
                        <Link to="/add">
                            <Plus className="mr-2 h-6 w-6" />
                            Создать плейлист
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background pb-12">
            <PageHeader
                title="Spark"
                actions={
                    <Button size="icon" asChild className="rounded-full shadow-lg shadow-brand/20 bg-brand hover:bg-brand/90 text-white">
                        <Link to="/add">
                            <Plus className="h-5 w-5" />
                        </Link>
                    </Button>
                }
            />

            <main className="flex-1 px-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {playlists.map(playlist => {
                    const playlistVideos = videos.filter(v => playlist.videoIds.includes(v.uuid));
                    return (
                        <section key={playlist.uuid} className="mt-8">
                            <div className="flex justify-between items-end mb-4 px-1">
                                <div className="flex flex-col gap-0.5">
                                    <h2 className="m-0 text-2xl font-black tracking-tight leading-none group">
                                        <Link
                                            to={`/playlist/${playlist.uuid}`}
                                            className="no-underline text-inherit hover:text-accent transition-colors"
                                        >
                                            {playlist.name}
                                        </Link>
                                    </h2>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{playlistVideos.length} видео</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <Button size="icon" asChild className="h-8 w-8 rounded-full bg-brand hover:bg-brand/90 text-white shadow-md shadow-brand/20">
                                        <Link to={`/add?playlistId=${playlist.uuid}`}>
                                            <Plus className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" asChild size="sm" className="text-brand font-bold h-8 hover:bg-brand/10 px-2 min-w-0">
                                        <Link to={`/playlist/${playlist.uuid}`} className="flex items-center gap-0.5">
                                            <span className="text-xs">все</span>
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            <div className="no-scrollbar flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-1 px-1">
                                {playlistVideos.map(video => (
                                    <ShelfCard key={video.uuid} video={video} playlistId={playlist.uuid} />
                                )) || null}
                            </div>
                        </section>
                    );
                })}
            </main>
        </div>
    );
};

export default PlaylistsPage;
