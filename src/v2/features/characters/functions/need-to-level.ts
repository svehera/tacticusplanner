import { rankToLevel } from 'src/models/constants';

import { UnitType, Rank, Rarity } from '@/fsd/5-shared/model';

import { IUnit } from '@/fsd/4-entities/unit';

import { needToAscendCharacter } from './need-to-ascend';

export const needToLevelCharacter = (unit: IUnit) => {
    if (unit.unitType === UnitType.mow) {
        return false;
    }

    const isUnlocked = unit.rank > Rank.Locked;
    const needToAscend = needToAscendCharacter(unit);

    var maxRank;
    switch (unit.rarity) {
        case Rarity.Common:
            maxRank = Rank.Iron1;
            break;
        case Rarity.Uncommon:
            maxRank = Rank.Bronze1;
            break;
        case Rarity.Rare:
            maxRank = Rank.Silver1;
            break;
        case Rarity.Epic:
            maxRank = Rank.Gold1;
            break;
        case Rarity.Legendary:
            maxRank = Rank.Diamond3;
            break;
        case Rarity.Mythic:
            maxRank = Rank.Adamantine3;
            break;
    }

    return isUnlocked && !needToAscend && unit.level < rankToLevel[maxRank];
};
