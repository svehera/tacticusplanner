import React from 'react';

interface ButtonPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    className?: string;
    widthClass?: string; // Tailwind width class, e.g. w-24 or w-[100px]
    compact?: boolean;
}

export const ButtonPill: React.FC<ButtonPillProps> = ({
    children,
    compact = true,
    className = '',
    widthClass,
    ...props
}) => {
    const resolvedWidthClass = widthClass ?? (compact ? 'w-[96px]' : 'w-full');
    return (
        <button
            type="button"
            className={
                `${resolvedWidthClass} bg-(--secondary) font-bold text-(--fg) ` +
                `border-muted-fg/40 border hover:bg-(--accent) hover:text-(--accent-fg) ` +
                `rounded-full px-4 py-1.25 text-[11px] leading-none shadow-sm transition-colors transition-transform duration-75 focus-visible:ring-2 focus-visible:ring-(--accent)/40 focus-visible:outline-none active:scale-95 ` +
                className
            }
            {...props}>
            {children}
        </button>
    );
};
