import React from 'react';

import { getImageUrl } from '@/fsd/5-shared/ui';

export const FactionImage = ({ faction }: { faction: string }) => {
    const imageUrl = getImageUrl(`factions/${faction}.png`);

    return (
        <img
            loading={'lazy'}
            style={{ pointerEvents: 'none', contentVisibility: 'auto' }}
            src={imageUrl}
            width={25}
            alt={faction}
        />
    );
};
