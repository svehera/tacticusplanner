import React from 'react';

interface ButtonPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export const ButtonPill: React.FC<ButtonPillProps> = ({ children, className = '', ...props }) => (
    <button
        type="button"
        className={
            `bg-[var(--secondary)] font-bold text-[color:var(--fg)] ` +
            `border-muted-fg/40 border hover:bg-[var(--accent)] hover:text-[color:var(--accent-fg)] ` +
            `rounded-full px-4 py-[0.3125rem] text-[11px] leading-none shadow-sm transition-colors focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none active:scale-95 ` +
            className
        }
        {...props}>
        {children}
    </button>
);
