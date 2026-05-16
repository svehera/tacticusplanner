import { type HTMLAttributes } from 'react';
import { type VariantProps, tv } from 'tailwind-variants';

const badgeStyles = tv({
    base: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
    variants: {
        intent: {
            default: 'bg-[var(--secondary)] text-[var(--secondary-fg)]',
            primary: 'bg-[var(--primary)] text-[var(--primary-fg)]',
            success: 'bg-[var(--success)] text-[var(--success-fg)]',
            warning: 'bg-[var(--warning)] text-[var(--warning-fg)]',
            danger: 'bg-[var(--danger)] text-[var(--danger-fg)]',
        },
        appearance: {
            solid: '',
            outline: 'bg-transparent border',
        },
    },
    compoundVariants: [
        { intent: 'default', appearance: 'outline', class: 'border-[var(--border)] text-[var(--fg)]' },
        { intent: 'primary', appearance: 'outline', class: 'border-[var(--primary)] text-[var(--primary)]' },
        { intent: 'success', appearance: 'outline', class: 'border-[var(--success)] text-[var(--success)]' },
        { intent: 'warning', appearance: 'outline', class: 'border-[var(--warning)] text-[var(--warning)]' },
        { intent: 'danger', appearance: 'outline', class: 'border-[var(--danger)] text-[var(--danger)]' },
    ],
    defaultVariants: {
        intent: 'default',
        appearance: 'solid',
    },
});

type BadgeVariants = VariantProps<typeof badgeStyles>;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, BadgeVariants {}

const Badge = ({ className, intent, appearance, ...props }: BadgeProps) => (
    <span className={badgeStyles({ intent, appearance, className })} {...props} />
);

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeStyles };
export type { BadgeProps };
