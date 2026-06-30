/* eslint-disable import-x/no-internal-modules */

import { IUnit } from '@/fsd/4-entities/unit';
import { isUnlocked } from '@/fsd/4-entities/unit/units.functions';

import { rarityCaps } from '@/fsd/3-features/characters/characters.constants';
import { CharactersService } from '@/fsd/3-features/characters/characters.service';

export const canPromoteUnit = (unit: IUnit) => {
    if (!isUnlocked(unit)) {
        return false;
    }

    const maxStarsForRarity = rarityCaps[unit.rarity].stars;

    // If the unit is already at the star cap for its rarity, promotion within rarity is impossible.
    if (unit.stars >= maxStarsForRarity) {
        return false;
    }

    const totalShardsCurrent = CharactersService.getTotalProgressionUntil(unit.rarity, unit.stars);
    const nextStar = unit.stars + 1;
    const totalShardsForNextStar = CharactersService.getTotalProgressionUntil(unit.rarity, nextStar);

    const neededShards = (totalShardsForNextStar.shards ?? 0) - (totalShardsCurrent.shards ?? 0);
    const neededMythicShards = (totalShardsForNextStar.mythicShards ?? 0) - (totalShardsCurrent.mythicShards ?? 0);

    return neededShards - unit.shards <= 0 && neededMythicShards - unit.mythicShards <= 0;
};
