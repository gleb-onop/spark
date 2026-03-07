import { Label } from '../ui/label';
import { Input } from '../ui/input';

interface TimeRangeFieldsProps {
    timeStart: string;
    timeEnd: string;
    onChangeStart: (val: string) => void;
    onChangeEnd: (val: string) => void;
}

export const TimeRangeFields = ({
    timeStart,
    timeEnd,
    onChangeStart,
    onChangeEnd,
}: TimeRangeFieldsProps) => {
    return (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="space-y-2">
                <Label htmlFor="start" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Старт (м:сс)</Label>
                <Input
                    id="start"
                    value={timeStart}
                    onChange={(e) => onChangeStart(e.target.value)}
                    placeholder="0:00"
                    className="h-12 rounded-xl bg-muted/30 border-none shadow-inner"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="end" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Конец (м:сс)</Label>
                <Input
                    id="end"
                    value={timeEnd}
                    onChange={(e) => onChangeEnd(e.target.value)}
                    placeholder="1:00"
                    className="h-12 rounded-xl bg-muted/30 border-none shadow-inner"
                />
            </div>
        </div>
    );
};
