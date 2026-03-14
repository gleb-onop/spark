import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseTime, formatTime } from '@/utils/time';
import type { Segment } from '@/types';

interface SegmentsProgressBarProps {
    segments: Segment[];
    currentSegmentUuid: string;
    segmentedVideoId: string;
    progressPct?: number;
    isOverlay?: boolean;
    onSeek?: (segmentUuid: string, pct: number) => void;
}

const getSegmentDuration = (segment: Segment) => {
    const start = parseTime(segment.timeStart);
    let end = segment.timeEnd ? parseTime(segment.timeEnd) : segment.video.duration;

    if (!end && segment.video.duration) {
        end = segment.video.duration;
    }

    const duration = Math.max(0, (end || 0) - start);
    return duration;
};

export const SegmentsProgressBar = ({
    segments,
    currentSegmentUuid,
    segmentedVideoId,
    progressPct = 0,
    isOverlay = false,
    onSeek
}: SegmentsProgressBarProps) => {
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [tooltipX, setTooltipX] = useState(0);

    const segmentDurations = useMemo(() =>
        (segments || []).map(getSegmentDuration),
        [segments]
    );

    const totalDuration = useMemo(() =>
        segmentDurations.reduce((sum: number, dur: number) => sum + dur, 0),
        [segmentDurations]
    );

    if (!segments || segments.length <= 1) return null;

    const currentSegmentIndex = segments.findIndex(s => s.uuid === currentSegmentUuid);

    const handleSegmentClick = (e: React.MouseEvent, segmentUuid: string) => {
        if (!onSeek) return;

        e.preventDefault();
        e.stopPropagation();

        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const pct = (offsetX / rect.width) * 100;

        onSeek(segmentUuid, Math.max(0, Math.min(100, pct)));
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isOverlay) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        setHoverTime(pct * totalDuration);
        setTooltipX(x);
    };

    const handleMouseLeave = () => {
        setHoverTime(null);
    };

    return (
        <div
            className={cn(
                "w-full flex flex-col gap-2 relative group select-none",
                isOverlay ? "absolute bottom-8.5 left-0 z-30 px-2 pt-1" : "pt-2"
            )}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Tooltip */}
            {isOverlay && hoverTime !== null && (
                <div
                    className="absolute bottom-full mb-2 px-2 py-1 bg-black/95 text-white text-[11px] font-bold rounded-sm pointer-events-none z-50 transition-opacity duration-150 border border-white/10"
                    style={{
                        left: tooltipX,
                        transform: 'translateX(-50%)'
                    }}
                >
                    {formatTime(hoverTime)}
                </div>
            )}

            {/* Background Gradient (Shadow/Scrim behind bar for visibility and protection) */}
            {isOverlay && (
                <div
                    className="absolute inset-x-0 -top-10 bottom-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent cursor-pointer"
                    onClick={(e) => {
                        // Find the target segment under the click or just use the current one's context
                        // For simplicity and safety, we skip direct seeking on the scrim
                        // but capture the click to prevent it hitting the native bar.
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                />
            )}

            {!isOverlay && (
                <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                    <span>
                        Сегмент {currentSegmentIndex !== -1 ? currentSegmentIndex + 1 : '-'}/{segments.length}
                    </span>
                    <span className="flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {formatTime(totalDuration)}
                    </span>
                </div>
            )}

            {/* Protective Overlay & Bar Container */}
            <div className={cn(
                "w-full flex items-center transition-all duration-200 relative z-10",
                isOverlay ? "h-[14px] md:h-4" : "h-4"
            )}>
                <div className={cn(
                    "flex w-full overflow-hidden transition-all duration-300",
                    isOverlay
                        ? "h-full bg-white/10 border-y border-white/20 backdrop-blur-md"
                        : "h-3 bg-muted/30 border border-border/50 rounded-sm shadow-inner"
                )}>
                    {segments.map((segment, index) => {
                        const duration = segmentDurations[index];
                        const widthPercent = totalDuration > 0 ? (duration / totalDuration) * 100 : (100 / segments.length);
                        const isCurrent = segment.uuid === currentSegmentUuid;
                        const isPassed = currentSegmentIndex !== -1 && index < currentSegmentIndex;

                        return (
                            <Link
                                key={segment.uuid}
                                to={`/segmented-videos/${segmentedVideoId}/segments/${segment.uuid}`}
                                title={segment.description || `Сегмент ${index + 1}`}
                                onClick={(e) => isOverlay && handleSegmentClick(e, segment.uuid)}
                                className={cn(
                                    "h-full transition-all duration-300 relative overflow-hidden",
                                    isOverlay
                                        ? "hover:brightness-125 active:scale-[0.98] border-r-[4px] border-black/60"
                                        : "hover:brightness-110 border-r-2 border-background/40",
                                    isPassed ? "bg-brand" : (isCurrent ? "bg-white/30" : "bg-white/10")
                                )}
                                style={{
                                    flex: `${widthPercent} 1 0%`,
                                    minWidth: '4px',
                                    borderRightColor: index === segments.length - 1 ? 'transparent' : undefined
                                }}
                            >
                                {isCurrent && (
                                    <div
                                        className="absolute left-0 top-0 h-full bg-brand will-change-[width]"
                                        style={{ width: `${progressPct}%` }}
                                    />
                                )}
                                {isOverlay && isCurrent && (
                                    <div
                                        className="absolute top-0 h-full w-[1px] bg-white z-10 will-change-[left]"
                                        style={{ left: `${progressPct}%` }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                :root {
                    --brand-rgb: 255, 60, 0;
                }
            `}} />
        </div>
    );
};
