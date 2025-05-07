import React from 'react';

import { getImageUrl } from 'src/shared-logic/functions';

import { Rarity } from '@/fsd/5-shared/model';

export const ForgeBadgeImage = ({ rarity, size = 'medium' }: { rarity: Rarity; size?: 'small' | 'medium' }) => {
    const sizePx = size === 'medium' ? 35 : 25;
    const rarityString = Rarity[rarity];
    if (!rarityString) {
        return <span>Invalid rarity</span>;
    }
    const image = getImageUrl(`forgeBadges/resized/${rarityString.toLowerCase()}.png`);

    return <img loading={'lazy'} style={{ pointerEvents: 'none' }} src={image} height={sizePx} alt={rarityString} />;
};
