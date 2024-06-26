﻿import { IMow, IUnit } from 'src/v2/features/characters/characters.models';
import { UnitType } from 'src/v2/features/characters/units.enums';
import { Rank } from 'src/models/enums';
import { ICharacter2 } from 'src/models/interfaces';

export function isCharacter(unit: IUnit | null): unit is ICharacter2 {
    return !!unit && unit.unitType === UnitType.character;
}

export function isMow(unit: IUnit | null): unit is IMow {
    return !!unit && unit.unitType === UnitType.mow;
}

export function isUnlocked(unit: IUnit | null): boolean {
    if (isCharacter(unit)) {
        return unit.rank > Rank.Locked;
    }

    if (isMow(unit)) {
        return unit.unlocked;
    }
    return true;
}
