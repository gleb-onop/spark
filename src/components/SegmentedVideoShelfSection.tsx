import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import ShelfCard from './ShelfCard';
import type { SegmentedVideo, Segment } from '../types';

interface SegmentedVideoShelfSectionProps {
    segmentedVideo: SegmentedVideo;
    segments: Segment[];
}

export const SegmentedVideoShelfSection = ({ segmentedVideo, segments }: SegmentedVideoShelfSectionProps) => {
    const segmentedVideoSegments = segments.filter(v => segmentedVideo.segmentIds.includes(v.uuid));

    if (segmentedVideoSegments.length === 0) return null;

    return (
        <section className="mt-8">
            <div className="flex justify-between items-end mb-4 px-1">
                <div className="flex flex-col gap-0.5">
                    <h2 className="m-0 text-2xl font-black tracking-tight leading-none group">
                        <Link
                            to={`/segmented-video/${segmentedVideo.uuid}`}
                            className="no-underline text-inherit hover:text-accent transition-colors"
                        >
                            {segmentedVideo.name}
                        </Link>
                    </h2>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Cегментов: {segmentedVideoSegments.length}
                    </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" asChild size="sm" className="text-brand font-bold h-8 hover:bg-brand/10 px-2 min-w-0">
                        <Link to={`/segmented-video/${segmentedVideo.uuid}`} className="flex items-center gap-0.5">
                            <span className="text-xs">все</span>
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="no-scrollbar flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-1 px-1">
                {segmentedVideoSegments.map(segment => (
                    <ShelfCard
                        key={segment.uuid}
                        segment={segment}
                        segmentedVideoId={segmentedVideo.uuid}
                    />
                ))}
            </div>
        </section>
    );
};
