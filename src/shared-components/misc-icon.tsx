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
};

export const MiscIcon = ({ icon }: { icon: keyof typeof icons }) => {
    const details = icons[icon];
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const image = require(`../assets/images/icons/${details.file}`);

        return (
            <Tooltip content={details.label} relationship="label" hideDelay={1000}>
                <span style={{ display: 'inline-block', width: 30 }}>
                    <img style={{ pointerEvents: 'none' }} src={image} width={30} alt={details.label} />
                </span>
            </Tooltip>
        );
    } catch (error) {
        // console.log(`Image with name "${campaign}" does not exist`);
        return <span>{details.label}</span>;
    }
};
