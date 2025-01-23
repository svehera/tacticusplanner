import React from 'react';
import { getImageUrl } from 'src/shared-logic/functions';

interface Props {
    icon: string;
}

export const CharacterPortraitImage = React.forwardRef<HTMLImageElement, Props>((props, ref) => {
    const imageUrl = getImageUrl(`portraits/resized/${props.icon}`);

    return (
        <img
            {...props}
            ref={ref}
            loading="lazy"
            style={{ pointerEvents: 'none' }}
            src={imageUrl}
            width={60}
            alt={props.icon}
        />
    );
});

CharacterPortraitImage.displayName = 'CharacterPortraitImage';
