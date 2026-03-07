import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { TimeRangeFields } from './TimeRangeFields';

interface SegmentConfigProps {
    description: string;
    setDescription: (desc: string) => void;
    useRange: boolean;
    setUseRange: (use: boolean) => void;
    timeStart: string;
    setTimeStart: (time: string) => void;
    timeEnd: string;
    setTimeEnd: (time: string) => void;
}

export const SegmentConfig = ({
    description,
    setDescription,
    useRange,
    setUseRange,
    timeStart,
    setTimeStart,
    timeEnd,
    setTimeEnd,
}: SegmentConfigProps) => {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="segment-desc" className="text-sm font-bold ml-1">Описание (необязательно)</Label>
                <textarea
                    id="segment-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Добавьте заметки..."
                    className="w-full min-h-[120px] p-4 bg-muted/30 border-none rounded-2xl outline-none text-foreground font-medium shadow-inner transition-all focus:ring-2 focus:ring-accent/20 resize-none"
                />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                <Label htmlFor="range-toggle" className="text-sm font-bold cursor-pointer">
                    Использовать только сегмент
                </Label>
                <Switch
                    id="range-toggle"
                    checked={useRange}
                    onCheckedChange={setUseRange}
                />
            </div>

            {useRange && (
                <TimeRangeFields
                    timeStart={timeStart}
                    timeEnd={timeEnd}
                    onChangeStart={setTimeStart}
                    onChangeEnd={setTimeEnd}
                />
            )}
        </div>
    );
};
