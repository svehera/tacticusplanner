import React from 'react';

export const CharacterImage = ({ icon, name, imageSize }: { icon: string; name?: string; imageSize?: number }) => {
    try {
        // Import image on demand
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const image = require(`../assets/images/characters/${icon}`);

        // If the image doesn't exist. return null
        if (!image) return <span>{name}</span>;
        return (
            <img
                loading={'lazy'}
                style={{ pointerEvents: 'none', contentVisibility: 'auto', borderRadius: '50%' }}
                src={image}
                height={imageSize ?? 50}
                alt={name ?? icon}
            />
        );
    } catch (error) {
        // console.log(`Image with name "${icon}" does not exist`);
        return <span>{name}</span>;
    }
};
