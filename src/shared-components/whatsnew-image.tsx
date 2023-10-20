import React from 'react';
import { ICharacter2 } from '../models/interfaces';

export const WhatsNewImage = ({ path, imageSize }: { path: string; imageSize?: number }) => {
    try {
        // Import image on demand
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const image = require(`../assets/images/whatsnew/${path}`);

        // If the image doesn't exist. return null
        if (!image) return null;
        return <img src={image} height={imageSize} width={'100%'} alt={path} />;
    } catch (error) {
        console.log(`Image with name "${path}" does not exist`);
        return null;
    }
};
