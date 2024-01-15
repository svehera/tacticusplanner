import { Tooltip } from '@fluentui/react-components';
import React from 'react';
import { getImageUrl } from '../shared-logic/functions';

export const FactionImage = ({ faction, size }: { faction: string; size?: number }) => {
    const image = getImageUrl(`factions/${faction}.png`);

    return (
        <Tooltip content={faction} relationship="label" hideDelay={1000}>
            <span style={{ display: 'inline-block', height: size ?? 50 }}>
                <img style={{ pointerEvents: 'none' }} src={image} height={size ?? 50} alt={faction} />
            </span>
        </Tooltip>
    );
};
