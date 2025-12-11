import InfoIcon from '@mui/icons-material/Info';
import { Popover, IconButton } from '@mui/material';
import React from 'react';

export const InfoTeamGraphBox = () => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

    const handleClick = (event: React.UIEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    return (
        <>
            <IconButton onClick={handleClick}>
                <InfoIcon color={'primary'} fontSize={'large'} />
            </IconButton>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}>
                <div className="p-2.5 max-w-[500px]">
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
