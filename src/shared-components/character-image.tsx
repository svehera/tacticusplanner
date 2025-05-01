import React from 'react';

import { AccessibleTooltip } from 'src/v2/components/tooltip';

import { getImageUrl } from '../shared-logic/functions';

export const CharacterImage = ({
    icon,
    name,
    height,
    width,
    tooltip,
}: {
    icon: string;
    name?: string;
    tooltip?: string;
    height?: number;
    width?: number;
}) => {
    const imageUrl = getImageUrl(`characters/resized/${icon.replace('.webp', '.png')}`);

    const image = (
        <img
            loading={'lazy'}
            style={{ pointerEvents: 'none', borderRadius: '50%', maxWidth: width ?? 50, maxHeight: height ?? 50 }}
            src={imageUrl}
            alt={name ?? icon}
        />
    );

    return tooltip ? <AccessibleTooltip title={tooltip}>{image}</AccessibleTooltip> : image;
};
