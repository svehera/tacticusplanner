import React, { useRef, useState } from 'react';

export interface SliderProps {
    value: number;
    max: number;
    onChange: (value: number) => void;
    /** Tailwind bg-* class applied to the fill and thumb. Defaults to bg-(--primary). */
    fillClassName?: string;
    className?: string;
}

export const Slider = ({ value, max, onChange, fillClassName = 'bg-(--primary)', className = '' }: SliderProps) => {
    const trackReference = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState(false);

    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

    const seekToX = (clientX: number) => {
        if (!trackReference.current || max === 0) return;
        const { left, width } = trackReference.current.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - left) / width));
        onChange(Math.round(ratio * max));
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

    return (
        <div
            ref={trackReference}
            className={`relative cursor-pointer touch-none py-2 ${className}`}
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
                className={`pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-(--card) shadow-sm ${fillClassName} ${dragging ? 'scale-125' : 'scale-100'} motion-safe:transition-[left,transform] motion-safe:duration-200`}
                style={{ left: `${pct}%` }}
            />
        </div>
    );
};
