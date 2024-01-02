import React from 'react';

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
    let image: any;
    try {
        // Import image on demand
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        image = require(`../assets/images/${iconPath}/${replaceExtenstion}`);
    } catch (error) {
        image = require(`../assets/images/${iconPath}/${unset}`);
    }

    return portrait ? (
        <img
            loading={'lazy'}
            style={{ pointerEvents: 'none', contentVisibility: 'auto' }}
            src={image}
            width={60}
            alt={name ?? icon}
        />
    ) : (
        <img
            loading={'lazy'}
            style={{ pointerEvents: 'none', borderRadius: '50%' }}
            src={image}
            height={imageSize ?? 50}
            alt={name ?? icon}
        />
    );
};
