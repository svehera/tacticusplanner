import { ClickAwayListener, Tooltip } from '@mui/material';
import { FC, HTMLAttributes, MouseEvent, ReactElement, ReactNode, cloneElement, useState } from 'react';
import { isMobile } from 'react-device-detect';

interface Props {
    title: ReactNode;
    children: ReactElement;
}

// Keeps a stable Tooltip wrapper so children are never remounted on first hover.
// The title is withheld until first hover to avoid showing stale/empty tooltips.
export const LazyTooltip: FC<{ title: ReactNode; children: ReactElement<HTMLAttributes<HTMLElement>> }> = ({
    title,
    children,
}) => {
    const [active, setActive] = useState(false);

    return (
        <Tooltip title={active ? title : ''} arrow placement="top" disableTouchListener>
            {cloneElement(children, {
                onMouseEnter: (event: MouseEvent<HTMLElement>) => {
                    if (!active) setActive(true);
                    children.props.onMouseEnter?.(event);
                },
            })}
        </Tooltip>
    );
};

export const AccessibleTooltip: FC<Props> = ({ children, title }) => {
    const [open, setOpen] = useState(false);

    const handleTooltipClose = () => {
        setOpen(false);
    };

    const handleTooltipToggle = () => {
        setOpen(value => !value);
    };
    if (isMobile) {
        return (
            <ClickAwayListener onClickAway={handleTooltipClose} mouseEvent={'onMouseUp'}>
                <Tooltip
                    slotProps={{
                        popper: { disablePortal: false },
                    }}
                    placement="top"
                    arrow
                    onClose={handleTooltipClose}
                    open={open}
                    disableFocusListener
                    disableHoverListener
                    disableTouchListener
                    onClick={handleTooltipToggle}
                    title={title}>
                    {children}
                </Tooltip>
            </ClickAwayListener>
        );
    }
    return (
        <Tooltip placement="top" title={title} arrow enterDelay={700}>
            {children}
        </Tooltip>
    );
};
