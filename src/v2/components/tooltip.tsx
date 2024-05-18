import React from 'react';
import { ClickAwayListener, Tooltip } from '@mui/material';
import { isMobile } from 'react-device-detect';

interface Props {
    title: React.ReactNode;
    children: React.ReactElement<any, any>;
}

export const AccessibleTooltip: React.FC<Props> = ({ children, title }) => {
    const [open, setOpen] = React.useState(false);

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
                    PopperProps={{
                        disablePortal: false,
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
