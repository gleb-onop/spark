import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SegmentItem } from './SegmentItem';
import type { Segment } from '../types';

interface SortableSegmentItemProps {
    segment: Segment;
    segmentedVideoId: string;
    index: number;
}

export const SortableSegmentItem = ({ segment, segmentedVideoId, index }: SortableSegmentItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: segment.uuid });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <SegmentItem
                segment={segment}
                segmentedVideoId={segmentedVideoId}
                index={index}
                dragHandleProps={{ ...attributes, ...listeners }}
                isDragging={isDragging}
            />
        </div>
    );
};
