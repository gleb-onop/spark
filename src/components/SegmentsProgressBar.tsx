import { Link } from 'react-router-dom';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseTime, formatTime } from '@/utils/time';
import type { Segment } from '@/types';

interface SegmentsProgressBarProps {
    segments: Segment[];
    currentSegmentUuid: string;
    segmentedVideoId: string;
}

const getSegmentDuration = (segment: Segment) => {
    const start = parseTime(segment.timeStart);
    let end = segment.timeEnd ? parseTime(segment.timeEnd) : segment.video.duration;

    // If we couldn't determine an end time, fallback to a relative minimum duration 
    // just so it shows up on the bar, or 0 if we strictly don't know. 
    // Assuming video.duration holds the total seconds from YouTube API.
    if (!end && segment.video.duration) {
        end = segment.video.duration;
    }

    const duration = Math.max(0, (end || 0) - start);
    return duration;
};

export const SegmentsProgressBar = ({ segments, currentSegmentUuid, segmentedVideoId }: SegmentsProgressBarProps) => {
    if (!segments || segments.length <= 1) return null;

    const currentSegmentIndex = segments.findIndex(s => s.uuid === currentSegmentUuid);

    const segmentDurations = segments.map(getSegmentDuration);
    const totalDuration = segmentDurations.reduce((sum, dur) => sum + dur, 0);

    return (
        <div className="w-full flex lg:hidden flex-col gap-2 relative group pt-2">
            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                <span>
                    Сегмент {currentSegmentIndex !== -1 ? currentSegmentIndex + 1 : '-'}/{segments.length}
                </span>
                <span className="flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    {formatTime(totalDuration)}
                </span>
            </div>

            <div className="flex w-full h-3 bg-muted/50 rounded-full overflow-hidden gap-0.5 shadow-inner p-0.5 border border-border/50">
                {segments.map((segment, index) => {
                    const duration = segmentDurations[index];
                    // If totalDuration is 0 (e.g., all 0-length segments or API missing duration), give them equal width
                    const widthPercent = totalDuration > 0 ? (duration / totalDuration) * 100 : (100 / segments.length);
                    const isCurrent = segment.uuid === currentSegmentUuid;
                    const isPassed = currentSegmentIndex !== -1 && index < currentSegmentIndex;

                    return (
                        <Link
                            key={segment.uuid}
                            to={`/segmented-videos/${segmentedVideoId}/segments/${segment.uuid}`}
                            title={segment.description || `Сегмент ${index + 1}`}
                            className={cn(
                                "h-full rounded-full transition-all duration-300 hover:brightness-110",
                                isCurrent ? "bg-brand scale-y-110 shadow-sm" :
                                    isPassed ? "bg-brand/40 hover:bg-brand/60" : "bg-muted-foreground/20 hover:bg-muted-foreground/40"
                            )}
                            style={{ flex: `${widthPercent} 1 0%`, minWidth: '4px' }}
                        />
                    );
                })}
            </div>
        </div>
    );
};
