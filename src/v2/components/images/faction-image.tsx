import React from 'react';

import { getImageUrl } from 'src/shared-logic/functions';

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
