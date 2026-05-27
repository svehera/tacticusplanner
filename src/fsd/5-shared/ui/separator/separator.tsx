import { type HTMLAttributes, type ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
    orientation?: 'horizontal' | 'vertical';
    children?: ReactNode;
}

const line = 'shrink-0 bg-[var(--border)]';

const Separator = ({ orientation = 'horizontal', className, children, ...props }: SeparatorProps) => {
    if (children && orientation === 'horizontal') {
        return (
            <div role="separator" className={twMerge('flex w-full items-center gap-3', className)} {...props}>
                <div className={twMerge(line, 'h-px flex-1')} />
                <span className="text-[10px] font-bold tracking-[.14em] text-(--soft-fg) uppercase">{children}</span>
                <div className={twMerge(line, 'h-px flex-1')} />
            </div>
        );
    }

    return (
        <div
            role="separator"
            aria-orientation={orientation}
            className={twMerge(line, orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch', className)}
            {...props}
        />
    );
};

export { Separator };
export type { SeparatorProps };
