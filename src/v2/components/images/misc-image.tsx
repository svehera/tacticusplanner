import React from 'react';
import { Tooltip } from '@mui/material';

import armourIcon from 'src/assets/images/icons/armour.webp';
import damageIcon from 'src/assets/images/icons/dmg.webp';
import healthIcon from 'src/assets/images/icons/health.webp';
import powerIcon from 'src/assets/images/icons/power.png';
import energyIcon from 'src/assets/images/icons/energy.png';

const icons = {
    armour: {
        file: armourIcon,
        label: 'Armour',
    },
    damage: {
        file: damageIcon,
        label: 'Damage',
    },
    health: {
        file: healthIcon,
        label: 'Health',
    },
    power: {
        file: powerIcon,
        label: 'Power',
    },
    energy: {
        file: energyIcon,
        label: 'Energy',
    },
};

export const MiscIcon = ({ icon, width, height }: { icon: keyof typeof icons; width?: number; height?: number }) => {
    const details = icons[icon] ?? { file: '', label: icon };
    return (
        <Tooltip title={details.label}>
            <span style={{ display: 'inline-block', width: width ?? 30, height }}>
                <img
                    style={{ pointerEvents: 'none' }}
                    src={details.file}
                    width={width ?? 30}
                    height={height}
                    alt={details.label}
                />
            </span>
        </Tooltip>
    );
};
