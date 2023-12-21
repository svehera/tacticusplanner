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
    const iconPath = portrait ? 'portraits' : 'characters';
    let image: any;
    try {
        // Import image on demand
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        image = require(`../assets/images/${iconPath}/${icon}`);
    } catch (error) {
        image = require(`../assets/images/${iconPath}/unset.png`);
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
            style={{ pointerEvents: 'none', contentVisibility: 'auto', borderRadius: '50%' }}
            src={image}
            height={imageSize ?? 50}
            alt={name ?? icon}
        />
    );
};
