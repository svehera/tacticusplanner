import React from 'react';

type ProgressBarIntent = 'success' | 'warning' | 'primary';

const fillByIntent: Record<ProgressBarIntent, string> = {
    success: 'bg-(--success)',
    warning: 'bg-(--warning)',
    primary: 'bg-(--primary)',
};

interface ProgressBarProps {
    value: number;
    max: number;
    intent?: ProgressBarIntent;
    /** Left-side label in the row above the bar. */
    label?: React.ReactNode;
    /** Right-side value readout in the row above the bar. */
    valueLabel?: React.ReactNode;
    /** Left-side caption below the bar. */
    subLeft?: React.ReactNode;
    /** Right-side caption below the bar. */
    subRight?: React.ReactNode;
    /** Accessible name for the bar. Falls back to `label` when it's a plain string. */
    ariaLabel?: string;
    className?: string;
}

/** Generic token-styled progress bar with optional label and sub-caption rows. */
export const ProgressBar: React.FC<ProgressBarProps> = ({
    value,
    max,
    intent = 'primary',
    label,
    valueLabel,
    subLeft,
    subRight,
    ariaLabel,
    className = '',
}) => {
    const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 100;
    const accessibleName = ariaLabel ?? (typeof label === 'string' ? label : undefined);

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {(label !== undefined || valueLabel !== undefined) && (
                <div className="flex items-center justify-between text-xs text-(--soft-fg)">
                    <span className="inline-flex items-center gap-1.5">{label}</span>
                    <span className="font-bold text-(--fg) tabular-nums">{valueLabel}</span>
                </div>
            )}
            <div
                role="progressbar"
                aria-label={accessibleName}
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 overflow-hidden rounded-full bg-(--fg)/12">
                <div
                    className={`h-full w-full origin-left transition-transform duration-500 motion-reduce:transition-none ${fillByIntent[intent]}`}
                    style={{ transform: `scaleX(${percent / 100})` }}
                />
            </div>
            {(subLeft !== undefined || subRight !== undefined) && (
                <div className="flex items-center justify-between text-xs text-(--soft-fg) tabular-nums">
                    <span>{subLeft}</span>
                    <span className="inline-flex items-center gap-1">{subRight}</span>
                </div>
            )}
        </div>
    );
};
