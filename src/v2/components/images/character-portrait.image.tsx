import React from 'react';
import { getImageUrl } from 'src/shared-logic/functions';

export const CharacterPortraitImage = ({ icon }: { icon: string }) => {
    const imageUrl = getImageUrl(`portraits/webp/${icon.replace('.png', '.webp')}`);

    return <img loading={'lazy'} style={{ pointerEvents: 'none' }} src={imageUrl} width={60} alt={icon} />;
};
