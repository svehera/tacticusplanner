import React from 'react';
import { ICharacter2 } from '../models/interfaces';

export const CharacterImage = ({ character, imageSize }: { character: ICharacter2; imageSize?: number }) => {
    try {
        // Import image on demand
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const image = require(`../assets/images/characters/${character.icon}`);

        // If the image doesn't exist. return null
        if (!image) return null;
        return <img style={{ pointerEvents: 'none' }} src={image} height={imageSize ?? 50} alt={character.name} />;
    } catch (error) {
        console.log(`Image with name "${character.icon}" does not exist`);
        return null;
    }
};
