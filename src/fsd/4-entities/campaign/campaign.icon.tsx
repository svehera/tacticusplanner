import React from 'react';

import { AccessibleTooltip, getImageUrl } from '@/fsd/5-shared/ui';

export const CampaignImage = ({ campaign, size = 50 }: { campaign: string; size?: number }) => {
    console.log(campaign);
    const image = getImageUrl(`campaigns/resized/${campaign}.png`);

    return (
        <AccessibleTooltip title={campaign}>
            <span style={{ display: 'inline-block', height: size, minWidth: size }}>
                <img style={{ pointerEvents: 'none' }} src={image} height={size} alt={campaign} />
            </span>
        </AccessibleTooltip>
    );
};
