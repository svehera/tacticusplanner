import React from 'react';

export interface RadioOptionProps {
    name: string;
    value: string | number;
    checked: boolean;
    onChange: () => void;
    children: React.ReactNode;
}

export const RadioOption = ({ name, value, checked, onChange, children }: RadioOptionProps) => (
    <label className="flex cursor-pointer items-center gap-2">
        <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="peer sr-only" />
        <div
            className={[
                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                checked ? 'border-(--primary)' : 'border-(--input)',
                'peer-focus-visible:ring-2 peer-focus-visible:ring-(--ring) peer-focus-visible:ring-offset-1',
            ].join(' ')}>
            {checked && <div className="h-2 w-2 rounded-full bg-(--primary)" />}
        </div>
        <span className="text-sm text-(--fg)">{children}</span>
    </label>
);
