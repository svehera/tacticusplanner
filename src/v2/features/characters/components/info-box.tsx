﻿import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import { Popover, IconButton } from '@mui/material';
import React from 'react';

import wyoInfo from 'src/assets/images/wyo_info.png';

import { MiscIcon } from '@/fsd/5-shared/ui/icons';

export const InfoBox = () => {
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
                        <WarningIcon color={'warning'} fontSize={'medium'} /> Disclaimer: <br />
                        <MiscIcon icon={'blackstone'} height={20} width={15} /> represents blackstone cost
                        <br />
                        <MiscIcon icon={'power'} height={20} width={15} /> does not represent in-game power but rather
                        character&apos;s potential.
                        <br />
                        40k is ultimate power and is a maximum for each character when character has Diamond III rank,
                        Blue star and both abilities at level 50
                    </p>
                    <img src={wyoInfo} width={500} />
                </div>
            </Popover>
        </>
    );
};
