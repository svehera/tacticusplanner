import React from 'react';
import { Rarity } from 'src/models/enums';
import { getImageUrl } from 'src/shared-logic/functions';

export const ForgeBadgeImage = ({ rarity }: { rarity: Rarity }) => {
    const rarityString = Rarity[rarity];
    if (!rarityString) {
        return <span>Invalid rarity</span>;
    }
    const image = getImageUrl(`forgeBadges/${rarityString.toLowerCase()}.png`);

    return <img loading={'lazy'} style={{ pointerEvents: 'none' }} src={image} height={35} alt={rarityString} />;
};
