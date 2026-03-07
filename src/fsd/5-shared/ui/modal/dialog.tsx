import { XIcon } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import type { HeadingProps } from 'react-aria-components';
import { Button as ButtonPrimitive, Dialog as DialogPrimitive, Heading, Text } from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { useMediaQuery } from '@/fsd/5-shared/lib';

import { Button, ButtonProps as ButtonProperties } from '../button';

const dialogStyles = tv({
    slots: {
        root: [
            'peer/dialog group/dialog relative flex max-h-[inherit] flex-col overflow-hidden outline-hidden [scrollbar-width:thin] [&::-webkit-scrollbar]:size-0.5',
        ],
        header: 'relative flex flex-col gap-0.5 p-4 sm:gap-1 sm:p-6 [&[data-slot=dialog-header]:has(+[data-slot=dialog-footer])]:pb-0',
        description: 'text-muted-fg text-sm',
        body: [
            'isolate flex flex-1 flex-col overflow-auto px-4 sm:px-6',
            'max-h-[calc(var(--visual-viewport-height)-var(--visual-viewport-vertical-padding)-var(--dialog-header-height,0px)-var(--dialog-footer-height,0px))]',
        ],
        footer: 'isolate mt-auto flex flex-col-reverse justify-between gap-3 p-4 sm:flex-row sm:p-6',
        closeIndicator:
            'close absolute top-1 right-1 z-50 grid size-8 place-content-center rounded-xl data-focused:bg-secondary data-hovered:bg-secondary data-focused:outline-hidden data-focus-visible:ring-1 data-focus-visible:ring-primary sm:top-2 sm:right-2 sm:size-7 sm:rounded-md',
    },
});

const { root, header, description, body, footer, closeIndicator } = dialogStyles();

const Dialog = ({ role = 'dialog', className, ...properties }: React.ComponentProps<typeof DialogPrimitive>) => {
    return <DialogPrimitive role={role} className={root({ className })} {...properties} />;
};

const Trigger = (properties: React.ComponentProps<typeof ButtonPrimitive>) => <ButtonPrimitive {...properties} />;

type DialogHeaderProperties = React.HTMLAttributes<HTMLDivElement> & {
    title?: string;
    description?: string;
};

const Header = ({ className, ...properties }: DialogHeaderProperties) => {
    const headerReference = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        const header = headerReference.current;
        if (!header) {
            return;
        }

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                header.parentElement?.style.setProperty('--dialog-header-height', `${entry.target.clientHeight}px`);
            }
        });

        observer.observe(header);
        return () => observer.unobserve(header);
    }, []);

    return (
        <div data-slot="dialog-header" ref={headerReference} className={header({ className })}>
            {properties.title && <Title>{properties.title}</Title>}
            {properties.description && <Description>{properties.description}</Description>}
            {!properties.title && typeof properties.children === 'string' ? (
                <Title {...properties} />
            ) : (
                properties.children
            )}
        </div>
    );
};

const titleStyles = tv({
    base: 'flex flex-1 items-center text-fg',
    variants: {
        level: {
            1: 'font-semibold text-lg sm:text-xl',
            2: 'font-semibold text-lg sm:text-xl',
            3: 'font-semibold text-base sm:text-lg',
            4: 'font-semibold text-base',
        },
    },
});

interface DialogTitleProperties extends Omit<HeadingProps, 'level'> {
    level?: 1 | 2 | 3 | 4;
    ref?: React.Ref<HTMLHeadingElement>;
}
const Title = ({ level = 2, className, ref, ...properties }: DialogTitleProperties) => (
    <Heading slot="title" level={level} ref={ref} className={titleStyles({ level, className })} {...properties} />
);

type DialogDescriptionProperties = React.ComponentProps<'div'>;
const Description = ({ className, ref, ...properties }: DialogDescriptionProperties) => (
    <Text slot="description" className={description({ className })} ref={ref} {...properties} />
);

type DialogBodyProperties = React.ComponentProps<'div'>;
const Body = ({ className, ref, ...properties }: DialogBodyProperties) => (
    <div data-slot="dialog-body" ref={ref} className={body({ className })} {...properties} />
);

type DialogFooterProperties = React.ComponentProps<'div'>;
const Footer = ({ className, ...properties }: DialogFooterProperties) => {
    const footerReference = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const footer = footerReference.current;

        if (!footer) {
            return;
        }

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                footer.parentElement?.style.setProperty('--dialog-footer-height', `${entry.target.clientHeight}px`);
            }
        });

        observer.observe(footer);
        return () => {
            observer.unobserve(footer);
        };
    }, []);
    return <div ref={footerReference} data-slot="dialog-footer" className={footer({ className })} {...properties} />;
};

const Close = ({ className, appearance = 'outline', ref, ...properties }: ButtonProperties) => {
    return <Button slot="close" className={className} ref={ref} appearance={appearance} {...properties} />;
};

interface CloseButtonIndicatorProperties extends ButtonProperties {
    className?: string;
    isDismissable?: boolean | undefined;
}

const CloseIndicator = ({ className, ...properties }: CloseButtonIndicatorProperties) => {
    const isMobile = useMediaQuery('(max-width: 600px)');
    const buttonReference = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isMobile && buttonReference.current) {
            buttonReference.current.focus();
        }
    }, [isMobile]);
    return properties.isDismissable ? (
        <ButtonPrimitive
            ref={buttonReference}
            {...(isMobile ? { autoFocus: true } : {})}
            aria-label="Close"
            slot="close"
            className={closeIndicator({ className })}>
            <XIcon className="size-4" />
        </ButtonPrimitive>
    ) : undefined;
};

Dialog.Trigger = Trigger;
Dialog.Header = Header;
Dialog.Title = Title;
Dialog.Description = Description;
Dialog.Body = Body;
Dialog.Footer = Footer;
Dialog.Close = Close;
Dialog.CloseIndicator = CloseIndicator;

export { Dialog };
