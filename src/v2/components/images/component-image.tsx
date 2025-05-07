import React from 'react';

import { getImageUrl } from 'src/shared-logic/functions';

import { Alliance } from '@/fsd/5-shared/model';

export const ComponentImage = ({ alliance, size = 'medium' }: { alliance: Alliance; size?: 'small' | 'medium' }) => {
    const sizePx = size === 'medium' ? 35 : 25;
    const image = getImageUrl(`mowComponents/resized/${alliance.toLowerCase()}.png`);

    return <img loading={'lazy'} style={{ pointerEvents: 'none' }} src={image} height={sizePx} alt={alliance} />;
};
