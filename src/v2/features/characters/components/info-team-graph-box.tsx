import React from 'react';
import { Popover, IconButton } from '@mui/material';

import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';

import { MiscIcon } from 'src/v2/components/images/misc-image';

import wyoInfo from 'src/assets/images/wyo_info.png';

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
                <div style={{ padding: 10, maxWidth: 500 }}>
                    <p style={{ fontWeight: 500 }}>
                        This graph visualizes team power. The darker section is power contributed by attributes (armor,
                        damage, and health), the lighter section by active and passive abilities. The marked power
                        levels are rough cutoffs between Common, Uncommon, Rare, Epic, Legendary and Diamond power
                        levels.
                    </p>
                </div>
            </Popover>
        </>
    );
};
