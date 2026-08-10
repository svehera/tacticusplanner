import { ClickAwayListener, Tooltip } from '@mui/material';
import {
    FC,
    FocusEvent,
    HTMLAttributes,
    MouseEvent,
    ReactElement,
    ReactNode,
    cloneElement,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { isMobile } from 'react-device-detect';

interface Props {
    title: ReactNode;
    children: ReactElement;
}

/**
 * Shared by both variants so they cannot drift apart. 700ms is long enough that sweeping a pointer
 * across a dense grid of icons opens nothing; MUI's own default of 100ms is far too twitchy here.
 */
const ENTER_DELAY_MS = 700;

/**
 * Tap-to-toggle tooltip for touch devices, shared by both variants.
 *
 * There is no hover on touch, so every listener is disabled and `open` is driven explicitly by a
 * tap, with a click-away to dismiss. MUI's `Popper` renders nothing while closed, so passing the
 * real title costs nothing until the user actually taps — no need for the withheld-title trick the
 * pointer path uses.
 */
const TouchTooltip: FC<Props> = ({ title, children }) => {
    const [open, setOpen] = useState(false);
    const close = useCallback(() => setOpen(false), []);

    /**
     * The tap handler goes on the child, not on `Tooltip`. MUI does forward its own extra props to
     * the cloned child, but as `{ ...other, ...children.props }` — so a child that already has an
     * `onClick` (a button, a filter chip) silently wins and the tooltip never opens on tap.
     * Composing here keeps both.
     */
    const childProps = children.props as HTMLAttributes<HTMLElement>;
    const trigger = cloneElement(children, {
        onClick: (event: MouseEvent<HTMLElement>) => {
            childProps.onClick?.(event);
            setOpen(value => !value);
        },
    } as Partial<HTMLAttributes<HTMLElement>>);

    return (
        <ClickAwayListener onClickAway={close} mouseEvent="onMouseUp">
            <Tooltip
                slotProps={{ popper: { disablePortal: false } }}
                placement="top"
                arrow
                onClose={close}
                open={open}
                disableFocusListener
                disableHoverListener
                disableTouchListener
                title={title}>
                {trigger}
            </Tooltip>
        </ClickAwayListener>
    );
};

/**
 * Tooltip that withholds its title until the user actually interacts, so MUI never builds a Popper
 * for an element nobody touched. The `Tooltip` wrapper itself stays mounted so the child is never
 * remounted mid-interaction.
 *
 * Activation listens for **focus as well as hover**: MUI opens on focus by default, but a withheld
 * title forces `open = false`, so without the focus handler a keyboard user gets no tooltip at all.
 *
 * While inactive the title is also mirrored onto `aria-label`, because an empty title means MUI
 * wires up no ARIA of its own. That only applies when the title is a plain string and the child does
 * not already name itself, and it is dropped the moment MUI takes over.
 */
export const LazyTooltip: FC<{ title: ReactNode; children: ReactElement<HTMLAttributes<HTMLElement>> }> = ({
    title,
    children,
}) => {
    const [active, setActive] = useState(false);

    // Setting the same value is a no-op in React, so this needs no `active` guard and stays stable.
    const activate = useCallback(() => setActive(true), []);

    const child = useMemo(() => {
        const { onMouseEnter, onFocus, 'aria-label': existingLabel } = children.props;
        // Only stand in for the accessible name while MUI is not managing it, and never override a
        // name the child already has.
        const ariaLabel = !active && existingLabel === undefined && typeof title === 'string' ? title : undefined;

        return cloneElement(children, {
            ...(ariaLabel === undefined ? {} : { 'aria-label': ariaLabel }),
            onMouseEnter: (event: MouseEvent<HTMLElement>) => {
                activate();
                onMouseEnter?.(event);
            },
            onFocus: (event: FocusEvent<HTMLElement>) => {
                activate();
                onFocus?.(event);
            },
        });
    }, [children, active, title, activate]);

    if (isMobile) {
        return <TouchTooltip title={title}>{children}</TouchTooltip>;
    }

    return (
        <Tooltip title={active ? title : ''} arrow placement="top" enterDelay={ENTER_DELAY_MS} disableTouchListener>
            {child}
        </Tooltip>
    );
};

export const AccessibleTooltip: FC<Props> = ({ children, title }) => {
    if (isMobile) {
        return <TouchTooltip title={title}>{children}</TouchTooltip>;
    }

    return (
        <Tooltip placement="top" title={title} arrow enterDelay={ENTER_DELAY_MS}>
            {children}
        </Tooltip>
    );
};
