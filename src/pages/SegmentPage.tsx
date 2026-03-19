import { useRef, useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Info, Edit2, Maximize, Minimize, Loader2, ChevronLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { useSegmentedVideo } from '@/hooks/useSegmentedVideo';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { useProgressSync } from '../hooks/useProgressSync';
import { useLoopSetting } from '@/hooks/useLoopSetting';
import { useSegmentNavigation } from '@/hooks/useSegmentNavigation';
import { ExpandableDescription } from '@/components/ExpandableDescription';
import { SegmentThumbnail } from '@/components/SegmentThumbnail';
import { SegmentTimeLabel } from '@/components/SegmentTimeLabel';
import { SegmentsProgressBar } from '@/components/SegmentsProgressBar';
import { useControlsVisibility } from '@/hooks/useControlsVisibility';
import { useOrientationFullscreen } from '@/hooks/useOrientationFullscreen';
import { cn } from '@/lib/tailwind';

const isFullscreenSupported = typeof document !== 'undefined' && !!document.fullscreenEnabled;

const SegmentPage = () => {
    const { segmentedVideoId, segmentId } = useParams<{ segmentedVideoId: string; segmentId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const { segmentedVideo, segments, isLoading } = useSegmentedVideo(segmentedVideoId);
    const segment = segments.find(f => f.uuid === segmentId);

    const { isLooping, toggleLoop } = useLoopSetting();
    const { onComplete } = useSegmentNavigation({
        segmentedVideo,
        segment,
        segmentedVideoId,
        isLooping
    });

    // Detect initial seek percentage from navigation state
    const initialSeekPct = location.state?.seekPct ?? null;

    // Container ref for fullscreen API and coordinate tracking
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Custom controls visibility logic
    const { showControls, resetTimer } = useControlsVisibility(containerRef, isFullscreen);

    // Auto fullscreen on landscape rotation
    useOrientationFullscreen(containerRef, isFullscreen);

    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(() => { });
        } else {
            document.exitFullscreen();
        }
    }, []);

    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement && document.fullscreenElement === containerRef.current);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'KeyF' && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
                const target = e.target as HTMLElement;
                const isInput = target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable;
                if (!isInput) {
                    e.preventDefault();
                    toggleFullscreen();
                    resetTimer();
                }
            }
        };

        document.addEventListener('fullscreenchange', handleFsChange);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [resetTimer, toggleFullscreen]);

    const [playerElement, setPlayerElement] = useState<HTMLDivElement | null>(null);

    const { playerRef } = useYouTubePlayer({
        youtubeId: segment?.video.youtubeId || '',
        timeStart: segment?.timeStart || null,
        timeEnd: segment?.timeEnd || null,
        initialSeekPct,
        onComplete,
        onSegmentEnded: onComplete,
        playerElement
    });

    const progressSync = useProgressSync({
        playerRef,
        timeStart: segment?.timeStart || null,
        timeEnd: segment?.timeEnd || null,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
        );
    }

    if (!segment || !segmentedVideo) return null;

    const descriptionText = segment.description || segment.video.description || '';
    const playerPaddingTop = segment.video.isVertical ? 'min(177.78%, 85vh)' : '56.25%';

    return (
        <div className="bg-background pb-24 md:pb-8">
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

            {/* Desktop header */}
            <div className="hidden md:flex items-center justify-between px-8 pt-8 pb-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    <Button variant="ghost" size="icon" asChild className="rounded-full h-10 w-10 shrink-0">
                        <Link to={`/segmented-videos/${segmentedVideoId}`}>
                            <ChevronLeft className="h-6 w-6" />
                        </Link>
                    </Button>
                    <h1 className="text-4xl font-black tracking-tight truncate">{segmentedVideo.name}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" className="rounded-xl px-4">
                        <Link to={`/segmented-videos/${segmentedVideoId}/segments/${segment.uuid}/edit`} className="flex items-center gap-2">
                            <Edit2 className="h-4 w-4" />
                            <span>Редактировать</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Desktop: 3-column grid. Mobile: single column */}
            <div className="md:grid md:grid-cols-3 md:gap-6 md:px-8 md:pb-8">
                {/* Player — 2 columns on desktop */}
                <div className="md:col-span-2">
                    <div
                        ref={containerRef}
                        className={cn(
                            "w-full bg-black relative z-20 shadow-xl md:top-auto md:rounded-2xl md:overflow-hidden outline-none group flex flex-col",
                            !segment.video.isVertical && "sticky top-[61px]",
                            "fullscreen:fixed fullscreen:inset-0 fullscreen:h-screen fullscreen:w-screen fullscreen:rounded-none",
                            "webkit-fullscreen:fixed webkit-fullscreen:inset-0 webkit-fullscreen:h-screen webkit-fullscreen:w-screen"
                        )}
                        tabIndex={0}
                    >


                        <div
                            className={cn(
                                "relative w-full overflow-hidden flex-1 flex flex-col justify-center",
                                "fullscreen:h-full webkit-fullscreen:h-full"
                            )}
                            style={{ paddingTop: isFullscreen ? 0 : playerPaddingTop }}
                        >

                            <div
                                ref={setPlayerElement}
                                className="absolute inset-0 w-full h-full"
                            />

                            {/* Wake-up Scrim: Catches mouse movement when controls are hidden 
                                (YouTube IFrame blocks mousemove on the parent container) */}
                            <div
                                className={cn(
                                    "absolute inset-0 z-20 bg-transparent",
                                    showControls ? "pointer-events-none" : "pointer-events-auto"
                                )}
                                onMouseMove={resetTimer}
                                onMouseEnter={resetTimer}
                                onTouchStart={resetTimer}
                            />

                            {/* Fullscreen Toggle Button - Internal */}
                            {isFullscreenSupported && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleFullscreen}
                                    className={cn(
                                        "absolute right-4 bottom-[70%] z-40 rounded-full bg-transparent hover:bg-black/40 text-white transition-all duration-300",
                                        showControls ? "opacity-100" : "opacity-0 pointer-events-none"
                                    )}
                                >
                                    {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                                </Button>
                            )}
                        </div>

                        {/* Minimalist Integrated Progress Bar - Extreme Bottom Edge */}
                        <div className="absolute bottom-0 left-0 right-0 z-30 transition-all duration-500 ease-in-out px-0 pb-0 opacity-100">

                            <SegmentsProgressBar
                                segments={segments}
                                currentSegmentUuid={segment.uuid}
                                segmentedVideoId={segmentedVideoId!}
                                progressPct={progressSync.progressPct}
                                isOverlay={true}
                                onSeek={(uuid, pct) => {
                                    if (uuid === segment.uuid) {
                                        progressSync.seek(pct);
                                    } else {
                                        navigate(`/segmented-videos/${segmentedVideoId}/segments/${uuid}`, {
                                            state: { seekPct: pct }
                                        });
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Info under player */}
                    <main className="px-5 py-5 flex flex-col gap-6 fade-in duration-500 w-full max-w-full md:px-0 md:pt-6">
                        <section className="flex flex-col gap-4">
                            {segment.timeStart && (
                                <SegmentTimeLabel timeStart={segment.timeStart} timeEnd={segment.timeEnd} variant="full" showMs />
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

                {/* Segment list sidebar — desktop only, 1 column */}
                <div className="hidden md:block md:col-span-1">
                    <div className="sticky top-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Сегменты</h3>
                            <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">{segments.length}</span>
                        </div>
                        <div className="flex flex-col gap-2 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
                            {segments.map(seg => (
                                <Link
                                    key={seg.uuid}
                                    to={`/segmented-videos/${segmentedVideoId}/segments/${seg.uuid}`}
                                    className={cn(
                                        "flex items-center gap-3 p-2 rounded-xl no-underline transition-all duration-200",
                                        seg.uuid === segmentId
                                            ? "bg-brand/10 ring-1 ring-brand/30"
                                            : "hover:bg-muted/50 text-inherit"
                                    )}
                                >
                                    <SegmentThumbnail
                                        youtubeId={seg.video.youtubeId}
                                        title={seg.description}
                                        size="sm"
                                        className="shrink-0 w-16"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium line-clamp-2">{seg.description || 'Без описания'}</div>
                                        {seg.timeStart && (
                                            <SegmentTimeLabel timeStart={seg.timeStart} timeEnd={seg.timeEnd} variant="compact" />
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SegmentPage;

