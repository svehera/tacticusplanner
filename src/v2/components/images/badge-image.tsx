import React from 'react';

import { getImageUrl } from 'src/shared-logic/functions';

import { Rarity, Alliance } from '@/fsd/5-shared/model';

export const BadgeImage = ({
    alliance,
    rarity,
    size = 'medium',
}: {
    alliance: Alliance;
    rarity: Rarity;
    size?: 'small' | 'medium';
}) => {
    const sizePx = size === 'medium' ? 35 : 25;
    const rarityString = Rarity[rarity];
    if (!rarityString) {
        return <span>Invalid rarity</span>;
    }
    const image = getImageUrl(`badges/resized/${alliance.toLowerCase()}-${rarityString.toLowerCase()}.png`);

    return <img loading={'lazy'} style={{ pointerEvents: 'none' }} src={image} height={sizePx} alt={alliance} />;
};
