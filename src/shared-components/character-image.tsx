import React from 'react';
import { ICharacter2 } from '../models/interfaces';

export const CharacterImage = ({ icon, name, imageSize }: { icon: string; name?: string; imageSize?: number }) => {
    try {
        // Import image on demand
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const image = require(`../assets/images/characters/${icon}`);

        // If the image doesn't exist. return null
        if (!image) return null;
        return <img style={{ pointerEvents: 'none' }} src={image} height={imageSize ?? 50} alt={name ?? icon} />;
    } catch (error) {
        console.log(`Image with name "${icon}" does not exist`);
        return null;
    }
};
