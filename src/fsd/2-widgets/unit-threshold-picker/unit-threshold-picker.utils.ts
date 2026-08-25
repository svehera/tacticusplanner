/* eslint-disable import-x/no-internal-modules */
import { rankToRarity, rarityToMaxStars, rarityToStars } from 'src/models/constants';

import { Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';

export const ALL_RANK_VALUES: Rank[] = Object.values(Rank)
    .filter((rank): rank is Rank => typeof rank === 'number')
    .toSorted((first, second) => first - second);

export const ALL_STAR_VALUES: RarityStars[] = Object.values(RarityStars)
    .filter((stars): stars is RarityStars => typeof stars === 'number')
    .toSorted((first, second) => first - second);

export const ABILITY_MAX_BY_RARITY: Record<Rarity, number> = {
    [Rarity.Common]: 8,
    [Rarity.Uncommon]: 17,
    [Rarity.Rare]: 26,
    [Rarity.Epic]: 35,
    [Rarity.Legendary]: 50,
    [Rarity.Mythic]: 60,
};

export interface UnitThresholdFields {
    rank: Rank;
    rarity: Rarity;
    stars: number;
    activeAbilityLevel: number;
    passiveAbilityLevel: number;
}

/**
 * Clamps rarity/stars/ability-level into a valid combination for the given rank — rarity can't be
 * below what the rank requires, stars must fall within that rarity's range, and ability levels can't
 * exceed what that rarity allows. Shared by every "pick a unit and set rank/rarity/stars/ability"
 * picker so they can't produce a target/threshold that no character could ever actually reach.
 */
export function enforceUnitThresholdMinimums(fields: UnitThresholdFields): UnitThresholdFields {
    const minimumRarity = rankToRarity[fields.rank] ?? Rarity.Common;
    const rarity = Math.max(fields.rarity, minimumRarity) as Rarity;
    const minStars = rarityToStars[rarity] ?? RarityStars.None;
    const maxStars = rarityToMaxStars[rarity] ?? RarityStars.MythicWings;
    const maxAbility = ABILITY_MAX_BY_RARITY[rarity] ?? 60;

    return {
        rank: fields.rank,
        rarity,
        stars: Math.min(Math.max(fields.stars, minStars), maxStars),
        activeAbilityLevel: Math.min(Math.max(fields.activeAbilityLevel, 1), maxAbility),
        passiveAbilityLevel: Math.min(Math.max(fields.passiveAbilityLevel, 1), maxAbility),
    };
}
