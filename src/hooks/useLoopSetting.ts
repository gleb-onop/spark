import { useState, useCallback } from 'react';

const STORAGE_KEY = 'spark_looping';

export const useLoopSetting = () => {
    const [isLooping, setIsLooping] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) === 'true';
        } catch (e) {
            return false;
        }
    });

    const toggleLoop = useCallback((checked: boolean) => {
        setIsLooping(checked);
        try {
            localStorage.setItem(STORAGE_KEY, String(checked));
        } catch (e) {
            console.error('Failed to save loop setting to localStorage', e);
        }
    }, []);

    return {
        isLooping,
        toggleLoop
    };
};
