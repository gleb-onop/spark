import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from './ui/button';
import ShelfCard from './ShelfCard';
import type { SegmentedVideo, Segment } from '../types';

interface SegmentedVideoShelfSectionProps {
    segmentedVideo: SegmentedVideo;
    segments: Segment[];
}

export const SegmentedVideoShelfSection = ({ segmentedVideo, segments }: SegmentedVideoShelfSectionProps) => {
    const segmentedVideoSegments = segments.filter(v => segmentedVideo.segmentIds.includes(v.uuid));
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    useEffect(() => {
        updateScrollState();
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener('scroll', updateScrollState, { passive: true });
        window.addEventListener('resize', updateScrollState);
        return () => {
            el.removeEventListener('scroll', updateScrollState);
            window.removeEventListener('resize', updateScrollState);
        };
    }, [updateScrollState, segmentedVideoSegments.length]);

    const scroll = (direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        const scrollAmount = el.clientWidth;
        el.scrollBy({ left: direction === 'right' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
    };

    if (segmentedVideoSegments.length === 0) return null;

    return (
        <section className="mt-8">
            <div className="flex justify-between items-end mb-4 px-1">
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <h2 className="m-0 text-xl font-black tracking-tight leading-none group truncate">
                        <Link
                            to={`/segmented-videos/${segmentedVideo.uuid}`}
                            className="no-underline text-inherit hover:text-accent transition-colors"
                        >
                            {segmentedVideo.name}
                        </Link>
                    </h2>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                        Cегментов: {segmentedVideoSegments.length}
                    </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {/* Desktop scroll arrows */}
                    <div className="hidden md:flex items-center gap-1 mr-1">
                        <button
                            onClick={() => scroll('left')}
                            disabled={!canScrollLeft}
                            className="h-8 w-8 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted text-foreground disabled:opacity-0 disabled:pointer-events-none transition-all duration-200"
                            aria-label="Предыдущие"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            disabled={!canScrollRight}
                            className="h-8 w-8 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted text-foreground disabled:opacity-0 disabled:pointer-events-none transition-all duration-200"
                            aria-label="Следующие"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                    <Button variant="ghost" asChild size="sm" className="text-brand font-bold h-8 hover:bg-brand/10 px-2 min-w-0">
                        <Link to={`/segmented-videos/${segmentedVideo.uuid}`} className="flex items-center gap-0.5">
                            <span className="text-xs">все</span>
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="no-scrollbar flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-1 px-1"
            >
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
