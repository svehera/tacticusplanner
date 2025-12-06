import { Rarity, RarityStars } from '@/fsd/5-shared/model';

import { IUnit } from '@/fsd/4-entities/unit';

export const wingReady = (unit: IUnit) => {

    const isAlreadyWinged = unit.rarity === Rarity.Legendary && unit.stars === RarityStars.OneBlueStar;
    const isAlreadyMythic = unit.rarity === Rarity.Mythic;

    const uncommonBaseShards = 40;
    const rareBaseShards = uncommonBaseShards + 50;
    const epicBaseShards = rareBaseShards + 120;
    const legendaryBaseShards = epicBaseShards + 300;
    const wingedBaseShards = legendaryBaseShards + 900;

    var investedShards = 0;
    switch (unit.rarity) {
        case Rarity.Uncommon:
            investedShards  += uncommonBaseShards;
            break;  
        case Rarity.Rare:
            investedShards  += rareBaseShards;
            break;
        case Rarity.Epic:
            investedShards  += epicBaseShards;
            break;  
        case Rarity.Legendary:
            investedShards  += legendaryBaseShards;
            break; 
    }

    return (
        !isAlreadyWinged &&
        !isAlreadyMythic &&
        ((unit.shards + investedShards) >= wingedBaseShards)
    );
};
