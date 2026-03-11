import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { parseTime, formatTime } from '../utils/time';

interface UseEditSegmentProps {
    segmentId?: string;
    segmentedVideoId?: string;
}

export const useEditSegment = ({ segmentId, segmentedVideoId }: UseEditSegmentProps) => {
    const navigate = useNavigate();

    // Form State
    const [description, setDescription] = useState('');
    const [timeStart, setTimeStart] = useState('');
    const [timeEnd, setTimeEnd] = useState('');
    const [youtubeId, setYoutubeId] = useState('');
    const [duration, setDuration] = useState(0);

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!segmentId) return;

        const loadSegment = async () => {
            setIsLoading(true);
            try {
                const segment = await api.getSegment(segmentId);
                if (segment) {
                    setDescription(segment.description || '');
                    setYoutubeId(segment.video.youtubeId);
                    setDuration(segment.video.duration || 0);
                    setTimeStart(segment.timeStart || '');
                    setTimeEnd(segment.timeEnd || '');
                }
            } catch (e) {
                console.error('Error loading segment:', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadSegment();
    }, [segmentId]);

    const handleDurationReady = useCallback((dur: number) => {
        setDuration(dur);
        if (!timeStart) setTimeStart('0:00');
        if (!timeEnd) setTimeEnd(formatTime(dur));
    }, [timeStart, timeEnd]);

    const handleRangeChange = useCallback((start: number, end: number) => {
        setTimeStart(formatTime(start));
        setTimeEnd(formatTime(end));
    }, []);

    const validateForm = () => {
        if (timeStart && timeEnd) {
            if (parseTime(timeEnd) <= parseTime(timeStart)) return 'Конец должен быть позже начала';
        }
        return null;
    };

    const handleSave = async () => {
        if (!segmentId) return;
        setError('');

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSaving(true);
        try {
            const segment = await api.getSegment(segmentId);
            if (segment) {
                await api.updateSegment(segmentId, {
                    description,
                    timeStart,
                    timeEnd,
                    video: {
                        ...segment.video,
                        duration
                    }
                });
                navigate(segmentedVideoId ? `/segmented-videos/${segmentedVideoId}` : '/segmented-videos');
            }
        } catch (e) {
            console.error('Error saving segment:', e);
            setError('Ошибка при сохранении');
        } finally {
            setIsSaving(false);
        }
    };

    return {
        state: {
            description,
            timeStart,
            timeEnd,
            youtubeId,
            duration,
            isLoading,
            isSaving,
            error,
        },
        actions: {
            setDescription,
            setTimeStart,
            setTimeEnd,
            handleDurationReady,
            handleRangeChange,
            handleSave,
        }
    };
};
