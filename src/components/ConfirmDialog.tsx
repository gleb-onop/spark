import { type ReactNode } from 'react';
import { Button } from "./ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { cn } from "../lib/utils";

interface ConfirmDialogAction {
    label: string;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    className?: string;
}

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children?: ReactNode;
    primaryAction: ConfirmDialogAction;
    secondaryAction?: ConfirmDialogAction;
    footerLayout?: 'horizontal' | 'vertical';
}

export const ConfirmDialog = ({
    open,
    onOpenChange,
    title,
    description,
    children,
    primaryAction,
    secondaryAction,
    footerLayout = 'horizontal',
}: ConfirmDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl max-w-[90vw] sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">{title}</DialogTitle>
                    {description && (
                        <DialogDescription className="text-base text-muted-foreground">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {children && <div className="py-2">{children}</div>}

                <DialogFooter className={cn(
                    "mt-4 gap-3",
                    footerLayout === 'vertical' ? "flex flex-col sm:flex-col" : "flex-row"
                )}>
                    {secondaryAction && (
                        <Button
                            variant={secondaryAction.variant || "outline"}
                            className={cn("flex-1 rounded-xl h-14 font-bold", secondaryAction.className)}
                            onClick={secondaryAction.onClick}
                        >
                            {secondaryAction.label}
                        </Button>
                    )}
                    <Button
                        variant={primaryAction.variant || "default"}
                        className={cn("flex-1 rounded-xl h-14 font-bold shadow-lg", primaryAction.className)}
                        onClick={primaryAction.onClick}
                    >
                        {primaryAction.label}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
