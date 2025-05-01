import React from 'react';

import { getImageUrl } from '../shared-logic/functions';

export const WhatsNewImage = ({ path, imageSize }: { path: string; imageSize?: number }) => {
    const image = getImageUrl(`whatsnew/${path}`);

    return <img src={image} height={imageSize} width={'100%'} alt={path} />;
};
