import { Rarity, RarityStars } from '@/fsd/5-shared/model';

import { IUnit } from '@/fsd/4-entities/unit';
import { getTotalProgressionUntil } from '@/models/constants';

export const wingReady = (unit: IUnit) => {

    const isAlreadyWinged = unit.rarity === Rarity.Legendary && unit.stars === RarityStars.OneBlueStar;
    const isAlreadyMythic = unit.rarity === Rarity.Mythic;

    if(isAlreadyMythic || isAlreadyWinged) return false;

    const totalShardsCurrent = getTotalProgressionUntil(unit.rarity, unit.stars);
    const totalShardsForNextRarity = getTotalProgressionUntil(Rarity.Legendary, RarityStars.OneBlueStar);
    const neededShards = (totalShardsForNextRarity.shards ?? 0) - (totalShardsCurrent.shards ?? 0);
    
    return (
        (neededShards - unit.shards <= 0)
    );
};
