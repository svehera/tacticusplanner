import { tv } from 'tailwind-variants';

import { focusButtonStyles } from '../primitive';

export const buttonStyles = tv({
    extend: focusButtonStyles,
    base: [
        'relative overflow-hidden inline-flex items-center justify-center gap-x-2 border font-bold no-underline',
        'forced-colors:[--btn-icon:ButtonText] forced-colors:data-hovered:[--btn-icon:ButtonText]',
        '*:data-[slot=icon]:-mx-0.5 *:data-[slot=icon]:my-1 *:data-[slot=icon]:size-5 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:transition',
        '*:data-[slot=avatar]:-mx-0.5 *:data-[slot=avatar]:my-1 *:data-[slot=avatar]:*:size-4 *:data-[slot=avatar]:size-4 *:data-[slot=avatar]:shrink-0',
        // Ensure children paint above the ::after state-layer overlay
        '[&>*]:relative [&>*]:z-10',
        // State-layer overlay — activated by outline/plain appearances
        "after:content-[''] after:pointer-events-none after:absolute after:inset-0 after:z-0 after:rounded-[inherit] after:bg-current after:opacity-0 after:transition-opacity after:duration-150",
    ],
    variants: {
        intent: {
            primary: [
                'outline-primary [--btn-bg:theme(--color-primary/95%)] [--btn-border:var(--color-primary)] [--btn-fg:var(--color-primary-fg)] [--btn-accent:var(--color-primary)] dark:[--btn-bg:theme(--color-primary/90%)]',
                '[--btn-bg-hovered:theme(--color-primary/87%)] [--btn-border-hovered:theme(--color-primary/87%)] dark:[--btn-bg-hovered:theme(--color-primary)] dark:[--btn-border-hovered:theme(--color-primary)]',
                'inset-shadow-primary-fg/20 data-hovered:inset-shadow-primary-fg/25 data-pressed:inset-shadow-primary-fg/20',
            ],
            secondary: [
                'outline-secondary-fg [--btn-bg:theme(--color-secondary/95%)] [--btn-border:theme(--color-secondary-fg/60%)] [--btn-fg:var(--color-secondary-fg)] [--btn-accent:var(--color-soft-fg)] dark:[--btn-bg:theme(--color-secondary/85%)]',
                '[--btn-bg-hovered:color-mix(in_oklab,var(--color-secondary)_85%,black_15%)] [--btn-border-hovered:theme(--color-secondary-fg/50%)] dark:[--btn-bg-hovered:color-mix(in_oklab,var(--color-secondary)_90%,white_10%)] dark:[--btn-border-hovered:theme(--color-secondary-fg/45%)]',
                'inset-shadow-secondary-fg/8 data-hovered:inset-shadow-secondary-fg/12 data-pressed:inset-shadow-secondary-fg/8',
            ],
            warning: [
                '[--btn-warning:theme(--color-warning/97%)]',
                '[--btn-warning-hovered:color-mix(in_oklab,var(--color-warning)_85%,white_15%)]',
                'dark:[--btn-warning-hovered:color-mix(in_oklab,var(--color-warning)_90%,white_10%)]',
                'outline-warning [--btn-bg:var(--btn-warning)] [--btn-border:var(--btn-warning)] [--btn-fg:var(--color-warning-fg)] [--btn-accent:var(--color-warning-accent)]',
                '[--btn-bg-hovered:var(--btn-warning-hovered)] [--btn-border-hovered:var(--btn-warning-hovered)]',
                'inset-shadow-white/25 data-hovered:inset-shadow-white/30 data-pressed:inset-shadow-white/25',
            ],
            success: [
                'outline-success [--btn-bg:theme(--color-success/95%)] [--btn-border:var(--color-success)] [--btn-fg:var(--color-success-fg)] [--btn-accent:var(--color-success-accent)] dark:[--btn-bg:var(--color-success)]',
                '[--btn-success-hovered:color-mix(in_oklab,var(--color-success)_90%,white_10%)]',
                'dark:[--btn-success-hovered:color-mix(in_oklab,var(--color-success)_96%,white_4%)]',
                '[--btn-bg-hovered:var(--btn-success-hovered)] [--btn-border-hovered:var(--btn-success-hovered)]',
                'inset-shadow-success-fg/25 data-hovered:inset-shadow-success-fg/30 data-pressed:inset-shadow-success-fg/25',
            ],
            danger: [
                'outline-danger [--btn-bg:theme(--color-danger/95%)] [--btn-border:var(--color-danger)] [--btn-fg:var(--color-danger-fg)] [--btn-accent:var(--color-danger-accent)] dark:[--btn-bg:var(--color-danger)]',
                '[--btn-danger-hovered:color-mix(in_oklab,var(--color-danger)_93%,white_7%)]',
                'dark:[--btn-danger-hovered:color-mix(in_oklab,var(--color-danger)_96%,white_4%)]',
                '[--btn-bg-hovered:var(--btn-danger-hovered)] [--btn-border-hovered:var(--btn-danger-hovered)]',
                'inset-shadow-danger-fg/30 data-hovered:inset-shadow-danger-fg/35 data-pressed:inset-shadow-danger-fg/30',
            ],
        },
        appearance: {
            solid: [
                'inset-ring-0 dark:inset-ring dark:border-0',
                'inset-ring-(--btn-border) inset-shadow-2xs border-(--btn-border) bg-(--btn-bg) text-(--btn-fg) transition-colors',
                'data-hovered:bg-(--btn-bg-hovered) data-hovered:ring-(--btn-border-hovered)',
                'data-pressed:border-(--btn-border) data-pressed:bg-(--btn-bg) data-pressed:after:opacity-[0.10]',
            ],
            outline: [
                'border-2 border-(--btn-border)/90 text-(--btn-accent)/90 transition-colors',
                // The ::after overlay sits inside the 2 px border; subtract border-width from
                // the outer radius so the overlay corner arc aligns with the inner border edge.
                'after:rounded-[calc(var(--btn-radius,var(--radius-lg))-2px)]',
                'data-hovered:border-(--btn-border) data-hovered:text-(--btn-accent) data-hovered:after:opacity-[0.18]',
                'data-pressed:border-(--btn-border) data-pressed:text-(--btn-accent) data-pressed:after:opacity-[0.28]',
            ],
            plain: [
                'border-transparent text-(--btn-accent)/90 transition-colors',
                'data-hovered:text-(--btn-accent) data-hovered:after:opacity-[0.20]',
                'data-pressed:text-(--btn-accent) data-pressed:after:opacity-[0.30]',
            ],
        },
        size: {
            'extra-small': 'h-8 px-[calc(var(--spacing)*2.7)] text-xs/4 lg:text-[0.800rem]/4',
            small: 'h-9 px-3.5 text-sm/5 sm:text-sm/5',
            medium: 'h-10 px-4 text-base sm:text-sm/6',
            large: 'h-11 px-4.5 text-base *:data-[slot=icon]:mx-[-1.5px] sm:*:data-[slot=icon]:size-5 lg:text-base/7',
            'square-petite': 'size-9 shrink-0',
        },
        shape: {
            square: 'rounded-lg [--btn-radius:var(--radius-lg)]',
            circle: 'rounded-full [--btn-radius:9999px]',
        },
        isDisabled: {
            false: 'cursor-pointer forced-colors:data-disabled:text-[GrayText]',
            true: 'inset-shadow-none cursor-default border-0 opacity-50 ring-0 dark:inset-ring-0 forced-colors:data-disabled:text-[GrayText]',
        },
        isPending: {
            true: 'cursor-default opacity-50',
        },
    },
    defaultVariants: {
        intent: 'primary',
        appearance: 'solid',
        size: 'medium',
        shape: 'square',
    },
});
