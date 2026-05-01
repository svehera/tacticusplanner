import { ClickAwayListener, Tooltip } from '@mui/material';
import { FC, HTMLAttributes, MouseEvent, ReactElement, ReactNode, cloneElement, useState } from 'react';
import { isMobile } from 'react-device-detect';

interface Props {
    title: ReactNode;
    children: ReactElement;
}

// Mounts zero Tooltip instances on render — activates only on first hover per element.
export const LazyTooltip: FC<{ title: ReactNode; children: ReactElement<HTMLAttributes<HTMLElement>> }> = ({
    title,
    children,
}) => {
    const [active, setActive] = useState(false);

    if (!active) {
        return cloneElement(children, {
            onMouseEnter: (event: MouseEvent<HTMLElement>) => {
                setActive(true);
                children.props.onMouseEnter?.(event);
            },
        });
    }

    return (
        <Tooltip title={title} arrow placement="top" disableTouchListener>
            {children}
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
