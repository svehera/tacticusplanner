import React from 'react';
import { twMerge } from 'tailwind-merge';

const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={twMerge(
            'flex flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--card-fg)] shadow-sm',
            className
        )}
        {...props}
    />
);

/** Header row with a bottom border — mirrors the real card header pattern. */
const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={twMerge(
            'flex items-center justify-between gap-2 border-b border-[var(--card-border)] px-4 py-3',
            className
        )}
        {...props}
    />
);

const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={twMerge('text-base leading-none font-semibold', className)} {...props} />
);

const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={twMerge('text-sm text-[var(--muted-fg)]', className)} {...props} />
);

/** Main body area. */
const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={twMerge('flex-1 px-4 py-3 text-sm', className)} {...props} />
);

/** Footer row with a top border. */
const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={twMerge('flex items-center gap-2 border-t border-[var(--card-border)] px-4 py-3', className)}
        {...props}
    />
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
