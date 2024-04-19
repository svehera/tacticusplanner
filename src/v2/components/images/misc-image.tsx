import React from 'react';

import armourIcon from 'src/assets/images/icons/armour.webp';
import damageIcon from 'src/assets/images/icons/dmg.webp';
import healthIcon from 'src/assets/images/icons/health.webp';
import powerIcon from 'src/assets/images/icons/power.png';
import energyIcon from 'src/assets/images/icons/energy.png';
import blackstoneIcon from 'src/assets/images/icons/blackstone.png';
import deploymentIcon from 'src/assets/images/icons/deployment.png';
import warTokenIcon from 'src/assets/images/icons/warToken.png';

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
    blackstone: {
        file: blackstoneIcon,
        label: 'Blackstone',
    },
    deployment: {
        file: deploymentIcon,
        label: '',
    },
    warToken: {
        file: warTokenIcon,
        label: 'War Token',
    },
};

export const MiscIcon = ({ icon, width, height }: { icon: keyof typeof icons; width?: number; height?: number }) => {
    const details = icons[icon] ?? { file: '', label: icon };
    return (
        <span style={{ display: 'inline-block', width: width ?? 30, height }}>
            <img
                style={{ pointerEvents: 'none' }}
                src={details.file}
                width={width ?? 30}
                height={height}
                alt={details.label}
            />
        </span>
    );
};
