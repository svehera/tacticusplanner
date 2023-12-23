import { Tooltip } from '@fluentui/react-components';
import React from 'react';

export const FactionImage = ({ faction, size }: { faction: string; size?: number }) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const image = require(`../assets/images/factions/${faction}.png`);

        return (
            <Tooltip content={faction} relationship="label" hideDelay={1000}>
                <span style={{ display: 'inline-block', height: size ?? 50 }}>
                    <img style={{ pointerEvents: 'none' }} src={image} height={size ?? 50} alt={faction} />
                </span>
            </Tooltip>
        );
    } catch (error) {
        // console.log(`Image with name "${faction}" does not exist`);
        return <span>{faction}</span>;
    }
};
