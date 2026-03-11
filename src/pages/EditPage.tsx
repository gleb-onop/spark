import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
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
                        showUrlInput={false}
                        onDurationReady={actions.handleDurationReady}
                        duration={state.duration}
                        timeStart={state.timeStart}
                        timeEnd={state.timeEnd}
                        setTimeStart={actions.setTimeStart}
                        setTimeEnd={actions.setTimeEnd}
                    />

                    <SegmentConfig
                        description={state.description}
                        setDescription={actions.setDescription}
                    />

                    {state.error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in shake-1 duration-500">
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{state.error}</p>
                        </div>
                    )}

                    <button
                        onClick={actions.handleSave}
                        disabled={state.isSaving}
                        className="h-16 w-full mt-4 bg-brand text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_8px_30px_rgb(255,107,53,0.3)] hover:shadow-[0_8px_30px_rgb(255,107,53,0.5)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-3 group"
                    >
                        {state.isSaving ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <span>Сохранить</span>
                                <div className="h-1.5 w-1.5 rounded-full bg-white group-hover:animate-ping" />
                            </>
                        )}
                    </button>
                </section>
            </main>
        </div>
    );
};

export default EditPage;

