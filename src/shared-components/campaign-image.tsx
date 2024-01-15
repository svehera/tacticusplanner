import { Tooltip } from '@mui/material';
import React from 'react';
import { getImageUrl } from '../shared-logic/functions';

export const CampaignImage = ({ campaign, size }: { campaign: string; size?: number }) => {
    try {
        const image = getImageUrl(`campaings/${campaign}.png`);

        return (
            <Tooltip title={campaign} leaveDelay={1000}>
                <span style={{ display: 'inline-block', height: size ?? 50 }}>
                    <img style={{ pointerEvents: 'none' }} src={image} height={size ?? 50} alt={campaign} />
                </span>
            </Tooltip>
        );
    } catch (error) {
        // console.log(`Image with name "${campaign}" does not exist`);
        return <span>{campaign}</span>;
    }
};
