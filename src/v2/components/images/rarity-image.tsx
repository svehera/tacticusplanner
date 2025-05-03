import React from 'react';

import { getImageUrl } from 'src/shared-logic/functions';

import { Rarity } from '@/fsd/5-shared/model';

export const RarityImage = ({ rarity }: { rarity: Rarity }) => {
    const rarityString = Rarity[rarity];
    if (!rarityString) {
        return <span>Invalid rarity</span>;
    }
    const image = getImageUrl(`rarity/resized/${rarityString.toLowerCase()}.png`);

    return (
        <img
            loading={'lazy'}
            style={{ pointerEvents: 'none', maxWidth: 25, maxHeight: 25, width: 'auto', height: 'auto' }}
            src={image}
            alt={rarityString}
        />
    );
};
