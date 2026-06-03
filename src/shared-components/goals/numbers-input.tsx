import React, { useState } from 'react';

interface Props {
    title: string;
    helperText?: string;
    value?: number;
    valueChange: (value: number) => void;
}

export const NumbersInput: React.FC<Props> = ({ value, valueChange, title, helperText }) => {
    const [inputValue, setInputValue] = useState((value ?? '').toString());

    return (
        <div className="flex flex-col gap-y-1">
            <label className="mb-1 block text-sm font-medium text-(--soft-fg)">{title}</label>
            <input
                type="number"
                value={inputValue}
                onChange={event => {
                    setInputValue(event.target.value);
                    const newValue = Number(event.target.value);
                    if (!Number.isNaN(newValue)) {
                        valueChange(Math.min(newValue, 10_000));
                    }
                }}
                min={0}
                max={10_000}
                step={1}
                className="h-10 w-full rounded-lg border border-(--input) bg-(--neutral) px-3 text-sm text-(--fg) shadow-sm transition-all hover:border-(--primary) focus:ring-2 focus:ring-(--ring) focus:outline-none"
            />
            {helperText && <span className="text-xs text-(--soft-fg)">{helperText}</span>}
        </div>
    );
};
