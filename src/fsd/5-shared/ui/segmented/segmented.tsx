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
    /**
     * Names the group for assistive tech — "Metric", "Bar scale". Without it a screen reader reads
     * the options as loose buttons with nothing saying what they switch.
     */
    label?: string;
}

/**
 * `aria-pressed` rather than `role="radio"`: the buttons announce their on/off state either way, but
 * a radiogroup also promises arrow-key navigation and a single tab stop, which this does not
 * implement. Claiming the role without the keyboard contract is worse for a screen-reader user than
 * a group of labelled toggle buttons, which is what this actually is.
 */
export const Segmented = <T extends string | number>({
    value,
    onChange,
    options,
    className,
    label,
}: SegmentedProps<T>) => (
    <div
        role="group"
        aria-label={label}
        className={cn('inline-flex rounded-lg border border-[var(--border)] bg-[var(--neutral)] p-0.5', className)}>
        {options.map(o => (
            <button
                key={String(o.value)}
                type="button"
                aria-pressed={o.value === value}
                onClick={() => onChange(o.value)}
                className={cn(
                    'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                    o.value === value
                        ? 'bg-[var(--bg)] text-[var(--fg)] shadow-sm'
                        : 'text-[var(--soft-fg)] hover:text-[var(--fg)]'
                )}>
                {o.label}
            </button>
        ))}
    </div>
);
