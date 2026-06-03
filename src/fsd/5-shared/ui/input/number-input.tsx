import React, { useEffect, useState } from 'react';

import { cn } from '@/fsd/5-shared/lib';

interface Props {
    label: string;
    value: number;
    valueChange: (v: number) => void;
    fullWidth?: boolean;
    disabled?: boolean;
    max?: number;
    min?: number;
    step?: number;
    style?: React.CSSProperties;
}

export const NumberInput: React.FC<Props> = ({
    label,
    value,
    valueChange,
    fullWidth = false,
    disabled = false,
    max = 60,
    min = 1,
    step = 1,
    style = {},
}) => {
    const [inputValue, setInputValue] = useState((value ?? '').toString());

    useEffect(() => {
        setInputValue(value.toString());
    }, [value]);

    return (
        <div className={cn('flex flex-col gap-y-1', fullWidth && 'w-full')} style={style}>
            <label className="mb-1 block text-sm font-medium text-(--soft-fg)">{label}</label>
            <input
                type="number"
                value={inputValue}
                onChange={event => {
                    setInputValue(event.target.value);
                    const newValue = Number(event.target.value);
                    if (!Number.isNaN(newValue)) {
                        valueChange(Math.min(Math.max(newValue, min), max));
                    }
                }}
                disabled={disabled}
                min={min}
                max={max}
                step={step}
                className="h-10 w-full rounded-lg border border-(--input) bg-(--neutral) px-3 text-sm text-(--fg) shadow-sm transition-all hover:border-(--primary) focus:ring-2 focus:ring-(--ring) focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
        </div>
    );
};
