import { useContext } from 'react';

import { Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';

import { AssetContext } from './roster-snapshots-assets-context';

export const useRosterSnapshotAssets = (
    isChar: boolean,
    rarity: Rarity,
    rank: Rank | undefined,
    rarityStars: RarityStars
) => {
    const assets = useContext(AssetContext);
    if (!assets) throw new Error('useRosterSnapshotAssets must be used within RosterAssetsProvider');

    // Logic to select the specific assets for this unit
    const frame = isChar ? assets.charFrames[rarity] : assets.mowFrames[rarity];
    const rankIcon = assets.ranks[rank ? rank - 1 : 0];

    // Example logic for stars (e.g., Legendary stars are red, others yellow)
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
