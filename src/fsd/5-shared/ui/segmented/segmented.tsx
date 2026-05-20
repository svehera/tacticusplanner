import React from 'react';

import { cn } from '@/fsd/5-shared/lib';

interface SegmentedOption<T> {
    value: T;
    label: React.ReactNode;
}

interface SegmentedProps<T extends string | number> {
    value: T;
    onChange: (value: T) => void;
    options: SegmentedOption<T>[];
    className?: string;
}

export const Segmented = <T extends string | number>({ value, onChange, options, className }: SegmentedProps<T>) => (
    <div className={cn('inline-flex rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-0.5', className)}>
        {options.map(o => (
            <button
                key={String(o.value)}
                type="button"
                onClick={() => onChange(o.value)}
                className={cn(
                    'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                    o.value === value
                        ? 'bg-[var(--bg)] text-[var(--fg)] shadow-sm'
                        : 'text-[var(--muted-fg)] hover:text-[var(--fg)]'
                )}>
                {o.label}
            </button>
        ))}
    </div>
);
