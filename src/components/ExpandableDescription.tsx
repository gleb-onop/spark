import { useState } from 'react';

interface ExpandableDescriptionProps {
    text: string;
    maxLineClamp?: number;
    threshold?: number;
}

export const ExpandableDescription = ({
    text,
    maxLineClamp = 3,
    threshold = 110
}: ExpandableDescriptionProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!text) {
        return (
            <div className="bg-muted/50 dark:bg-muted/20 border border-border p-4 rounded-2xl overflow-hidden relative text-muted-foreground italic text-sm">
                Нет описания
            </div>
        );
    }

    const showExpand = text.length > threshold;

    return (
        <div className="bg-muted/50 dark:bg-muted/20 border border-border p-4 rounded-2xl overflow-hidden relative transition-all duration-300">
            <div className="min-w-0">
                <p
                    className={`text-sm leading-relaxed m-0 text-foreground/80 break-words whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-3'}`}
                    style={{
                        WebkitLineClamp: isExpanded ? 'unset' : maxLineClamp
                    }}
                >
                    {text}
                </p>
                {showExpand && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-accent font-bold text-xs mt-3 uppercase tracking-wider hover:underline"
                    >
                        {isExpanded ? 'Свернуть' : 'Развернуть'}
                    </button>
                )}
            </div>
        </div>
    );
};
