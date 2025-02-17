import { tv } from 'tailwind-variants';
import { focusButtonStyles } from '@/shared/ui/primitive';

export const linkStyles = tv({
    extend: focusButtonStyles,
    base: 'transition-[color,_opacity] data-disabled:cursor-default data-disabled:opacity-60 forced-colors:data-disabled:text-[GrayText]',
    variants: {
        intent: {
            unstyled: 'text-current',
            primary: 'text-fg data-hovered:underline',
            secondary: 'text-muted-fg data-hovered:text-secondary-fg',
        },
    },
    defaultVariants: {
        intent: 'unstyled',
    },
});
