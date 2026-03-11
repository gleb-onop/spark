import { useState, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';
import { parseYouTubeTimestamp } from '@/utils/time';

const DEBOUNCE_DELAY_MS = 500;

export const useYouTubeMetadata = (url: string) => {
    const [youtubeId, setYoutubeId] = useState('');
    const [initialTimestamp, setInitialTimestamp] = useState<number | null>(null);
    const [urlError, setUrlError] = useState('');

    const parseUrl = useMemo(
        () =>
            debounce((currentUrl: string) => {
                if (!currentUrl) {
                    setYoutubeId('');
                    setInitialTimestamp(null);
                    setUrlError('');
                    return;
                }

                // Robust regex covering watch, shorts, embed, live and youtu.be
                const match = currentUrl.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([a-zA-Z0-9_-]{11})/);
                let newId = match ? match[1] : '';

                // Fallback for plain ID if it's exactly 11 chars
                if (!newId && currentUrl.trim().length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(currentUrl.trim())) {
                    newId = currentUrl.trim();
                }

                if (newId) {
                    setYoutubeId(newId);
                    setUrlError('');

                    // Extract timestamp if present
                    try {
                        const urlObj = new URL(currentUrl.startsWith('http') ? currentUrl : `https://${currentUrl}`);
                        const t = urlObj.searchParams.get('t') || urlObj.searchParams.get('start');
                        if (t) {
                            setInitialTimestamp(parseYouTubeTimestamp(t));
                        } else {
                            setInitialTimestamp(null);
                        }
                    } catch (e) {
                        setInitialTimestamp(null);
                    }
                } else {
                    setYoutubeId('');
                    setInitialTimestamp(null);
                    setUrlError('Не удалось распознать ссылку');
                }
            }, DEBOUNCE_DELAY_MS),
        []
    );

    useEffect(() => {
        parseUrl(url);
        return () => parseUrl.cancel();
    }, [url, parseUrl]);

    return {
        youtubeId,
        initialTimestamp,
        urlError
    };
};
