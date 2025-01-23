import React from 'react';
import { AccessibleTooltip } from 'src/v2/components/tooltip';
import { getImageUrl } from 'src/shared-logic/functions';

export const CampaignImage = ({ campaign, size }: { campaign: string; size?: number }) => {
    const image = getImageUrl(`campaings/resized/${campaign}.png`);

    return (
        <AccessibleTooltip title={campaign}>
            <span style={{ display: 'inline-block', height: size ?? 50 }}>
                <img style={{ pointerEvents: 'none' }} src={image} height={size ?? 50} alt={campaign} />
            </span>
        </AccessibleTooltip>
    );
};
