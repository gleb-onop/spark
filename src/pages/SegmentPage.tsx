import { useParams, Link } from 'react-router-dom';
import { Info, Edit2, Scissors } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { useSegmentedVideo } from '@/hooks/useSegmentedVideo';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { useLoopSetting } from '@/hooks/useLoopSetting';
import { useSegmentNavigation } from '@/hooks/useSegmentNavigation';
import { ExpandableDescription } from '@/components/ExpandableDescription';

const SegmentPage = () => {
    const { segmentedVideoId, segmentId } = useParams<{ segmentedVideoId: string; segmentId: string }>();

    const { segmentedVideo, segments } = useSegmentedVideo(segmentedVideoId);
    const segment = segments.find(f => f.uuid === segmentId);

    const { isLooping, toggleLoop } = useLoopSetting();
    const { onComplete } = useSegmentNavigation({
        segmentedVideo,
        segment,
        segmentedVideoId,
        isLooping
    });

    useYouTubePlayer({
        youtubeId: segment?.video.youtubeId || '',
        timeStart: segment?.timeStart || null,
        timeEnd: segment?.timeEnd || null,
        onComplete,
        onSegmentEnded: onComplete,
    });

    if (!segment || !segmentedVideo) return null;

    const descriptionText = segment.description || segment.video.description || '';

    return (
        <div className="flex flex-col min-h-screen bg-background pb-24">
            <PageHeader
                title={segmentedVideo.name}
                backPath={`/segmented-video/${segmentedVideoId}`}
                actions={
                    <Button variant="ghost" size="icon" asChild className="rounded-full">
                        <Link to={`/edit/${segment.uuid}/${segmentedVideoId}`}>
                            <Edit2 className="h-4 w-4" />
                        </Link>
                    </Button>
                }
            />

            <div className="w-full bg-black aspect-video sticky top-[61px] z-20 shadow-xl overflow-hidden" style={{
                paddingTop: segment.video.isVertical ? '100%' : '56.25%',
            }}>
                <div id="youtube-player" className="absolute top-0 left-0 w-full h-full" />
            </div>

            <main className="p-5 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section>
                    {segment.timeStart && (
                        <div className="flex items-center gap-2 text-sm text-brand font-black mb-4 bg-brand/10 w-fit px-3 py-1 rounded-xl border border-brand/20 shadow-sm animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
                            <Scissors className="h-4 w-4" />
                            <span>{segment.timeStart} {segment.timeEnd ? `– ${segment.timeEnd}` : ''}</span>
                        </div>
                    )}

                    <ExpandableDescription text={descriptionText} />
                </section>

                <section className="flex flex-col gap-4">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="p-2 bg-accent/10 rounded-xl shrink-0">
                                <Info className="h-5 w-5 text-accent" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <Label htmlFor="loop-toggle" className="text-sm font-bold cursor-pointer">
                                    Зациклить сегментированное видео
                                </Label>
                                <span className="text-[10px] text-muted-foreground truncate">Авто-повтор текущего списка</span>
                            </div>
                        </div>
                        <Switch
                            id="loop-toggle"
                            checked={isLooping}
                            onCheckedChange={toggleLoop}
                        />
                    </div>
                </section>
            </main>
        </div>
    );
};

export default SegmentPage;

