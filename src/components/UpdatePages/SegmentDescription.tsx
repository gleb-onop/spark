import { Label } from '../ui/label';

interface SegmentDescriptionProps {
    description: string;
    setDescription: (desc: string) => void;
}

export const SegmentDescription = ({
    description,
    setDescription,
}: SegmentDescriptionProps) => {
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
        </div>
    );
};
