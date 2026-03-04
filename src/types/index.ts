export interface Playlist {
    uuid: string;
    name: string;
    createdAt: number;
    fragmentIds: string[];
}

export interface Fragment {
    uuid: string;
    youtubeId: string;
    title: string;
    description: string;
    isVertical: boolean;
    timeStart: string | null;
    timeEnd: string | null;
    createdAt: string; // ISO timestamp string
}
