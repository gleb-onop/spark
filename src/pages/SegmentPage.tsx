import { useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Info, Edit2, Scissors } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { useSegmentedVideo } from '@/hooks/useSegmentedVideo';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { usePlayerControls } from '@/hooks/usePlayerControls';
import { useLoopSetting } from '@/hooks/useLoopSetting';
import { useSegmentNavigation } from '@/hooks/useSegmentNavigation';
import { ExpandableDescription } from '@/components/ExpandableDescription';
import { PlayerControls } from '@/components/PlayerControls';

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

    // Container ref for fullscreen API
    const containerRef = useRef<HTMLDivElement>(null);

    const { playerRef } = useYouTubePlayer({
        youtubeId: segment?.video.youtubeId || '',
        timeStart: segment?.timeStart || null,
        timeEnd: segment?.timeEnd || null,
        onComplete,
        onSegmentEnded: onComplete,
        exposePlayerRef: true,
    });

    const controls = usePlayerControls({
        playerRef,
        timeStart: segment?.timeStart || null,
        timeEnd: segment?.timeEnd || null,
        containerRef: containerRef as React.RefObject<HTMLElement>,
        isVertical: segment?.video.isVertical,
    });

    if (!segment || !segmentedVideo) return null;

    const descriptionText = segment.description || segment.video.description || '';
    const playerPaddingTop = segment.video.isVertical ? '100%' : '56.25%';

    return (
        <div className="flex flex-col flex-1 bg-background pb-12 overflow-x-hidden">
            <PageHeader
                title={segmentedVideo.name}
                backPath={`/segmented-videos/${segmentedVideoId}`}
                actions={
                    <Button variant="ghost" size="icon" asChild className="rounded-full">
                        <Link to={`/segmented-videos/${segmentedVideoId}/segments/${segment.uuid}/edit`}>
                            <Edit2 className="h-4 w-4" />
                        </Link>
                    </Button>
                }
            />

            {/*
             * containerRef wraps player + controls so that requestFullscreen()
             * called on it puts both iframe AND controls into fullscreen.
             * It is also sticky so it stays at the top while scrolling.
             */}
            <div
                ref={containerRef}
                className="w-full bg-black sticky top-[61px] z-20 shadow-xl"
            >
                {/* YouTube iframe – changing padding/dimensions for responsive vs fullscreen */}
                <div style={
                    controls.isFullscreen
                        ? { height: '100vh', width: '100vw', position: 'relative' }
                        : { paddingTop: playerPaddingTop, position: 'relative' }
                }>
                    <div id="youtube-player" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
                </div>

                {/* Controls – always inside containerRef.
                    In normal mode: block flow below iframe.
                    In fullscreen: position absolute at bottom (handled inside component). */}
                <PlayerControls
                    containerRef={containerRef as React.RefObject<HTMLElement>}
                    {...controls}
                />
            </div>

            <main className="px-5 py-5 flex flex-col gap-6 fade-in duration-500 w-full max-w-full">
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
