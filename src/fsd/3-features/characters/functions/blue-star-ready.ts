import { Rarity, RarityStars } from '@/fsd/5-shared/model';

import { IUnit } from '@/fsd/4-entities/unit';

import { CharactersService } from '@/fsd/3-features/characters/characters.service';

export const blueStarReady = (unit: IUnit) => {
    const isAlreadyBlueStar = unit.rarity === Rarity.Legendary && unit.stars === RarityStars.OneBlueStar;
    const isAlreadyMythic = unit.rarity === Rarity.Mythic;

    if (isAlreadyMythic || isAlreadyBlueStar) return false;

    const totalShardsCurrent = CharactersService.getTotalProgressionUntil(unit.rarity, unit.stars);
    const totalShardsForNextRarity = CharactersService.getTotalProgressionUntil(
        Rarity.Legendary,
        RarityStars.OneBlueStar
    );
    const neededShards = (totalShardsForNextRarity.shards ?? 0) - (totalShardsCurrent.shards ?? 0);

    return unit.shards >= neededShards;
};
