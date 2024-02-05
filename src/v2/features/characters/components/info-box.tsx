import React from 'react';
import { Popover, IconButton } from '@mui/material';

import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';

import { MiscIcon } from 'src/v2/components/images/misc-image';

import wyoInfo from 'src/assets/images/wyo_info.png';

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
                        <WarningIcon color={'warning'} fontSize={'medium'} /> Disclaimer:{' '}
                        {/* eslint-disable-next-line react/no-unescaped-entities */}
                        <MiscIcon icon={'power'} height={20} width={15} /> doesn't represent in-game power
                        <br />
                        <span style={{ fontSize: 10 }}>
                            Power = dirtyDozenCoeff * (statsWeight * statsScore + abilityWeight *
                            (activeAbilityLevelCoeff + passiveAbilityLevelCoeff)))
                        </span>
                    </p>
                    <img src={wyoInfo} width={500} />
                </div>
            </Popover>
        </>
    );
};
