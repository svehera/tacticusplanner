import { type HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
    orientation?: 'horizontal' | 'vertical';
}

const Separator = ({ orientation = 'horizontal', className, ...props }: SeparatorProps) => (
    <div
        role="separator"
        aria-orientation={orientation}
        className={twMerge(
            'shrink-0 bg-[var(--border)]',
            orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch',
            className
        )}
        {...props}
    />
);

export { Separator };
export type { SeparatorProps };
