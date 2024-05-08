import React from 'react';
import { getImageUrl } from '../shared-logic/functions';
import { AccessibleTooltip } from 'src/v2/components/tooltip';

export const CharacterImage = ({
    icon,
    name,
    imageSize,
    tooltip,
}: {
    icon: string;
    name?: string;
    tooltip?: string;
    imageSize?: number;
}) => {
    const imageUrl = getImageUrl(`characters/${icon.replace('.webp', '.png')}`);

    const image = (
        <img
            loading={'lazy'}
            style={{ pointerEvents: 'none', borderRadius: '50%' }}
            src={imageUrl}
            height={imageSize ?? 50}
            alt={name ?? icon}
        />
    );

    return tooltip ? <AccessibleTooltip title={tooltip}>{image}</AccessibleTooltip> : image;
};
