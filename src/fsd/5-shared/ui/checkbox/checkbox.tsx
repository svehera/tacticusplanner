import { Check } from 'lucide-react';
import React from 'react';

export interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    children?: React.ReactNode;
    className?: string;
    disabled?: boolean;
}

export const Checkbox = ({ checked, onChange, children, className = '', disabled = false }: CheckboxProps) => (
    <label
        className={`flex items-center gap-2 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className}`}>
        <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
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
