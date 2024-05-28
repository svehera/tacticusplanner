import React from 'react';
import { Alliance } from 'src/models/enums';
import { getImageUrl } from 'src/shared-logic/functions';

export const ComponentImage = ({ alliance, size = 'medium' }: { alliance: Alliance; size?: 'small' | 'medium' }) => {
    const sizePx = size === 'medium' ? 35 : 25;
    const image = getImageUrl(`mowComponents/${alliance.toLowerCase()}.png`);

    return <img loading={'lazy'} style={{ pointerEvents: 'none' }} src={image} height={sizePx} alt={alliance} />;
};
