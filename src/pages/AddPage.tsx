import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { generateUUID } from '../utils/uuid';
import { parseTime } from '../utils/time';
import type { SegmentedVideo } from '../types';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { useYouTubeMetadata } from '../hooks/useYouTubeMetadata';
import { useSegmentValidation } from '../hooks/useSegmentValidation';
import { SegmentedVideoSelector } from '../components/AddPage/SegmentedVideoSelector';
import { YouTubeInputSection } from '../components/AddPage/YouTubeInputSection';
import { SegmentConfig } from '../components/AddPage/SegmentConfig';

const AddPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const existingSegmentedVideoId = searchParams.get('segmentedVideoId') || '';

    const isNewMode = !existingSegmentedVideoId;

    // Form State
    const [segmentedVideoName, setSegmentedVideoName] = useState('');
    const [segmentedVideoId, setSegmentedVideoId] = useState(existingSegmentedVideoId);
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [useRange, setUseRange] = useState(false);
    const [timeStart, setTimeStart] = useState('');
    const [timeEnd, setTimeEnd] = useState('');

    // Shared Data
    const [segmentedVideos, setSegmentedVideos] = useState<SegmentedVideo[]>([]);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Custom Hooks
    const { youtubeId, title, setTitle, isFetchingTitle, urlError } = useYouTubeMetadata(url);
    const { validateSegment } = useSegmentValidation();

    useEffect(() => {
        if (!isNewMode) {
            api.getSegmentedVideos().then(setSegmentedVideos);
        }
    }, [isNewMode]);

    const validateForm = () => {
        if (isNewMode && !segmentedVideoName.trim()) return 'Введите название сегментированного видео';
        if (!youtubeId) return 'Введите корректную ссылку';
        if (!isNewMode && !segmentedVideoId) return 'Выберите сегментированное видео';

        if (useRange) {
            if (!timeStart || !timeEnd) return 'Заполните оба поля времени';
            if (parseTime(timeEnd) <= parseTime(timeStart)) return 'Конец должен быть позже начала';
        }
        return null;
    };

    const handleSave = async () => {
        setError('');
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSaving(true);
        try {
            const isValid = await validateSegment(youtubeId);
            if (!isValid) {
                setError('Сегмент недоступен или указан неправильный URL');
                return;
            }

            const videoData = {
                uuid: generateUUID(),
                youtubeId,
                title: title || 'Новое видео',
                description: '',
                duration: 0,
                isEmbeddable: true,
                isVertical: url.includes('/shorts/'),
                createdAt: Date.now()
            };

            const segmentData = {
                description,
                timeStart: useRange ? timeStart : null,
                timeEnd: useRange ? timeEnd : null,
                video: videoData
            };

            if (isNewMode) {
                await api.addSegmentedVideoWithSegment(segmentedVideoName.trim(), segmentData);
            } else {
                await api.addSegment(segmentData, segmentedVideoId);
            }
            navigate('/segmented-videos');
        } catch (e) {
            console.error('Error saving data:', e);
            setError('Произошла ошибка при сохранении');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background pb-24">
            <PageHeader
                title={isNewMode ? 'Новое сегментированное видео' : 'Добавить сегмент'}
                backPath={-1}
            />

            <main className="p-5 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section className="flex flex-col gap-6">
                    <SegmentedVideoSelector
                        isNewMode={isNewMode}
                        name={segmentedVideoName}
                        setName={setSegmentedVideoName}
                        selectedId={segmentedVideoId}
                        setSelectedId={setSegmentedVideoId}
                        options={segmentedVideos}
                    />

                    <YouTubeInputSection
                        url={url}
                        setUrl={setUrl}
                        urlError={urlError}
                        youtubeId={youtubeId}
                        title={title}
                        setTitle={setTitle}
                        isFetchingTitle={isFetchingTitle}
                    />

                    <SegmentConfig
                        description={description}
                        setDescription={setDescription}
                        useRange={useRange}
                        setUseRange={setUseRange}
                        timeStart={timeStart}
                        setTimeStart={setTimeStart}
                        timeEnd={timeEnd}
                        setTimeEnd={setTimeEnd}
                    />

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in shake-1 duration-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <p className="text-red-500 text-xs font-bold leading-tight">{error}</p>
                        </div>
                    )}
                </section>

                <Button
                    size="lg"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-16 rounded-2xl shadow-xl shadow-accent/30 font-bold text-lg transition-transform active:scale-95"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                            Проверка и сохранение...
                        </>
                    ) : (
                        <>
                            <Plus className="mr-2 h-6 w-6" />
                            {isNewMode ? 'Создать' : 'Добавить сегмент'}
                        </>
                    )}
                </Button>
            </main>

            <div className="absolute -left-[9999px] -top-[9999px] w-px h-px overflow-hidden">
                <div id="validation-player" />
            </div>
        </div>
    );
};

export default AddPage;
