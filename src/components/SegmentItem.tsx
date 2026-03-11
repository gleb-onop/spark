import { Link } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import { SegmentThumbnail } from './SegmentThumbnail';
import type { Segment } from '../types';

interface SegmentItemProps {
    segment: Segment;
    segmentedVideoId: string;
}

export const SegmentItem = ({ segment, segmentedVideoId }: SegmentItemProps) => {
    return (
        <div className="relative overflow-hidden group rounded-2xl">
            {/* Foreground Content */}
            <div className="bg-background relative z-10 p-1 flex items-center gap-3 transition-transform duration-200 ease-out active:bg-muted/30">
                <Link
                    to={`/segmented-videos/${segmentedVideoId}/segments/${segment.uuid}`}
                    className="flex flex-1 min-w-0 items-center gap-3 no-underline text-inherit py-2"
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
