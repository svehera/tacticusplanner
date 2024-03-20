import React from 'react';
import { getImageUrl } from '../shared-logic/functions';

export const CharacterImage = ({ icon, name, imageSize }: { icon: string; name?: string; imageSize?: number }) => {
    const imageUrl = getImageUrl(`characters/${icon.replace('.webp', '.png')}`);

    return (
        <img
            loading={'lazy'}
            style={{ pointerEvents: 'none', borderRadius: '50%' }}
            src={imageUrl}
            height={imageSize ?? 50}
            alt={name ?? icon}
        />
    );
};
