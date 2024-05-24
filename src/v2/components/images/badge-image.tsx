import React from 'react';
import { Alliance, Rarity } from 'src/models/enums';
import { getImageUrl } from 'src/shared-logic/functions';

export const BadgeImage = ({ alliance, rarity }: { alliance: Alliance; rarity: Rarity }) => {
    const rarityString = Rarity[rarity];
    if (!rarityString) {
        return <span>Invalid rarity</span>;
    }
    const image = getImageUrl(`badges/${alliance.toLowerCase()}-${rarityString.toLowerCase()}.png`);

    return <img loading={'lazy'} style={{ pointerEvents: 'none' }} src={image} height={35} alt={alliance} />;
};
