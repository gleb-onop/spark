import { ChevronDown, Check } from 'lucide-react';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from './ui/drawer';
import { Button } from './ui/button';
import { cn } from '@/lib/tailwind';

interface SelectItem {
    id: string;
    label: string;
}

interface SelectSheetProps {
    items: SelectItem[];
    value: string;
    onChange: (id: string) => void;
    placeholder: string;
    title: string;
    triggerClassName?: string;
}

export const SelectSheet = ({
    items,
    value,
    onChange,
    placeholder,
    title,
    triggerClassName,
}: SelectSheetProps) => {
    const selectedItem = items.find((item) => item.id === value);

    return (
        <Drawer>
            <DrawerTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full h-14 px-4 bg-muted/30 border-none rounded-2xl flex justify-between items-center text-foreground font-semibold shadow-inner transition-all hover:bg-muted/40",
                        triggerClassName
                    )}
                >
                    <span className={cn(!selectedItem && "text-muted-foreground/60")}>
                        {selectedItem ? selectedItem.label : placeholder}
                    </span>
                    <ChevronDown className="h-5 w-5 opacity-50" />
                </Button>
            </DrawerTrigger>
            <DrawerContent className="max-w-[390px] mx-auto border-none shadow-2xl">
                <DrawerHeader className="border-b border-border/50 pb-4">
                    <DrawerTitle className="text-xl font-black text-center">{title}</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto no-scrollbar">
                    {items.map((item) => {
                        const isSelected = item.id === value;
                        return (
                            <DrawerClose key={item.id} asChild>
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full h-14 justify-between px-4 rounded-xl font-semibold transition-all",
                                        isSelected
                                            ? "bg-accent/10 text-accent hover:bg-accent/20"
                                            : "hover:bg-muted"
                                    )}
                                    onClick={() => onChange(item.id)}
                                >
                                    <span className="truncate">{item.label}</span>
                                    {isSelected && <Check className="h-5 w-5 shrink-0" />}
                                </Button>
                            </DrawerClose>
                        );
                    })}
                </div>
                <div className="h-20" /> {/* Bottom padding to clear TabBar */}

            </DrawerContent>
        </Drawer>
    );
};
