/* eslint-disable import-x/no-internal-modules */
import epicBadge from '@/assets/images/forgeBadges/resized/epic.png';
import legendaryBadge from '@/assets/images/forgeBadges/resized/legendary.png';
import mythicBadge from '@/assets/images/forgeBadges/resized/mythic.png';
import rareBadge from '@/assets/images/forgeBadges/resized/rare.png';
import uncommonBadge from '@/assets/images/forgeBadges/resized/uncommon.png';
/* eslint-enable import-x/no-internal-modules */

import { Rarity } from '@/fsd/5-shared/model';

const forgeRarityMap = {
    [Rarity.Uncommon]: uncommonBadge,
    [Rarity.Rare]: rareBadge,
    [Rarity.Epic]: epicBadge,
    [Rarity.Legendary]: legendaryBadge,
    [Rarity.Mythic]: mythicBadge,
} as const;

type BadgeRarity = keyof typeof forgeRarityMap;
const isValidBadgeRarity = (rarity: Rarity): rarity is BadgeRarity => rarity in forgeRarityMap;

export const ForgeBadgeImage = ({ rarity, size = 'medium' }: { rarity: Rarity; size?: 'small' | 'medium' }) => {
    if (!isValidBadgeRarity(rarity)) return <span>Invalid rarity</span>;
    const sizePx = size === 'medium' ? 35 : 25;
    const rarityString = Rarity[rarity];
    const imageUrl = forgeRarityMap[rarity];
    return <img loading={'lazy'} className="pointer-events-none" src={imageUrl} height={sizePx} alt={rarityString} />;
};
