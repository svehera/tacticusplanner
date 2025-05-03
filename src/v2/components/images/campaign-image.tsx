import React from 'react';

import { getImageUrl } from 'src/shared-logic/functions';

import { AccessibleTooltip } from '@/fsd/5-shared/ui';

export const CampaignImage = ({ campaign, size = 50 }: { campaign: string; size?: number }) => {
    const image = getImageUrl(`campaings/resized/${campaign}.png`);

    return (
        <AccessibleTooltip title={campaign}>
            <span style={{ display: 'inline-block', height: size, width: size }}>
                <img style={{ pointerEvents: 'none' }} src={image} height={size} width={size} alt={campaign} />
            </span>
        </AccessibleTooltip>
    );
};
