import { useContext } from 'react';

import { Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';

import { UnitPortraitAssetContext } from './unit-portrait-assets-context';

export const useUnitPortraitAssets = (
    isChar: boolean,
    rarity: Rarity,
    rank: Rank | undefined,
    rarityStars: RarityStars
) => {
    const assets = useContext(UnitPortraitAssetContext);
    if (!assets) throw new Error('useUnitPortraitAssets must be used within UnitPortraitAssetsProvider');

    const frame = isChar ? assets.charFrames[rarity] : assets.mowFrames[rarity];
    const rankIcon = assets.ranks[rank ? rank - 1 : 0];

    const starIcon =
        rarityStars <= RarityStars.FiveStars
            ? assets.stars[0]
            : rarityStars <= RarityStars.RedFiveStars
              ? assets.stars[1]
              : rarityStars < RarityStars.MythicWings
                ? assets.stars[2]
                : assets.stars[3];

    return {
        frame,
        rankIcon,
        starIcon,
        shardIcon: assets.shardIcon,
        mythicShardIcon: assets.mythicShardIcon,
    };
};
