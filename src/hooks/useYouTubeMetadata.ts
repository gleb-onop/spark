import { useState, useEffect } from 'react';
import { parseYouTubeTimestamp } from '@/utils/time';

const DEBOUNCE_DELAY_MS = 500;

export const useYouTubeMetadata = (url: string) => {
    const [youtubeId, setYoutubeId] = useState('');
    const [initialTimestamp, setInitialTimestamp] = useState<number | null>(null);
    const [urlError, setUrlError] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!url) {
                setYoutubeId('');
                setInitialTimestamp(null);
                setUrlError('');
                return;
            }

            // Robust regex covering watch, shorts, embed, live and youtu.be
            const match = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([a-zA-Z0-9_-]{11})/);
            let newId = match ? match[1] : '';

            // Fallback for plain ID if it's exactly 11 chars
            if (!newId && url.trim().length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
                newId = url.trim();
            }

            if (newId) {
                setYoutubeId(newId);

                // Extract timestamp if present
                const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
                const t = urlObj.searchParams.get('t') || urlObj.searchParams.get('start');
                if (t) {
                    setInitialTimestamp(parseYouTubeTimestamp(t));
                } else {
                    setInitialTimestamp(null);
                }
            } else {
                setYoutubeId('');
                setInitialTimestamp(null);
                setUrlError('Не удалось распознать ссылку');
            }
        }, DEBOUNCE_DELAY_MS);

        return () => clearTimeout(timer);
    }, [url]);

    return {
        youtubeId,
        initialTimestamp,
        urlError
    };
};
