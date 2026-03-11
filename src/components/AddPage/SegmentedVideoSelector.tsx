import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { SelectSheet } from '../SelectSheet';
import type { SegmentedVideo } from '../../types';

interface SegmentedVideoSelectorProps {
    isNewMode: boolean;
    name: string;
    setName: (name: string) => void;
    selectedId: string;
    setSelectedId: (id: string) => void;
    options: SegmentedVideo[];
    error?: boolean;
}

export const SegmentedVideoSelector = ({
    isNewMode,
    name,
    setName,
    selectedId,
    setSelectedId,
    options,
    error
}: SegmentedVideoSelectorProps) => {
    if (isNewMode) {
        return (
            <div className="space-y-2">
                <Label htmlFor="segmented-video-name" className="text-sm font-bold ml-1">
                    Название сегментированного видео
                </Label>
                <Input
                    id="segmented-video-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Напр. Мои любимые клипы"
                    className={`h-14 rounded-2xl bg-muted/30 border-none shadow-inner transition-all ${error ? 'ring-2 ring-red-500/50' : ''}`}
                    autoFocus
                />
            </div>
        );
    }

    const selectItems = options.map(p => ({
        id: p.uuid,
        label: p.name
    }));

    return (
        <div className="space-y-2">
            <Label className="text-sm font-bold ml-1">Выберите сегментированное видео</Label>
            <SelectSheet
                items={selectItems}
                value={selectedId}
                onChange={setSelectedId}
                placeholder="Сегментированное видео..."
                title="Выбор видео"
            />
        </div>
    );
};
