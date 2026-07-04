import { X } from 'lucide-react';
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/fsd/5-shared/lib';

import { useScrollLock } from './use-scroll-lock';

const sizeClasses: Record<string, string> = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
};

interface PortalDialogContextValue {
    onClose: () => void;
}

const PortalDialogContext = createContext<PortalDialogContextValue>({
    onClose: () => {},
});

interface PortalDialogProps {
    open: boolean;
    onClose: () => void;
    'aria-label': string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
    className?: string;
    children: React.ReactNode;
}

const PortalDialogRoot = ({
    open,
    onClose,
    'aria-label': ariaLabel,
    size = 'lg',
    className,
    children,
}: PortalDialogProps) => {
    const dialogReference = useRef<HTMLDivElement>(null);
    const pointerDownOnBackdrop = useRef(false);

    useScrollLock(open);

    useEffect(() => {
        if (open) {
            requestAnimationFrame(() => dialogReference.current?.focus());
        }
    }, [open]);

    // eslint-disable-next-line unicorn/no-null -- createPortal requires null when closed
    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[200] flex items-start justify-center overflow-auto bg-black/50 py-8"
            onPointerDown={event_ => {
                pointerDownOnBackdrop.current = event_.target === event_.currentTarget;
            }}
            onClick={event_ => {
                // Only close when the press both started and ended on the backdrop.
                // Prevents closing when a drag (e.g. selecting in a dropdown) is released outside the dialog.
                if (event_.target === event_.currentTarget && pointerDownOnBackdrop.current) onClose();
            }}>
            <PortalDialogContext.Provider value={{ onClose }}>
                <div
                    ref={dialogReference}
                    role="dialog"
                    aria-modal="true"
                    aria-label={ariaLabel}
                    tabIndex={-1}
                    onKeyDown={event_ => {
                        if (event_.key === 'Escape') onClose();
                    }}
                    className={cn(
                        'relative w-full rounded-2xl border border-(--border) bg-(--overlay) text-(--overlay-fg) shadow-lg outline-none',
                        sizeClasses[size],
                        className
                    )}>
                    {children}
                </div>
            </PortalDialogContext.Provider>
        </div>,
        document.body
    );
};

interface SubComponentProps {
    children: React.ReactNode;
    className?: string;
}

const Header = ({ children, className }: SubComponentProps) => {
    const { onClose } = useContext(PortalDialogContext);

    return (
        <div className={cn('flex items-center justify-between p-4 sm:p-6', className)}>
            <div className="flex items-center gap-4 text-lg font-semibold text-(--fg)">{children}</div>
            <button
                onClick={onClose}
                aria-label="Close"
                className="grid size-7 cursor-pointer place-content-center rounded-md text-(--soft-fg) hover:bg-(--neutral)">
                <X className="size-4" />
            </button>
        </div>
    );
};

const Body = ({ children, className }: SubComponentProps) => (
    <div className={cn('flex flex-col gap-5 px-4 sm:px-6', className)}>{children}</div>
);

const Footer = ({ children, className }: SubComponentProps) => (
    <div className={cn('flex justify-end gap-3 p-4 sm:p-6', className)}>{children}</div>
);

export const PortalDialog = Object.assign(PortalDialogRoot, {
    Header,
    Body,
    Footer,
});
