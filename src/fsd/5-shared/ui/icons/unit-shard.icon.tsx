import React from 'react';

import { getImageUrl } from '../get-image-url';
import { AccessibleTooltip } from '../tooltip';

export const UnitShardIcon = ({
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
    if (!icon) return null;
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
