import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import { useYouTubeMetadata } from '@/hooks/useYouTubeMetadata';
import { formatTime, parseTime } from '@/utils/time';
import { generateUUID } from '@/utils/uuid';
import { PageHeader } from '@/components/PageHeader';
import { SegmentedVideoSelector } from '../components/AddPage/SegmentedVideoSelector';
import { YouTubeInputSection } from '../components/AddPage/YouTubeInputSection';
import { SegmentConfig } from '../components/AddPage/SegmentConfig';
import type { SegmentedVideo } from '../types';

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
    const [timeStart, setTimeStart] = useState('');
    const [timeEnd, setTimeEnd] = useState('');
    const [duration, setDuration] = useState(0);

    // Shared Data
    const [segmentedVideos, setSegmentedVideos] = useState<SegmentedVideo[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Custom Hooks
    const { youtubeId, urlError } = useYouTubeMetadata(url);

    useEffect(() => {
        api.getSegmentedVideos().then(setSegmentedVideos);
    }, []);

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
        if (!youtubeId) return 'Введите корректную ссылку на YouTube';
        if (!isNewMode && !segmentedVideoId) return 'Выберите видео для сегментации';
        if (isNewMode && !segmentedVideoName.trim()) return 'Введите название коллекции';

        if (timeStart && timeEnd) {
            if (parseTime(timeEnd) <= parseTime(timeStart)) return 'Конец должен быть позже начала';
        }

        return null;
    };

    const handleSave = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const videoData = {
                uuid: generateUUID(),
                youtubeId,
                description: '',
                duration: duration,
                isEmbeddable: true,
                isVertical: url.includes('/shorts/'),
                createdAt: Date.now()
            };

            const segmentData = {
                description,
                timeStart,
                timeEnd,
                video: videoData
            };

            if (isNewMode) {
                await api.addSegmentedVideoWithSegment(segmentedVideoName, segmentData);
            } else if (segmentedVideoId) {
                await api.addSegment(segmentData, segmentedVideoId);
            }

            navigate('/segmented-videos');
        } catch (e) {
            console.error('Save error:', e);
            setError('Ошибка при сохранении. Попробуйте еще раз.');
        } finally {
            setIsLoading(false);
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
                        onDurationReady={handleDurationReady}
                        duration={duration}
                        timeStart={timeStart}
                        timeEnd={timeEnd}
                        setTimeStart={setTimeStart}
                        setTimeEnd={setTimeEnd}
                        onRangeChange={handleRangeChange}
                    />

                    <SegmentConfig
                        description={description}
                        setDescription={setDescription}
                    />

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in shake-1 duration-500">
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>
                        </div>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="h-16 w-full mt-4 bg-brand text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_8px_30px_rgb(255,107,53,0.3)] hover:shadow-[0_8px_30px_rgb(255,107,53,0.5)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-3 group"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <span>Сохранить</span>
                                <div className="h-1.5 w-1.5 rounded-full bg-white group-hover:animate-ping" />
                            </>
                        )}
                    </button>
                </section>
            </main>

            <div className="absolute -left-[9999px] -top-[9999px] w-px h-px overflow-hidden">
                <div id="validation-player" />
            </div>
        </div>
    );
};

export default AddPage;
