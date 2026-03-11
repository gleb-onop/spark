import { Link } from 'react-router-dom';
import { Scissors, GripVertical } from 'lucide-react';
import { SegmentThumbnail } from './SegmentThumbnail';
import type { Segment } from '../types';
import type { CSSProperties, HTMLAttributes } from 'react';

interface SegmentItemProps {
    segment: Segment;
    segmentedVideoId: string;
    dragHandleProps?: HTMLAttributes<HTMLDivElement>;
    isDragging?: boolean;
    style?: CSSProperties;
}

export const SegmentItem = ({
    segment,
    segmentedVideoId,
    dragHandleProps,
    isDragging,
    style
}: SegmentItemProps) => {
    return (
        <div
            ref={null}
            style={{ ...style, touchAction: dragHandleProps ? 'none' : undefined }}
            {...dragHandleProps}
            className={cn(
                "relative overflow-hidden group rounded-2xl transition-all duration-200 select-none",
                isDragging ? "opacity-40 ring-2 ring-brand/50 z-50 shadow-xl" : "bg-background active:bg-muted/30"
            )}
        >
            <div className="relative z-10 p-1 flex items-center gap-1 transition-transform duration-200 ease-out">
                <div className="p-2 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0">
                    <GripVertical className="h-5 w-5" />
                </div>
                <Link
                    to={`/segmented-videos/${segmentedVideoId}/segments/${segment.uuid}`}
                    className="flex flex-1 min-w-0 items-center gap-3 no-underline text-inherit py-2"
                    onClick={(e) => {
                        // Prevent navigation if we are dragging
                        if (isDragging) e.preventDefault();
                    }}
                >
                    <SegmentThumbnail
                        youtubeId={segment.video.youtubeId}
                        title={segment.description}
                        size="sm"
                        className="shrink-0"
                    />
                    <div className="flex-1 min-w-0 overflow-hidden">
                        {segment.description && (
                            <div className="text-sm font-medium text-muted-foreground line-clamp-2 mb-1">
                                {segment.description}
                            </div>
                        )}
                        {segment.timeStart && (
                            <div className="flex items-center gap-1.5 text-xs text-brand font-black mt-1.5 bg-brand/10 w-fit px-2 py-0.5 rounded-lg border border-brand/20">
                                <Scissors className="h-3 w-3" />
                                <span>{segment.timeStart} {segment.timeEnd ? `– ${segment.timeEnd}` : ''}</span>
                            </div>
                        )}
                    </div>
                </Link>
            </div>
        </div>
    );
};

// Add helper to avoid circular dependency or missing cn if used
import { cn } from '@/lib/utils';
