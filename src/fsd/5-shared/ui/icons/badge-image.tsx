/* eslint-disable import-x/no-internal-modules */
import chaosCommon from '@/assets/images/badges/resized/chaos-common.png';
import chaosEpic from '@/assets/images/badges/resized/chaos-epic.png';
import chaosLegendary from '@/assets/images/badges/resized/chaos-legendary.png';
import chaosMythic from '@/assets/images/badges/resized/chaos-mythic.png';
import chaosRare from '@/assets/images/badges/resized/chaos-rare.png';
import chaosUncommon from '@/assets/images/badges/resized/chaos-uncommon.png';
import imperialCommon from '@/assets/images/badges/resized/imperial-common.png';
import imperialEpic from '@/assets/images/badges/resized/imperial-epic.png';
import imperialLegendary from '@/assets/images/badges/resized/imperial-legendary.png';
import imperialMythic from '@/assets/images/badges/resized/imperial-mythic.png';
import imperialRare from '@/assets/images/badges/resized/imperial-rare.png';
import imperialUncommon from '@/assets/images/badges/resized/imperial-uncommon.png';
import xenosCommon from '@/assets/images/badges/resized/xenos-common.png';
import xenosEpic from '@/assets/images/badges/resized/xenos-epic.png';
import xenosLegendary from '@/assets/images/badges/resized/xenos-legendary.png';
import xenosMythic from '@/assets/images/badges/resized/xenos-mythic.png';
import xenosRare from '@/assets/images/badges/resized/xenos-rare.png';
import xenosUncommon from '@/assets/images/badges/resized/xenos-uncommon.png';
/* eslint-enable import-x/no-internal-modules */

import { Rarity, Alliance } from '@/fsd/5-shared/model';

const badgeImageMap = {
    [Alliance.Chaos]: {
        [Rarity.Common]: chaosCommon,
        [Rarity.Uncommon]: chaosUncommon,
        [Rarity.Rare]: chaosRare,
        [Rarity.Epic]: chaosEpic,
        [Rarity.Legendary]: chaosLegendary,
        [Rarity.Mythic]: chaosMythic,
    },
    [Alliance.Imperial]: {
        [Rarity.Common]: imperialCommon,
        [Rarity.Uncommon]: imperialUncommon,
        [Rarity.Rare]: imperialRare,
        [Rarity.Epic]: imperialEpic,
        [Rarity.Legendary]: imperialLegendary,
        [Rarity.Mythic]: imperialMythic,
    },
    [Alliance.Xenos]: {
        [Rarity.Common]: xenosCommon,
        [Rarity.Uncommon]: xenosUncommon,
        [Rarity.Rare]: xenosRare,
        [Rarity.Epic]: xenosEpic,
        [Rarity.Legendary]: xenosLegendary,
        [Rarity.Mythic]: xenosMythic,
    },
} as const;

export const BadgeImage = ({
    alliance,
    rarity,
    size = 'medium',
}: {
    alliance: Alliance;
    rarity: Rarity;
    size?: 'small' | 'medium';
}) => (
    <img
        loading={'lazy'}
        className="pointer-events-none"
        src={badgeImageMap[alliance][rarity]}
        height={size === 'medium' ? 35 : 25}
        alt={alliance}
    />
);
