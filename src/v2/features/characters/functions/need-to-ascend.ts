import { Rank, Rarity } from 'src/models/enums';

import { IUnit } from 'src/v2/features/characters/characters.models';
import { UnitType } from 'src/v2/features/characters/units.enums';

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
