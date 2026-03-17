import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import { useYouTubeMetadata } from '@/hooks/useYouTubeMetadata';
import { usePrevious } from '@/hooks/usePrevious';
import { formatTime, parseTime } from '@/utils/time';
import { generateUUID } from '@/utils/uuid';
import { PageHeader } from '@/components/PageHeader';
import { SegmentedVideoSelector } from '../components/UpdatePages/SegmentedVideoSelector';
import { YouTubeInputSection } from '../components/UpdatePages/YouTubeInputSection';
import { SegmentDescription } from '../components/UpdatePages/SegmentDescription';
import type { SegmentedVideo } from '../types';

/**
 * Validates the form data. Extracted from component to avoid re-creation and simplify testing.
 */
const validateForm = (
    youtubeId: string,
    isNewMode: boolean,
    segmentedVideoId: string,
    segmentedVideoName: string,
    timeStart: string,
    timeEnd: string
) => {
    if (!youtubeId) return 'Введите корректную ссылку на YouTube';
    if (!isNewMode && !segmentedVideoId) return 'Выберите видео для сегментации';
    if (isNewMode && !segmentedVideoName.trim()) return 'Введите название коллекции';

    if (timeStart && timeEnd) {
        const start = parseTime(timeStart);
        const end = parseTime(timeEnd);
        if (end <= start) return 'Конец должен быть позже начала';
        if (end - start < 2.5) return 'Минимальная длина отрезка — 2.5 сек';
    }

    return null;
};

const AddPage = () => {
    const navigate = useNavigate();
    const { segmentedVideoId: paramSegmentedVideoId } = useParams<{ segmentedVideoId: string }>();
    const existingSegmentedVideoId = paramSegmentedVideoId || '';

    const isNewMode = !existingSegmentedVideoId;

    // Form State
    const [segmentedVideoName, setSegmentedVideoName] = useState('');
    const [segmentedVideoId, setSegmentedVideoId] = useState(existingSegmentedVideoId);
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [timeStart, setTimeStart] = useState('');
    const [timeEnd, setTimeEnd] = useState('');
    const [duration, setDuration] = useState(0);

    // Refs for stable handleDurationReady closure
    const timeStartRef = useRef(timeStart);
    const timeEndRef = useRef(timeEnd);

    useEffect(() => {
        timeStartRef.current = timeStart;
        timeEndRef.current = timeEnd;
    }, [timeStart, timeEnd]);

    // Shared Data
    const [segmentedVideos, setSegmentedVideos] = useState<SegmentedVideo[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Custom Hooks
    const { youtubeId, initialTimestamp, urlError } = useYouTubeMetadata(url);
    const prevYoutubeId = usePrevious(youtubeId);

    // Reset fields when video changes
    useEffect(() => {
        if (youtubeId !== prevYoutubeId) {
            if (youtubeId) {
                // Video changed to a NEW one - clear times to allow re-sync
                setTimeStart('');
                setTimeEnd('');
            } else {
                // URL cleared - reset everything
                setTimeStart('');
                setTimeEnd('');
                setDuration(0);
            }
        }
    }, [youtubeId, prevYoutubeId]);

    useEffect(() => {
        api.getSegmentedVideos().then(setSegmentedVideos);
    }, []);

    // If URL has a timestamp, update timeStart
    useEffect(() => {
        if (initialTimestamp !== null) {
            setTimeStart(formatTime(initialTimestamp, true));
        }
    }, [initialTimestamp]);

    /**
     * Stable callback for YouTubeInputSection.
     * Uses refs to avoid re-creation when timeStart/timeEnd change.
     */
    const handleDurationReady = useCallback((dur: number) => {
        setDuration(dur);
        if (!timeStartRef.current) setTimeStart('0:00.000');
        if (!timeEndRef.current) setTimeEnd(formatTime(dur, true));
    }, []);

    const handleSave = async () => {
        const validationError = validateForm(
            youtubeId,
            isNewMode,
            segmentedVideoId,
            segmentedVideoName,
            timeStart,
            timeEnd
        );

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
        <div className="bg-background pb-24 md:pb-8">
            <PageHeader
                title={isNewMode ? 'Новое сегментированное видео' : 'Добавить сегмент'}
                backPath={-1}
            />

            <main className="p-5 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 md:max-w-xl md:mx-auto md:pt-8">
                <section className="flex flex-col gap-6">
                    <SegmentedVideoSelector
                        isNewMode={isNewMode}
                        name={segmentedVideoName}
                        setName={setSegmentedVideoName}
                        selectedId={segmentedVideoId}
                        setSelectedId={setSegmentedVideoId}
                        options={segmentedVideos}
                        error={error === 'Введите название коллекции'}
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
                    />

                    <SegmentDescription
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

            {/* 
                Hidden player for metadata validation. 
                YouTube IFrame API fails to initialize in elements with 'display: none'.
                We position it far off-screen to keep it active without affecting the layout.
            */}
            <div className="absolute -left-[9999px] -top-[9999px] w-px h-px overflow-hidden">
                <div id="validation-player" />
            </div>
        </div>
    );
};

export default AddPage;
