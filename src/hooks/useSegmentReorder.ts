import { useState, useEffect, useMemo, useRef } from 'react';
import {
    useSensor,
    useSensors,
    PointerSensor,
    TouchSensor,
    KeyboardSensor,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { debounce } from 'lodash';
import { toast } from 'sonner';
import { api } from '@/services/api';
import type { Segment } from '@/types';

export function useSegmentReorder(segments: Segment[], segmentedVideoId: string | undefined) {
    const [localSegments, setLocalSegments] = useState<Segment[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const previousSegmentsRef = useRef<Segment[]>([]);

    useEffect(() => {
        if (segments) {
            setLocalSegments(segments);
        }
    }, [segments]);

    const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

    const mouseSensor = useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
    });

    const touchSensor = useSensor(TouchSensor, {
        activationConstraint: {
            delay: 500,
            tolerance: 5,
        },
    });

    const keyboardSensor = useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
    });

    const sensors = useSensors(
        isTouchDevice ? touchSensor : mouseSensor,
        keyboardSensor
    );

    // Debounced save function with rollback logic
    const debouncedSave = useMemo(
        () =>
            debounce(async (segmentIds: string[], currentPreviousSegments: Segment[]) => {
                if (!segmentedVideoId) return;
                try {
                    await api.reorderSegments(segmentedVideoId, segmentIds);
                } catch (error) {
                    console.error('Failed to reorder segments:', error);
                    setLocalSegments(currentPreviousSegments);
                    toast.error('Не удалось сохранить новый порядок сегментов');
                }
            }, 1000),
        [segmentedVideoId]
    );

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            debouncedSave.cancel();
        };
    }, [debouncedSave]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        previousSegmentsRef.current = localSegments;
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (active.id !== over?.id && over && segmentedVideoId) {
            const oldIndex = localSegments.findIndex((s) => s.uuid === active.id);
            const newIndex = localSegments.findIndex((s) => s.uuid === over.id);

            const newSegments = arrayMove(localSegments, oldIndex, newIndex);

            // 1. Optimistic update
            setLocalSegments(newSegments);

            // 2. Debounced save with current snapshot for rollback
            debouncedSave(newSegments.map(s => s.uuid), previousSegmentsRef.current);
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
