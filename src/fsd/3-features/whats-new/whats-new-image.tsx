import React from 'react';

import { getImageUrl } from 'src/fsd/5-shared/ui';

export const WhatsNewImage = ({ path, imageSize }: { path: string; imageSize?: number }) => {
    const image = getImageUrl(`whatsnew/${path}`);

    return <img src={image} height={imageSize} width={'100%'} alt={path} />;
};
