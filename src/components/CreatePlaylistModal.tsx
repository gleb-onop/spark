import { useState, useEffect } from 'react';

interface CreatePlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string) => void;
}

const CreatePlaylistModal = ({ isOpen, onClose, onCreate }: CreatePlaylistModalProps) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (isOpen) setName('');
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-end">
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-[390px] mx-auto bg-bg-light dark:bg-bg-dark rounded-t-2xl px-5 pt-6 pb-10 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] transition-transform duration-300">
                <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full mx-auto mb-5" />

                <h3 className="m-0 mb-5 text-xl font-bold">Новый плейлист</h3>

                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Мой плейлист"
                    autoFocus
                    className="w-full p-4 rounded-xl border border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 text-inherit text-base mb-6 outline-none focus:border-accent transition-colors"
                />

                <button
                    disabled={!name.trim()}
                    onClick={() => onCreate(name.trim())}
                    className={`w-full p-4 rounded-xl border-none text-white text-base font-bold transition-colors ${name.trim()
                            ? 'bg-accent cursor-pointer hover:brightness-110'
                            : 'bg-inactive cursor-default'
                        }`}
                >
                    Создать
                </button>
            </div>
        </div>
    );
};

export default CreatePlaylistModal;
