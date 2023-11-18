import { Tooltip } from '@fluentui/react-components';
import React from 'react';

export const CampaignImage = ({ campaign, size }: { campaign: string; size?: number }) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const image = require(`../assets/images/campaings/${campaign}.jpg`);

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
