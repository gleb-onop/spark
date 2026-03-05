export const storage = {
    get: <T>(key: string, defaultValue: T): T => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error(`Error parsing ${key}:`, e);
            return defaultValue;
        }
    },

    set: <T>(key: string, data: T) => {
        localStorage.setItem(key, JSON.stringify(data));
    },

    remove: (key: string) => {
        localStorage.removeItem(key);
    }
};

