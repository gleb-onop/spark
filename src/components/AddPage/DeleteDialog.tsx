import { Button } from '../ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";

interface DeleteDialogProps {
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export const DeleteDialog = ({ open, onCancel, onConfirm }: DeleteDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={(val) => !val && onCancel()}>
            <DialogContent className="rounded-3xl max-w-[90vw]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Удалить сегмент?</DialogTitle>
                    <DialogDescription className="text-base">
                        Этот сегмент будет навсегда удален. Это действие нельзя отменить.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col gap-3 mt-4 sm:flex-col">
                    <Button
                        variant="destructive"
                        className="h-14 rounded-2xl font-bold text-base"
                        onClick={onConfirm}
                    >
                        Да, удалить сегмент
                    </Button>
                    <Button
                        variant="ghost"
                        className="h-14 rounded-2xl font-bold text-base"
                        onClick={onCancel}
                    >
                        Отмена
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
