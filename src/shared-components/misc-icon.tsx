import { Tooltip } from '@fluentui/react-components';
import React from 'react';
import { getImageUrl } from '../shared-logic/functions';

const icons = {
    armour: {
        file: 'armour.webp',
        label: 'Armour',
    },
    damage: {
        file: 'dmg.webp',
        label: 'Damage',
    },
    health: {
        file: 'health.webp',
        label: 'Health',
    },
    power: {
        file: 'power.png',
        label: 'Power',
    },
    energy: {
        file: 'energy.png',
        label: 'Energy',
    },
};

export const MiscIcon = ({ icon, width, height }: { icon: keyof typeof icons; width?: number; height?: number }) => {
    const details = icons[icon] ?? { file: '', label: icon };
    const image = getImageUrl(`../assets/images/icons/${details.file}`);

    return (
        <Tooltip content={details.label} relationship="label" hideDelay={1000}>
            <span style={{ display: 'inline-block', width: width ?? 30, height }}>
                <img
                    style={{ pointerEvents: 'none' }}
                    src={image}
                    width={width ?? 30}
                    height={height}
                    alt={details.label}
                />
            </span>
        </Tooltip>
    );
};
