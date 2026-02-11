import { Rarity } from '@/fsd/5-shared/model';

import { getImageUrl } from '../get-image-url';

export const RarityIcon = ({ rarity }: { rarity: Rarity }) => {
    const rarityString = Rarity[rarity];
    if (!rarityString) {
        return <span>Invalid rarity</span>;
    }
    const image = getImageUrl(`rarity/resized/${rarityString.toLowerCase()}.png`);

    return (
        <img
            loading={'lazy'}
            className="pointer-events-none h-auto max-h-[25px] w-auto max-w-[25px]"
            src={image}
            alt={rarityString}
        />
    );
};
