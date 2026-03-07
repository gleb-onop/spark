import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { parseTime } from '../utils/time';

interface UseEditSegmentProps {
    segmentId?: string;
    segmentedVideoId?: string;
}

export const useEditSegment = ({ segmentId, segmentedVideoId }: UseEditSegmentProps) => {
    const navigate = useNavigate();

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [useRange, setUseRange] = useState(false);
    const [timeStart, setTimeStart] = useState('');
    const [timeEnd, setTimeEnd] = useState('');
    const [youtubeId, setYoutubeId] = useState('');

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!segmentId) return;

        const loadSegment = async () => {
            setIsLoading(true);
            try {
                const segment = await api.getSegment(segmentId);
                if (segment) {
                    setTitle(segment.video.title);
                    setDescription(segment.description || '');
                    setYoutubeId(segment.video.youtubeId);
                    if (segment.timeStart || segment.timeEnd) {
                        setUseRange(true);
                        setTimeStart(segment.timeStart || '');
                        setTimeEnd(segment.timeEnd || '');
                    }
                }
            } catch (e) {
                console.error('Error loading segment:', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadSegment();
    }, [segmentId]);

    const validateForm = () => {
        if (useRange) {
            if (!timeStart || !timeEnd) return 'Заполните оба поля времени';
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
                    timeStart: useRange ? timeStart : null,
                    timeEnd: useRange ? timeEnd : null,
                    video: {
                        ...segment.video,
                        title
                    }
                });
                navigate(segmentedVideoId ? `/segmented-video/${segmentedVideoId}` : '/segmented-videos');
            }
        } catch (e) {
            console.error('Error saving segment:', e);
            setError('Ошибка при сохранении');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!segmentId) return;
        try {
            await api.deleteSegment(segmentId);
            navigate(segmentedVideoId ? `/segmented-video/${segmentedVideoId}` : '/segmented-videos');
        } catch (e) {
            console.error('Error deleting segment:', e);
        }
    };

    return {
        state: {
            title,
            description,
            useRange,
            timeStart,
            timeEnd,
            youtubeId,
            isLoading,
            isSaving,
            isDeleteModalOpen,
            error,
        },
        actions: {
            setTitle,
            setDescription,
            setUseRange,
            setTimeStart,
            setTimeEnd,
            setIsDeleteModalOpen,
            handleSave,
            confirmDelete,
        }
    };
};
