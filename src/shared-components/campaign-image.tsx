import { Tooltip } from '@fluentui/react-components';
import React from 'react';
import { getImageUrl } from '../shared-logic/functions';

export const CampaignImage = ({ campaign, size }: { campaign: string; size?: number }) => {
    try {
        const image = getImageUrl(`../assets/images/campaings/${campaign}.png`);

        return (
            <Tooltip content={campaign} relationship="label" hideDelay={1000}>
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
