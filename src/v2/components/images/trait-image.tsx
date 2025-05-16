import React from 'react';

import { getImageUrl } from 'src/shared-logic/functions';

import { Trait, TraitString } from '@/fsd/4-entities/character/trait.enum';

export const TraitImage = ({ trait, width, height }: { trait: Trait; width: number; height: number }) => {
    const traitString = TraitString[trait];
    if (!traitString) {
        return <span>Invalid trait</span>;
    }
    const image = getImageUrl(`traits/resized/${traitString.toLowerCase()}.png`);

    return (
        <img
            loading={'lazy'}
            style={{
                pointerEvents: 'none',
                maxWidth: width || 25,
                maxHeight: height || 25,
                width: 'auto',
                height: 'auto',
            }}
            src={image}
            alt={traitString}
        />
    );
};
