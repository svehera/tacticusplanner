import React, { useRef, useState } from 'react';

export interface SliderMark {
    value: number;
    label?: string;
}

export interface SliderProps {
    value: number;
    max: number;
    onChange: (value: number) => void;
    /** Minimum value. Defaults to 0. */
    min?: number;
    /** Step granularity. When omitted, the slider snaps to marks (if provided) or rounds to the nearest integer. */
    step?: number;
    /** Discrete marks rendered as ticks with optional labels below the track. When provided, the thumb snaps to the nearest mark. */
    marks?: SliderMark[];
    /** Tailwind bg-* class applied to the fill and thumb. Defaults to bg-(--primary). */
    fillClassName?: string;
    className?: string;
    'aria-label'?: string;
}

export const Slider = ({
    value,
    max,
    onChange,
    min: minProperty,
    step,
    marks,
    fillClassName = 'bg-(--primary)',
    className = '',
    'aria-label': ariaLabel,
}: SliderProps) => {
    const trackReference = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState(false);

    const min = minProperty ?? 0;
    const range = max - min;
    const pct = range > 0 ? Math.min(100, ((value - min) / range) * 100) : 0;

    const snapValue = (raw: number): number => {
        if (marks && marks.length > 0) {
            let closest = marks[0];
            for (const mark of marks) {
                if (Math.abs(mark.value - raw) < Math.abs(closest.value - raw)) {
                    closest = mark;
                }
            }
            return closest.value;
        }
        if (step != undefined) {
            const decimals = (step.toString().split('.')[1] || '').length;
            const snapped = Math.round((raw - min) / step) * step + min;
            return Number.parseFloat(Math.max(min, Math.min(max, snapped)).toFixed(decimals));
        }
        return Math.round(raw);
    };

    const seekToX = (clientX: number) => {
        if (!trackReference.current || range === 0) return;
        const { left, width } = trackReference.current.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - left) / width));
        onChange(snapValue(min + ratio * range));
    };

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
        seekToX(event.clientX);
    };
    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.buttons === 0) return;
        seekToX(event.clientX);
    };
    const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        event.currentTarget.releasePointerCapture(event.pointerId);
        setDragging(false);
    };

    const hasMarks = marks && marks.length > 0;

    return (
        <div
            ref={trackReference}
            role="slider"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-label={ariaLabel}
            tabIndex={0}
            className={`relative cursor-pointer touch-none py-2 ${hasMarks ? 'pb-8' : ''} ${className}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}>
            {/* track + fill */}
            <div className="h-[6px] overflow-hidden rounded-full bg-(--fg)/12">
                <div
                    className={`h-full rounded-full ${dragging ? '' : 'motion-safe:transition-[width] motion-safe:duration-200'} ${fillClassName}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {/* thumb */}
            <div
                className={`pointer-events-none absolute top-2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-(--card) shadow-sm ${fillClassName} ${dragging ? 'scale-125' : 'scale-100 motion-safe:transition-[left,transform] motion-safe:duration-200'}`}
                style={{ left: `${pct}%` }}
            />
            {/* marks */}
            {hasMarks && (
                <div className="relative mt-1.5" aria-hidden="true">
                    {marks.map(mark => {
                        const markPct = range > 0 ? ((mark.value - min) / range) * 100 : 0;
                        return (
                            <div
                                key={mark.value}
                                className="absolute flex -translate-x-1/2 flex-col items-center"
                                style={{ left: `${markPct}%` }}>
                                <div className="h-1.5 w-px bg-(--fg)/30" />
                                {mark.label && (
                                    <span className="mt-0.5 text-[10px] leading-tight whitespace-nowrap text-(--soft-fg) select-none">
                                        {mark.label}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
