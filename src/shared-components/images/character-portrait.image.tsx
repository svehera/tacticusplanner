import React from 'react';

import { mapSnowprintAssets } from '@/fsd/5-shared/lib';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/iconList';

const portraitAssets = import.meta.glob('/src/assets/images/snowprint_assets/characters/ui_image_portrait_*.png', {
    eager: true,
    import: 'default',
});
const portraitMap = mapSnowprintAssets(portraitAssets); // Run at module load time so that the build breaks if the glob is wrong.

interface Props {
    icon: string;
    frameIcon?: keyof typeof tacticusIcons;
}

export const CharacterPortraitImage = React.forwardRef<HTMLImageElement, Props>((props, ref) => {
    const imagePath = props.icon.includes('snowprint_assets/')
        ? props.icon // Use full snowprint path as-is
        : props.icon; // Prepend portraits/resized/ for simple filenames
    const frame = tacticusIcons[props.frameIcon ?? '']?.file || '';

    const imageUrl = portraitMap[props.icon];
    // We need a div to stack the images, but the ref is for an HTMLImageElement.
    // We'll pass the ref to the character image and other props to the container.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { icon, frameIcon, ...rest } = props;

    if (frame.length === 0) {
        return (
            <img
                {...rest}
                ref={ref}
                loading="lazy"
                className="pointer-events-none"
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
    }

    return (
        <div {...rest} style={{ position: 'relative', width: 64, height: 84 }}>
            <img
                ref={ref}
                loading="lazy"
                className="pointer-events-none"
                src={imageUrl}
                width={60}
                height={80}
                alt={props.icon}
                style={{ position: 'absolute', top: 2, left: 2 }}
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
