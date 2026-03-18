import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
    const start = parseTime(segment.timeStart) || 0;
    let end = segment.timeEnd ? parseTime(segment.timeEnd) : (segment.video?.duration || 0);

    if (!end && segment.video?.duration) {
        end = segment.video.duration;
    }

    const duration = Math.max(0, (Number(end) || 0) - start);
    return isNaN(duration) ? 0 : duration;
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

    if (!segments || segments.length === 0) return null;

    const currentSegmentIndex = segments.findIndex(s => s.uuid === currentSegmentUuid);

    const cumulativeWidths = useMemo(() => {
        const widths: number[] = [];
        let total = 0;
        segmentDurations.forEach(dur => {
            const w = totalDuration > 0 ? (dur / totalDuration) * 100 : (100 / (segments || []).length);
            widths.push(total);
            total += w;
        });
        widths.push(total);
        return widths;
    }, [segmentDurations, totalDuration, segments]);

    const playheadAbsolutePct = useMemo(() => {
        if (currentSegmentIndex === -1) return 0;
        const passedWidth = cumulativeWidths[currentSegmentIndex];
        const currentWidth = (cumulativeWidths[currentSegmentIndex + 1] || 100) - passedWidth;
        return passedWidth + currentWidth * (progressPct / 100);
    }, [currentSegmentIndex, cumulativeWidths, progressPct]);

    const hoverAbsolutePct = hoverTime !== null && totalDuration > 0 ? (hoverTime / totalDuration) * 100 : null;

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
                "w-full flex flex-col gap-0 relative group select-none",
                isOverlay ? "z-30" : "pt-2 gap-2"
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


            {/* 3-Layer Progress Structure */}

            <div className={cn(
                "w-full flex items-center transition-all duration-200 relative z-10",
                isOverlay ? "h-[6px]" : "h-5"
            )}>
                {/* Layer 2: Background Tray */}
                <div className={cn(
                    "flex w-full transition-all duration-300 items-center px-0 relative",
                    isOverlay
                        ? "h-full"
                        : "h-3 bg-muted/20 border border-border/30 rounded-full"
                )}>
                    {/* Layer 3: Refined Adaptive Segments Bar with YouTube Gaps */}
                    <div className={cn(
                        "flex w-full gap-0.5 px-0 items-center",
                        isOverlay
                            ? "h-full"
                            : "h-[6px] rounded-full overflow-hidden"

                    )}>
                        {segments.map((segment, index) => {
                            const duration = segmentDurations[index];
                            const widthPercent = totalDuration > 0 ? (duration / totalDuration) * 100 : (100 / segments.length);
                            const isCurrent = segment.uuid === currentSegmentUuid;
                            const isPassed = currentSegmentIndex !== -1 && index < currentSegmentIndex;

                            // Calculate scrub preview for this segment
                            const segStart = cumulativeWidths[index];
                            const segEnd = cumulativeWidths[index + 1];
                            const showScrub = hoverAbsolutePct !== null && hoverAbsolutePct > playheadAbsolutePct;

                            let scrubStart = 0;
                            let scrubWidth = 0;

                            if (showScrub) {
                                const rangeStart = Math.max(segStart, playheadAbsolutePct);
                                const rangeEnd = Math.min(segEnd, hoverAbsolutePct!);
                                if (rangeEnd > rangeStart) {
                                    scrubStart = ((rangeStart - segStart) / (segEnd - segStart)) * 100;
                                    scrubWidth = ((rangeEnd - rangeStart) / (segEnd - segStart)) * 100;
                                }
                            }

                            return (
                                <Link
                                    key={segment.uuid}
                                    to={`/segmented-videos/${segmentedVideoId}/segments/${segment.uuid}`}
                                    title={segment.description || `Сегмент ${index + 1}`}
                                    onClick={(e) => isOverlay && handleSegmentClick(e, segment.uuid)}
                                    className={cn(
                                        "h-full transition-all duration-200 relative overflow-hidden flex-1",
                                        isOverlay && "hover:scale-y-[200%] origin-bottom transition-transform group-hover:h-[6px]",
                                        isPassed
                                            ? "bg-[rgba(var(--brand-rgb),0.85)]"
                                            : (isCurrent ? "bg-white/40" : "bg-white/20")
                                    )}

                                    style={{
                                        flex: `${widthPercent} 1 0%`,
                                        minWidth: '2px'
                                    }}
                                >
                                    {/* Forward Seek Preview Highlight (Scrubbing) */}
                                    {showScrub && scrubWidth > 0 && (
                                        <div
                                            className="absolute top-0 h-full bg-white/40 z-10 pointer-events-none"
                                            style={{ left: `${scrubStart}%`, width: `${scrubWidth}%` }}
                                        />
                                    )}

                                    {/* Current Playing Content */}
                                    {isCurrent && (
                                        <div
                                            data-testid="segment-progress"
                                            className="absolute left-0 top-0 h-full bg-[rgba(var(--brand-rgb),1)] z-20 will-change-[width]"
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
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
