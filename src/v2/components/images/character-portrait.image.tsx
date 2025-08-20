import React from 'react';

import { getImageUrl } from 'src/shared-logic/functions';

interface Props {
    icon: string;
}

export const CharacterPortraitImage = React.forwardRef<HTMLImageElement, Props>((props, ref) => {
    // Determine the correct path based on whether it's a snowprint asset or a simple filename
    const imagePath = props.icon.includes('snowprint_assets/')
        ? props.icon // Use full snowprint path as-is
        : props.icon; // Prepend portraits/resized/ for simple filenames

    const imageUrl = getImageUrl(imagePath);

    return (
        <img
            {...props}
            ref={ref}
            loading="lazy"
            style={{ pointerEvents: 'none' }}
            src={imageUrl}
            width={60}
            height={80}
            alt={props.icon}
            onError={e => {
                console.error('❌ Failed to load image:', {
                    icon: props.icon,
                    imagePath: imagePath,
                    resolvedUrl: imageUrl,
                    error: e,
                });
            }}
            onLoad={() => {}}
        />
    );
});

CharacterPortraitImage.displayName = 'CharacterPortraitImage';
