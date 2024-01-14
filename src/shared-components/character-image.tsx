import React from 'react';
import { getImageUrl } from '../shared-logic/functions';

export const CharacterImage = ({
    icon,
    name,
    imageSize,
    portrait,
}: {
    icon: string;
    name?: string;
    imageSize?: number;
    portrait?: boolean;
}) => {
    const iconPath = portrait ? 'portraits/webp' : 'characters';
    const replaceExtenstion = portrait ? icon.replace('.png', '.webp') : icon;
    const unset = portrait ? 'unset.webp' : 'unset.png';

    const imageUrl = getImageUrl(`../assets/images/${iconPath}/${replaceExtenstion}`);

    return portrait ? (
        <img
            loading={'lazy'}
            style={{ pointerEvents: 'none', contentVisibility: 'auto' }}
            src={imageUrl}
            width={60}
            alt={name ?? icon}
        />
    ) : (
        <img
            loading={'lazy'}
            style={{ pointerEvents: 'none', borderRadius: '50%' }}
            src={imageUrl}
            height={imageSize ?? 50}
            alt={name ?? icon}
        />
    );
};
