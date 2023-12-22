import { Tooltip } from '@fluentui/react-components';
import React from 'react';

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
};

export const MiscIcon = ({ icon, width, height }: { icon: keyof typeof icons; width?: number; height?: number }) => {
    const details = icons[icon] ?? { file: '', label: icon };
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const image = require(`../assets/images/icons/${details.file}`);

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
    } catch (error) {
        // console.log(`Image with name "${campaign}" does not exist`);
        return <span>{details.label}</span>;
    }
};
