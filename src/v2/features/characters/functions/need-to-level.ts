import { rankToLevel } from 'src/models/constants';

import { UnitType, Rank } from '@/fsd/5-shared/model';

import { IUnit } from '@/fsd/4-entities/unit';

import { needToAscendCharacter } from './need-to-ascend';

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
