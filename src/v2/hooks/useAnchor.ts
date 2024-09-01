import { useState, MouseEvent, UIEvent } from 'react';

type AnchorElement = HTMLButtonElement | null;

export const useAnchor = () => {
    const [anchorEl, setAnchorEl] = useState<AnchorElement>(null);

    const handleClick = (event: MouseEvent<HTMLButtonElement> | UIEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    return { anchorEl, handleClick, handleClose, open };
};
