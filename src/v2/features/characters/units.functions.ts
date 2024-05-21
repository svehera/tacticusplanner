import { IMow, IUnit } from 'src/v2/features/characters/characters.models';
import { UnitType } from 'src/v2/features/characters/units.enums';
import { Rank } from 'src/models/enums';
import { ICharacter2 } from 'src/models/interfaces';

export function isCharacter(unit: IUnit): unit is ICharacter2 {
    return unit.unitType === UnitType.character;
}

export function isMow(unit: IUnit): unit is IMow {
    return unit.unitType === UnitType.mow;
}

export function isUnlocked(unit: IUnit): boolean {
    if (isCharacter(unit)) {
        return unit.rank > Rank.Locked;
    }

    if (isMow(unit)) {
        return unit.unlocked;
    }
    return true;
}
