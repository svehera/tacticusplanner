import React from 'react';

import { Rarity } from '@/fsd/5-shared/model';

import { getImageUrl } from '../get-image-url';

export const RarityIcon = ({ rarity }: { rarity: Rarity }) => {
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
