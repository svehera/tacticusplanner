import { Rank, Rarity, UnitType } from '@/fsd/5-shared/model';

import { IUnit } from '@/fsd/4-entities/unit';

export const needToAscendCharacter = (unit: IUnit) => {
    if (unit.unitType === UnitType.mow) {
        return false;
    }

    const maxCommon = unit.rarity === Rarity.Common && unit.rank === Rank.Iron1;
    const maxUncommon = unit.rarity === Rarity.Uncommon && unit.rank === Rank.Bronze1;
    const maxRare = unit.rarity === Rarity.Rare && unit.rank === Rank.Silver1;
    const maxEpic = unit.rarity === Rarity.Epic && unit.rank === Rank.Gold1;
    return maxCommon || maxUncommon || maxRare || maxEpic;
};
