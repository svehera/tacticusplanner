import { ChevronDown, ChevronRight } from 'lucide-react';
import { Children, cloneElement, HTMLAttributes, isValidElement, ReactElement, ReactNode, useState } from 'react';
import { twMerge } from 'tailwind-merge';

/* ─── Accordion (card-style collapsible) ──────────────────────────────────── */

interface AccordionProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onToggle'> {
    children: ReactNode;
    /** Controlled mode — overrides internal state. */
    expanded?: boolean;
    /** Fires when the header is clicked. Required for controlled mode. */
    onToggle?: (expanded: boolean) => void;
    /** Start expanded (uncontrolled mode only). @default false */
    defaultExpanded?: boolean;
}

const Accordion = ({
    children,
    expanded: controlledExpanded,
    onToggle,
    defaultExpanded = false,
    className,
    ...props
}: AccordionProps) => {
    const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
    const isControlled = controlledExpanded !== undefined;
    const expanded = isControlled ? controlledExpanded : internalExpanded;

    const toggle = () => {
        const next = !expanded;
        if (!isControlled) setInternalExpanded(next);
        onToggle?.(next);
    };

    return (
        <div
            className={twMerge(
                'overflow-hidden rounded-xl border border-(--card-border) bg-(--soft) shadow-sm',
                className
            )}
            {...props}>
            {Children.map(children, child => {
                if (!isValidElement(child)) return child;
                if (child.type === AccordionHeader) {
                    return cloneElement(child as ReactElement<AccordionHeaderInternalProps>, {
                        _expanded: expanded,
                        _onToggle: toggle,
                    });
                }
                if (child.type === AccordionBody) {
                    return expanded ? child : undefined;
                }
                return child;
            })}
        </div>
    );
};

/* ─── AccordionHeader ─────────────────────────────────────────────────────── */

interface AccordionHeaderInternalProps extends HTMLAttributes<HTMLButtonElement> {
    _expanded?: boolean;
    _onToggle?: () => void;
}

const AccordionHeader = ({ children, className, _expanded, _onToggle, ...props }: AccordionHeaderInternalProps) => (
    <button
        type="button"
        onClick={_onToggle}
        className={twMerge(
            'flex w-full cursor-pointer items-center justify-between bg-(--soft) p-4 transition-colors hover:bg-(--primary)/10',
            className
        )}
        {...props}>
        <div className="flex items-center gap-3">{children}</div>
        {_expanded ? (
            <ChevronDown size={20} className="shrink-0 text-(--soft-fg)" />
        ) : (
            <ChevronRight size={20} className="shrink-0 text-(--soft-fg)" />
        )}
    </button>
);

/* ─── AccordionBody ───────────────────────────────────────────────────────── */

const AccordionBody = ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={twMerge('border-t border-(--card-border) p-4', className)} {...props}>
        {children}
    </div>
);

export { Accordion, AccordionHeader, AccordionBody };
