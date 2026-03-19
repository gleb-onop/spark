import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { parseTime, formatTime } from '@/utils/time';

interface MaskedTimeInputProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    className?: string;
    duration?: number;
}

export const MaskedTimeInput = ({
    id,
    value,
    onChange,
    onBlur,
    className,
    duration = 0,
}: MaskedTimeInputProps) => {
    // We'll internalize the value into parts: HH, MM, SS, mmm
    // value is expected to be in "h:mm:ss.sss" or similar format supported by parseTime
    const [parts, setParts] = useState({ hh: '', mm: '', ss: '', mmm: '' });

    // Blocking logic
    const isHourDisabled = duration > 0 && duration < 3600;
    const isMinuteDisabled = duration > 0 && duration < 60;

    // Refs for jumping focus
    const hhRef = useRef<HTMLInputElement>(null);
    const mmRef = useRef<HTMLInputElement>(null);
    const ssRef = useRef<HTMLInputElement>(null);
    const mmmRef = useRef<HTMLInputElement>(null);

    // Track if any input is focused to avoid useEffect overwriting local state
    const [isFocused, setIsFocused] = useState(false);

    // Update local parts when external value changes
    useEffect(() => {
        if (isFocused) return;

        const totalSeconds = parseTime(value);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = Math.floor(totalSeconds % 60);
        const ms = Math.round((totalSeconds % 1) * 1000);

        setParts({
            hh: (isHourDisabled ? 0 : h).toString().padStart(2, '0'),
            mm: (isMinuteDisabled ? 0 : m).toString().padStart(2, '0'),
            ss: s.toString().padStart(2, '0'),
            mmm: ms.toString().padStart(3, '0'),
        });
    }, [value, isFocused, isHourDisabled, isMinuteDisabled]);

    const updateValue = (newParts: typeof parts) => {
        const hh = isHourDisabled ? 0 : (parseInt(newParts.hh) || 0);
        const mm = isMinuteDisabled ? 0 : (parseInt(newParts.mm) || 0);
        const ss = parseInt(newParts.ss) || 0;
        const mmm = parseInt(newParts.mmm) || 0;

        const totalSeconds = (hh * 3600) + (mm * 60) + ss + (mmm / 1000);
        // We use formatTime to get a standard string representation
        onChange(formatTime(totalSeconds, true));
    };

    const handleChange = (field: keyof typeof parts, val: string) => {
        if ((field === 'hh' && isHourDisabled) || (field === 'mm' && isMinuteDisabled)) return;

        // Only digits
        const digits = val.replace(/\D/g, '');
        const maxLen = field === 'mmm' ? 3 : 2;

        let clamped = digits;

        // If we have more than maxLen, it means user typed into a full field
        // without selecting/replacing. We take only the LAST digit to allow "overwrite-like" behavior
        // or just to avoid "001" -> "01" jumps.
        if (digits.length > maxLen) {
            clamped = digits.slice(-1);
        }

        if (field === 'mm' || field === 'ss') {
            if (parseInt(clamped) > 59) clamped = '59';
        }

        const newParts = { ...parts, [field]: clamped };
        setParts(newParts);
        updateValue(newParts);

        // Auto focus next ONLY if we reached exactly maxLen
        if (clamped.length === maxLen) {
            if (field === 'hh') mmRef.current?.focus();
            else if (field === 'mm') ssRef.current?.focus();
            else if (field === 'ss') mmmRef.current?.focus();
        }
    };

    const handleKeyDown = (field: keyof typeof parts, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && parts[field] === '') {
            if (field === 'mm' && !isHourDisabled) hhRef.current?.focus();
            else if (field === 'ss' && !isMinuteDisabled) mmRef.current?.focus();
            else if (field === 'ss' && isMinuteDisabled && !isHourDisabled) hhRef.current?.focus(); // Skip disabled mm
            else if (field === 'mmm') ssRef.current?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        const totalSeconds = parseTime(pastedData);
        onChange(formatTime(totalSeconds, true));
    };

    const handleBlurInternal = () => {
        setIsFocused(false);
        // Ensure padding on blur
        setParts(prev => ({
            hh: isHourDisabled ? '00' : prev.hh.padStart(2, '0'),
            mm: isMinuteDisabled ? '00' : prev.mm.padStart(2, '0'),
            ss: prev.ss.padStart(2, '0'),
            mmm: prev.mmm.padStart(3, '0'),
        }));
        onBlur?.();
    };

    const inputClasses = "bg-transparent text-center focus:outline-none w-full p-0 border-none transition-all placeholder:text-muted-foreground/30";
    const disabledClasses = "opacity-20 pointer-events-none grayscale";

    return (
        <div
            className={cn(
                "flex items-center justify-between px-3 h-12 rounded-xl bg-muted/30 border-none shadow-inner group transition-all focus-within:ring-2 focus-within:ring-primary/20",
                className
            )}
            onPaste={handlePaste}
        >
            <div className="flex items-center flex-1 justify-center gap-1">
                <div className={cn("flex flex-col items-center w-8", isHourDisabled && disabledClasses)}>
                    <input
                        ref={hhRef}
                        id={id}
                        type="text"
                        inputMode="numeric"
                        value={parts.hh}
                        onChange={(e) => handleChange('hh', e.target.value)}
                        onKeyDown={(e) => handleKeyDown('hh', e)}
                        onFocus={(e) => {
                            if (isHourDisabled) {
                                mmRef.current?.focus();
                                return;
                            }
                            setIsFocused(true);
                            e.target.select();
                        }}
                        onMouseUp={(e) => e.preventDefault()}
                        onBlur={handleBlurInternal}
                        placeholder="00"
                        className={inputClasses}
                        disabled={isHourDisabled}
                        tabIndex={isHourDisabled ? -1 : 0}
                    />
                </div>
                <span className={cn("text-muted-foreground/40 font-light", isHourDisabled && "opacity-20")}>:</span>
                <div className={cn("flex flex-col items-center w-8", isMinuteDisabled && disabledClasses)}>
                    <input
                        ref={mmRef}
                        type="text"
                        inputMode="numeric"
                        value={parts.mm}
                        onChange={(e) => handleChange('mm', e.target.value)}
                        onKeyDown={(e) => handleKeyDown('mm', e)}
                        onFocus={(e) => {
                            if (isMinuteDisabled) {
                                ssRef.current?.focus();
                                return;
                            }
                            setIsFocused(true); e.target.select();
                        }}
                        onMouseUp={(e) => e.preventDefault()}
                        onBlur={handleBlurInternal}
                        placeholder="00"
                        className={inputClasses}
                        disabled={isMinuteDisabled}
                        tabIndex={isMinuteDisabled ? -1 : 0}
                    />
                </div>
                <span className={cn("text-muted-foreground/40 font-light", isMinuteDisabled && "opacity-20")}>:</span>
                <div className="flex flex-col items-center w-8">
                    <input
                        ref={ssRef}
                        type="text"
                        inputMode="numeric"
                        value={parts.ss}
                        onChange={(e) => handleChange('ss', e.target.value)}
                        onKeyDown={(e) => handleKeyDown('ss', e)}
                        onFocus={(e) => { setIsFocused(true); e.target.select(); }}
                        onMouseUp={(e) => e.preventDefault()}
                        onBlur={handleBlurInternal}
                        placeholder="00"
                        className={inputClasses}
                    />
                </div>
                <span className="text-muted-foreground/40 font-light">.</span>
                <div className="flex flex-col items-center w-12">
                    <input
                        ref={mmmRef}
                        type="text"
                        inputMode="numeric"
                        value={parts.mmm}
                        onChange={(e) => handleChange('mmm', e.target.value)}
                        onKeyDown={(e) => handleKeyDown('mmm', e)}
                        onFocus={(e) => { setIsFocused(true); e.target.select(); }}
                        onMouseUp={(e) => e.preventDefault()}
                        onBlur={handleBlurInternal}
                        placeholder="000"
                        className={inputClasses}
                    />
                </div>
            </div>
        </div>
    );
};
