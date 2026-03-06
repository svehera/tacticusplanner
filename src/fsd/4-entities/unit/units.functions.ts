import { Rank, UnitType } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character/@x/unit';
import { IMow2 } from '@/fsd/4-entities/mow/@x/unit';

import { IUnit } from './model';

export function isCharacter(unit: IUnit | undefined): unit is ICharacter2 {
    return !!unit && unit.unitType === UnitType.character;
}

export function isMow(unit: IUnit | undefined): unit is IMow2 {
    return !!unit && unit.unitType === UnitType.mow;
}

export function isUnlocked(unit: IUnit | undefined): boolean {
    if (isCharacter(unit)) {
        return unit.rank > Rank.Locked;
    }

    if (isMow(unit)) {
        return unit.unlocked;
    }
    return true;
}
