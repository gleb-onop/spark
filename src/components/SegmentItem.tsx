import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Trash2 } from 'lucide-react';
import { SegmentThumbnail } from './SegmentThumbnail';
import type { Segment } from '../types';

interface SegmentItemProps {
    segment: Segment;
    segmentedVideoId: string;
    onDelete?: (uuid: string) => void;
}

export const SegmentItem = ({ segment, segmentedVideoId, onDelete }: SegmentItemProps) => {
    const [startX, setStartX] = useState<number | null>(null);
    const [currentX, setCurrentX] = useState<number>(0);
    const [isSwiped, setIsSwiped] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        setStartX(e.touches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startX === null) return;
        const diff = startX - e.touches[0].clientX;
        if (diff > 0) { // Swiping left
            setCurrentX(Math.min(diff, 80));
        } else { // Swiping right
            setCurrentX(0);
            if (isSwiped) setIsSwiped(false);
        }
    };

    const handleTouchEnd = () => {
        if (currentX > 40) {
            setIsSwiped(true);
            setCurrentX(80);
        } else {
            setIsSwiped(false);
            setCurrentX(0);
        }
        setStartX(null);
    };

    return (
        <div className="relative overflow-hidden group rounded-2xl">
            {/* Delete Action Background */}
            <div
                className="absolute inset-0 bg-red-600 flex items-center justify-end px-6 text-white"
                onClick={() => onDelete?.(segment.uuid)}
            >
                <Trash2 className="h-5 w-5" />
            </div>

            {/* Foreground Content */}
            <div
                ref={containerRef}
                className="bg-background relative z-10 p-1 flex items-center gap-3 transition-transform duration-200 ease-out active:bg-muted/30"
                style={{ transform: `translateX(-${currentX}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <Link
                    to={`/segment/${segmentedVideoId}/${segment.uuid}`}
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
