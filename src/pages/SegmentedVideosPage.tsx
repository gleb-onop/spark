import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { SegmentedVideo, Segment } from '../types';
import ShelfCard from '../components/ShelfCard';
import { Plus, Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';

const SegmentedVideosPage = () => {
    const [segmentedVideos, setSegmentedVideos] = useState<SegmentedVideo[]>([]);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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
        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
        );
    }

    if (segmentedVideos.length === 0) {
        return (
            <div className="flex flex-col min-h-screen">
                <PageHeader title="Spark" />
                <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 text-center animate-in fade-in zoom-in duration-500">
                    <div className="p-6 bg-accent/10 rounded-full mb-6">
                        <Sparkles className="w-12 h-12 text-accent" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight mb-2">Начнем обучение?</h2>
                    <p className="text-muted-foreground text-sm mb-10 max-w-[280px] leading-relaxed">
                        Пока нет сегментированных видео. Создайте первое и добавьте сегмент.
                    </p>
                    <Button asChild size="lg" className="w-full h-16 rounded-2xl shadow-xl shadow-brand/20 bg-brand hover:bg-brand/90 text-white font-bold text-lg">
                        <Link to="/add">
                            Создать сегментированное видео
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
                {segmentedVideos.map(segmentedVideo => {
                    const segmentedVideoSegments = segments.filter(v => segmentedVideo.segmentIds.includes(v.uuid));
                    return (
                        <section key={segmentedVideo.uuid} className="mt-8">
                            <div className="flex justify-between items-end mb-4 px-1">
                                <div className="flex flex-col gap-0.5">
                                    <h2 className="m-0 text-2xl font-black tracking-tight leading-none group">
                                        <Link
                                            to={`/segmented-video/${segmentedVideo.uuid}`}
                                            className="no-underline text-inherit hover:text-accent transition-colors"
                                        >
                                            {segmentedVideo.name}
                                        </Link>
                                    </h2>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{segmentedVideoSegments.length} сегментов</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <Button variant="ghost" asChild size="sm" className="text-brand font-bold h-8 hover:bg-brand/10 px-2 min-w-0">
                                        <Link to={`/segmented-video/${segmentedVideo.uuid}`} className="flex items-center gap-0.5">
                                            <span className="text-xs">все</span>
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            <div className="no-scrollbar flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-1 px-1">
                                {segmentedVideoSegments.map(segment => (
                                    <ShelfCard key={segment.uuid} segment={segment} segmentedVideoId={segmentedVideo.uuid} />
                                )) || null}
                            </div>
                        </section>
                    );
                })}
            </main>
        </div>
    );
};

export default SegmentedVideosPage;

