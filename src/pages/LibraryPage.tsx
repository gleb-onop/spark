import { Link } from 'react-router-dom';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { useSegmentedVideos } from '@/hooks/useSegmentedVideos';
import { EmptyState } from '@/components/EmptyState';
import { SegmentedVideoShelfSection } from '@/components/SegmentedVideoShelfSection';

const LibraryPage = () => {
    const { segmentedVideos, segments, isLoading } = useSegmentedVideos();

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
                <EmptyState
                    icon={<Sparkles className="w-12 h-12 text-accent" />}
                    title="Начнем обучение?"
                    description="Пока нет сегментированных видео. Создайте первое и добавьте сегмент."
                    actionLabel="Создать сегментированное видео"
                    actionTo="/segmented-videos/new"
                />
            </div>
        );
    }

    return (
        <div className="bg-background pb-24 md:pb-8">
            <PageHeader
                title="Spark"
                actions={
                    <Button size="icon" asChild className="rounded-full shadow-lg shadow-brand/20 bg-brand hover:bg-brand/90 text-white">
                        <Link to="/segmented-videos/new">
                            <Plus className="h-5 w-5" />
                        </Link>
                    </Button>
                }
            />

            {/* Desktop header (since PageHeader is md:hidden) */}
            <div className="hidden md:flex mobile-landscape:flex items-center justify-between px-8 pt-8 pb-4">
                <h1 className="text-4xl font-black tracking-tight mobile-landscape:text-2xl">Сегментированные видео</h1>
                <Button asChild className="rounded-xl shadow-lg shadow-brand/20 bg-brand hover:bg-brand/90 text-white md:w-auto md:px-4">
                    <Link to="/segmented-videos/new" className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        <span>Добавить</span>
                    </Link>
                </Button>
            </div>

            <main className="flex-1 px-5 md:px-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {segmentedVideos.map(video => (
                    <SegmentedVideoShelfSection
                        key={video.uuid}
                        segmentedVideo={video}
                        segments={segments}
                    />
                ))}
            </main>
        </div>
    );
};

export default LibraryPage;

