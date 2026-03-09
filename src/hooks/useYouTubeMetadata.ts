import { useState, useEffect } from 'react';

const DEBOUNCE_DELAY_MS = 500;

export const useYouTubeMetadata = (url: string) => {
    const [youtubeId, setYoutubeId] = useState('');
    const [urlError, setUrlError] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!url) {
                setYoutubeId('');
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
            } else {
                setYoutubeId('');
                setUrlError('Не удалось распознать ссылку');
            }
        }, DEBOUNCE_DELAY_MS);

        return () => clearTimeout(timer);
    }, [url]);

    return {
        youtubeId,
        urlError
    };
};
