import React from 'react';

export const usePopUpControls = () => {
    const [anchorElement, setAnchorElement] = React.useState<HTMLElement>();
    const open = Boolean(anchorElement);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorElement(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorElement(undefined);
    };

    return { anchorEl: anchorElement, open, handleClick, handleClose };
};
