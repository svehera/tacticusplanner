import React from 'react';
import { Alliance } from 'src/models/enums';
import { getImageUrl } from 'src/shared-logic/functions';

export const ComponentImage = ({ alliance }: { alliance: Alliance }) => {
    const image = getImageUrl(`components/${alliance.toLowerCase()}.png`);

    return <img loading={'lazy'} style={{ pointerEvents: 'none' }} src={image} height={35} alt={alliance} />;
};
