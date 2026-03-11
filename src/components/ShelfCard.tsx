import { Link } from 'react-router-dom';
import type { Segment } from '../types';
import { Plus } from 'lucide-react';
import { SegmentThumbnail } from './SegmentThumbnail';

interface ShelfCardProps {
    segment?: Segment;
    segmentedVideoId: string;
    isPlaceholder?: boolean;
}

const ShelfCard = ({ segment, segmentedVideoId, isPlaceholder }: ShelfCardProps) => {
    if (isPlaceholder) {
        return (
            <Link
                to={`/segmented-videos/${segmentedVideoId}/segments/new`}
                className="min-w-[120px] w-32 aspect-[3/4] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl no-underline text-muted-foreground gap-2 snap-start hover:border-accent hover:text-accent transition-all shadow-sm bg-muted/20"
            >
                <div className="p-3 bg-background rounded-full shadow-sm">
                    <Plus className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold">Добавить</span>
            </Link>
        );
    }

    if (!segment) return null;

    return (
        <Link
            to={`/segmented-videos/${segmentedVideoId}/segments/${segment.uuid}`}
            className="min-w-[140px] w-36 flex flex-col no-underline text-inherit snap-start group"
        >
            <SegmentThumbnail
                youtubeId={segment.video.youtubeId}
                title={segment.description}
                className="mb-2 group-hover:ring-accent/50 group-hover:scale-[1.02] transition-all duration-300 shadow-md"
            />
        </Link>
    );
};

export default ShelfCard;
