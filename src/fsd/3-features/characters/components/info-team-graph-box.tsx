import InfoIcon from '@mui/icons-material/Info';
import { Popover, IconButton } from '@mui/material';
import React from 'react';

export const InfoTeamGraphBox = () => {
    const [anchorElement, setAnchorElement] = React.useState<HTMLButtonElement | null>(null);

    const handleClick = (event: React.UIEvent<HTMLButtonElement>) => {
        setAnchorElement(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorElement(null);
    };

    const open = Boolean(anchorElement);

    return (
        <>
            <IconButton onClick={handleClick}>
                <InfoIcon color={'primary'} fontSize={'large'} />
            </IconButton>

            <Popover
                open={open}
                anchorEl={anchorElement}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}>
                <div className="max-w-[500px] p-2.5">
                    <p className="font-medium">
                        This graph visualizes team power. Each vertical bar represent the power of a character with the
                        darker section contributed by attributes (armor, damage, and health) and the lighter section by
                        active and passive abilities. The horizontal lines are rough cutoffs between Common, Uncommon,
                        Rare, Epic, Legendary and Diamond power levels.
                    </p>
                </div>
            </Popover>
        </>
    );
};
