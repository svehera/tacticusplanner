import React from 'react';

import { getImageUrl } from 'src/shared-logic/functions';

import { tacticusIcons } from '@/fsd/5-shared/ui/icons/icon-list';

interface Properties {
    icon: string;
    frameIcon?: keyof typeof tacticusIcons;
}

export const CharacterPortraitImage = React.forwardRef<HTMLImageElement, Properties>((properties, reference) => {
    const imagePath = properties.icon.includes('snowprint_assets/')
        ? properties.icon // Use full snowprint path as-is
        : properties.icon; // Prepend portraits/resized/ for simple filenames
    const frame = tacticusIcons[properties.frameIcon ?? '']?.file || '';

    const imageUrl = getImageUrl(imagePath);

    // We need a div to stack the images, but the ref is for an HTMLImageElement.
    // We'll pass the ref to the character image and other props to the container.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { icon, frameIcon, ...rest } = properties;

    if (frame.length === 0) {
        return (
            <img
                {...rest}
                ref={reference}
                loading="lazy"
                className="pointer-events-none"
                src={imageUrl}
                width={60}
                height={80}
                alt={properties.icon}
                onError={e => {
                    console.error('❌ Failed to load image:', {
                        icon: properties.icon,
                        imagePath: imagePath,
                        resolvedUrl: imageUrl,
                        error: e,
                    });
                }}
                onLoad={() => {}}
            />
        );
    }

    return (
        <div {...rest} style={{ position: 'relative', width: 64, height: 84 }}>
            <img
                ref={reference}
                loading="lazy"
                className="pointer-events-none"
                src={imageUrl}
                width={60}
                height={80}
                alt={properties.icon}
                style={{ position: 'absolute', top: 2, left: 2 }}
                onError={e => {
                    console.error('❌ Failed to load image:', {
                        icon: properties.icon,
                        imagePath: imagePath,
                        resolvedUrl: imageUrl,
                        error: e,
                    });
                }}
                onLoad={() => {}}
            />
            <img
                loading="lazy"
                className="pointer-events-none"
                src={frame}
                width={64}
                height={84}
                alt="frame"
                style={{ position: 'absolute', zIndex: 1 }}
            />
        </div>
    );
});

CharacterPortraitImage.displayName = 'CharacterPortraitImage';
