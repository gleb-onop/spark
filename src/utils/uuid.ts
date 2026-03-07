export function generateUUID(): string {
    // Check if crypto.randomUUID is available (only in secure contexts like HTTPS/localhost)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    // Fallback for non-secure contexts (http://192.168.x.x:port)
    // Standard RFC4122 v4 compliant UUID generator fallback
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
