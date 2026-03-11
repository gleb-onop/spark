import { useState, useEffect } from 'react';
import {
    useSensor,
    useSensors,
    MouseSensor,
    TouchSensor,
    KeyboardSensor,
} from '@dnd-kit/core';
import {
    arrayMove,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { api } from '@/services/api';
import type { Segment } from '@/types';

export function useSegmentReorder(segments: Segment[], segmentedVideoId: string | undefined) {
    const [localSegments, setLocalSegments] = useState<Segment[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        if (segments) {
            setLocalSegments(segments);
        }
    }, [segments]);

    const sensors = useSensors(
        useSensor(MouseSensor),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        setActiveId(null);

        if (active.id !== over?.id && segmentedVideoId) {
            const oldIndex = localSegments.findIndex((s) => s.uuid === active.id);
            const newIndex = localSegments.findIndex((s) => s.uuid === over.id);

            const newSegments = arrayMove(localSegments, oldIndex, newIndex);

            // Optimistic update
            setLocalSegments(newSegments);

            try {
                await api.reorderSegments(segmentedVideoId, newSegments.map(s => s.uuid));
            } catch (error) {
                console.error('Failed to reorder segments:', error);
                // Rollback on error
                setLocalSegments(localSegments);
            }
        }
    };

    return {
        localSegments,
        activeId,
        sensors,
        handleDragStart,
        handleDragEnd,
        activeSegment: localSegments.find(s => s.uuid === activeId)
    };
}
