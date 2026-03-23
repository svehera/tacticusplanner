import React from 'react';

export const usePopUpControls = () => {
    const [anchorElement, setAnchorElement] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorElement);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorElement(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorElement(null);
    };

    return { anchorEl: anchorElement, open, handleClick, handleClose };
};
