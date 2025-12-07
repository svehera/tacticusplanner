import { Rarity } from '@/fsd/5-shared/model';

import { IUnit } from '@/fsd/4-entities/unit';
import { getTotalProgressionUntil, getNextRarity, getMinimumStarsForRarity } from '@/models/constants';

export const canAscendCharacter = (unit: IUnit) => {
    const isAlreadyMythic = unit.rarity === Rarity.Mythic;

    if (isAlreadyMythic) return false;

    const totalShardsCurrent = getTotalProgressionUntil(unit.rarity, unit.stars);
    const nextRarity = getNextRarity(unit.rarity);
    const totalShardsForNextRarity = getTotalProgressionUntil(nextRarity, getMinimumStarsForRarity(nextRarity));
    const neededShards = (totalShardsForNextRarity.shards ?? 0) - (totalShardsCurrent.shards ?? 0);
    const neededMythicShards = (totalShardsForNextRarity.mythicShards ?? 0) - (totalShardsCurrent.mythicShards ?? 0);

    if (unit.rarity === Rarity.Legendary) {
        return neededShards - unit.shards <= 0 && neededMythicShards - unit.mythicShards <= 0;
    } else {
        return neededShards - unit.shards <= 0;
    }
};
