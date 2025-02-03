import React from 'react';
import { Rarity } from 'src/models/enums';
import { getImageUrl } from 'src/shared-logic/functions';

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
