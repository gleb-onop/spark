import { Link } from 'react-router-dom';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { useSegmentedVideos } from '@/hooks/useSegmentedVideos';
import { EmptyState } from '@/components/EmptyState';
import { SegmentedVideoShelfSection } from '@/components/SegmentedVideoShelfSection';

const SegmentedVideosPage = () => {
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
                    actionTo="/add"
                />
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

export default SegmentedVideosPage;

