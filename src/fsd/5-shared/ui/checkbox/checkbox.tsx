import { Check } from 'lucide-react';
import React from 'react';

export interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    children?: React.ReactNode;
    className?: string;
}

export const Checkbox = ({ checked, onChange, children, className = '' }: CheckboxProps) => (
    <label className={`flex cursor-pointer items-center gap-2 ${className}`}>
        <input
            type="checkbox"
            checked={checked}
            onChange={event => onChange(event.target.checked)}
            className="sr-only"
        />
        <div
            className={[
                'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors',
                checked ? 'border-(--primary) bg-(--primary)' : 'border-(--input)',
            ].join(' ')}>
            {checked && <Check className="h-3 w-3 text-(--primary-fg)" strokeWidth={3} />}
        </div>
        {children && <span className="text-sm text-(--fg)">{children}</span>}
    </label>
);
