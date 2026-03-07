import { useParams } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { YouTubeInputSection } from '../components/AddPage/YouTubeInputSection';
import { SegmentConfig } from '../components/AddPage/SegmentConfig';
import { useEditSegment } from '../hooks/useEditSegment';

const EditPage = () => {
    const { segmentedVideoId, segmentId } = useParams<{ segmentedVideoId: string; segmentId: string }>();
    const { state, actions } = useEditSegment({ segmentId, segmentedVideoId });

    if (state.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background pb-24">
            <PageHeader
                title="Редактировать"
                backPath={-1}
            />

            <main className="p-5 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section className="flex flex-col gap-6">
                    <YouTubeInputSection
                        youtubeId={state.youtubeId}
                        title={state.title}
                        setTitle={actions.setTitle}
                        showUrlInput={false}
                    />

                    <SegmentConfig
                        description={state.description}
                        setDescription={actions.setDescription}
                        useRange={state.useRange}
                        setUseRange={actions.setUseRange}
                        timeStart={state.timeStart}
                        setTimeStart={actions.setTimeStart}
                        timeEnd={state.timeEnd}
                        setTimeEnd={actions.setTimeEnd}
                    />

                    {state.error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in shake-1 duration-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <p className="text-red-500 text-xs font-bold leading-tight">{state.error}</p>
                        </div>
                    )}
                </section>

                <Button
                    size="lg"
                    onClick={actions.handleSave}
                    disabled={state.isSaving}
                    className="h-16 rounded-2xl shadow-xl shadow-accent/30 font-bold text-lg transition-transform active:scale-95"
                >
                    {state.isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                            Сохранение...
                        </>
                    ) : (
                        <>
                            <Check className="mr-2 h-6 w-6" />
                            Сохранить изменения
                        </>
                    )}
                </Button>
            </main>
        </div>
    );
};

export default EditPage;

