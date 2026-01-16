/* eslint-disable import-x/no-internal-modules */
import common from '@/assets/images/rarity/resized/common.png';
import epic from '@/assets/images/rarity/resized/epic.png';
import legendary from '@/assets/images/rarity/resized/legendary.png';
import mythic from '@/assets/images/rarity/resized/mythic.png';
import rare from '@/assets/images/rarity/resized/rare.png';
import uncommon from '@/assets/images/rarity/resized/uncommon.png';
/* eslint-enable import-x/no-internal-modules */

import { Rarity } from '@/fsd/5-shared/model';

const rarityMap = {
    [Rarity.Common]: common,
    [Rarity.Uncommon]: uncommon,
    [Rarity.Rare]: rare,
    [Rarity.Epic]: epic,
    [Rarity.Legendary]: legendary,
    [Rarity.Mythic]: mythic,
} as const;

export const RarityIcon = ({ rarity }: { rarity: Rarity }) => {
    const rarityString = Rarity[rarity];
    if (!rarityString) {
        return <span>Invalid rarity</span>;
    }

    return (
        <img
            loading={'lazy'}
            className="pointer-events-none max-w-[25px] max-h-[25px] w-auto h-auto"
            src={rarityMap[rarity]}
            alt={rarityString}
        />
    );
};
