import React from 'react';

import armourIcon from 'src/assets/images/icons/armour.webp';
import blackstoneIcon from 'src/assets/images/icons/blackstone.png';
import deploymentIcon from 'src/assets/images/icons/deployment.png';
import damageIcon from 'src/assets/images/icons/dmg.webp';
import energyIcon from 'src/assets/images/icons/energy.png';
import healthIcon from 'src/assets/images/icons/health.webp';
import hitsIcon from 'src/assets/images/icons/hits.webp';
import meleeIcon from 'src/assets/images/icons/melee.png';
import mowIcon from 'src/assets/images/icons/mow.png';
import powerIcon from 'src/assets/images/icons/power.png';
import rangedIcon from 'src/assets/images/icons/ranged.png';
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
    mow: {
        file: mowIcon,
        label: 'Machine of War',
    },
    melee: {
        file: meleeIcon,
        label: 'Melee',
    },
    ranged: {
        file: rangedIcon,
        label: 'Ranged',
    },
    hits: {
        file: hitsIcon,
        label: 'Hits',
    },
};

export const MiscIcon = ({
    icon,
    width = 30,
    height = 30,
}: {
    icon: keyof typeof icons;
    width?: number;
    height?: number;
}) => {
    const details = icons[icon] ?? { file: '', label: icon };
    return (
        <img
            style={{ pointerEvents: 'none', height, width }}
            src={details.file}
            width={width}
            height={height}
            alt={details.label}
        />
    );
};
