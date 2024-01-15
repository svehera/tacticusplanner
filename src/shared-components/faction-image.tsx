import { Tooltip } from '@mui/material';
import React from 'react';
import { getImageUrl } from '../shared-logic/functions';

export const FactionImage = ({ faction, size }: { faction: string; size?: number }) => {
    const image = getImageUrl(`factions/${faction}.png`);

    return (
        <Tooltip title={faction} leaveDelay={1000}>
            <span style={{ display: 'inline-block', height: size ?? 50 }}>
                <img style={{ pointerEvents: 'none' }} src={image} height={size ?? 50} alt={faction} />
            </span>
        </Tooltip>
    );
};
