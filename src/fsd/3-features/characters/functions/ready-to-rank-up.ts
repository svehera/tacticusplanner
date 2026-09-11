/* eslint-disable import-x/no-internal-modules */
import { rankToLevel } from 'src/models/constants';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { Rank, RarityMapper, UnitType } from '@/fsd/5-shared/model';

import { IUnit } from '@/fsd/4-entities/unit';

import { needToAscendCharacter } from './need-to-ascend';

/**
 * The highest rank this character could rank up into right now: the largest rank its current XP
 * level satisfies, capped at the rank ceiling of its current rarity. Returns `undefined` when the
 * character is a MoW, locked, already blocked by its rarity cap (needs to ascend first), or has no
 * rank above its current one available.
 */
export const getRankUpTarget = (unit: IUnit): Rank | undefined => {
    if (unit.unitType === UnitType.mow || unit.rank <= Rank.Locked) {
        return undefined;
    }
    if (needToAscendCharacter(unit)) {
        return undefined;
    }

    const rarityCeiling = RarityMapper.toMaxRank[unit.rarity];
    let levelRank = Rank.Locked;
    for (const rank of getEnumValues(Rank)) {
        if (rank > Rank.Locked && unit.level >= rankToLevel[rank as Rank]) {
            levelRank = rank as Rank;
        }
    }

    const target = Math.min(levelRank, rarityCeiling) as Rank;
    return target > unit.rank ? target : undefined;
};

export const readyToRankUp = (unit: IUnit): boolean => getRankUpTarget(unit) !== undefined;
