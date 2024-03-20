import React from 'react';
import { getImageUrl } from 'src/shared-logic/functions';

export const CharacterPortraitImage = ({ icon }: { icon: string }) => {
    const imageUrl = getImageUrl(`portraits/${icon}`);

    return <img loading={'lazy'} style={{ pointerEvents: 'none' }} src={imageUrl} width={60} alt={icon} />;
};
