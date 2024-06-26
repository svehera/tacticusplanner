﻿import { ICharacter2 } from 'src/models/interfaces';
import { Rank } from 'src/models/enums';
import { rankToLevel } from 'src/models/constants';

import { needToAscendCharacter } from './need-to-ascend';
import { IUnit } from 'src/v2/features/characters/characters.models';
import { UnitType } from 'src/v2/features/characters/units.enums';

export const needToLevelCharacter = (unit: IUnit) => {
    if (unit.unitType === UnitType.mow) {
        return false;
    }

    const isUnlocked = unit.rank > Rank.Locked;
    const needToAscend = needToAscendCharacter(unit);
    return (
        isUnlocked &&
        !needToAscend &&
        unit.level < rankToLevel[unit.rank] &&
        6 - (rankToLevel[unit.rank] - unit.level) <= unit.upgrades.length
    );
};
