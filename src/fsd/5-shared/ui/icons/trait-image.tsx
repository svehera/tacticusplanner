import { getTraitStringFromLabel, Trait } from '@/fsd/5-shared/model';

import { getImageUrl } from '../get-image-url';

export const TraitImage = ({ trait, width, height }: { trait: Trait; width: number; height: number }) => {
    const traitString = getTraitStringFromLabel(trait);
    if (!traitString) {
        return <span>Invalid trait</span>;
    }
    const image = getImageUrl(`traits/resized/${traitString.toLowerCase()}.png`);

    return (
        <img
            loading={'lazy'}
            className="pointer-events-none h-auto w-auto"
            style={{ maxWidth: width || 25, maxHeight: height || 25 }}
            src={image}
            alt={traitString}
        />
    );
};
