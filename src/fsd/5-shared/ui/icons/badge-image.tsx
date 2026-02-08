import { Rarity, Alliance, RarityString } from '@/fsd/5-shared/model';

import { getImageUrl } from '../get-image-url';

export const BadgeImage = ({
    alliance,
    rarity,
    size = 'medium',
}: {
    alliance: Alliance;
    rarity: Rarity | RarityString;
    size?: 'small' | 'medium';
}) => {
    const sizePx = size === 'medium' ? 35 : 25;
    const rarityString = typeof rarity === 'string' ? rarity : Rarity[rarity];
    if (!rarityString) {
        return <span>Invalid rarity</span>;
    }
    const image = getImageUrl(`badges/resized/${alliance.toLowerCase()}-${rarityString.toLowerCase()}.png`);

    return <img loading={'lazy'} className="pointer-events-none" src={image} height={sizePx} alt={alliance} />;
};
