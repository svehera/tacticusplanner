/* eslint-disable import-x/no-internal-modules */
import { calculateStat } from '@/fsd/5-shared/lib/stat-calculator';
import { getPierceRatio, Rank, RarityStars } from '@/fsd/5-shared/model';

import { charactersData2, ICharacterCombatProfile } from '@/fsd/4-entities/character';

/**
 * Fixed rank/rarity every character is evaluated at for the radar chart's percentile — including
 * the character being viewed, so the comparison stays apples-to-apples regardless of how far the
 * player has actually ranked anyone up. Hand-picked (not the app's other "max target" default):
 * Mythic rarity, Mythic Wings stars, Adamantine 2 rank.
 */
const REFERENCE_RANK = Rank.Adamantine2;
const REFERENCE_RARITY_STARS = RarityStars.MythicWings;

export type RadarAxisId =
    | 'health'
    | 'armor'
    | 'meleeVsInfArmor'
    | 'meleeVsZeroArmor'
    | 'rangedVsInfArmor'
    | 'rangedVsZeroArmor';

export interface RadarAxisResult {
    axis: RadarAxisId;
    /** Raw stat value at the reference rank/rarity. */
    value: number;
    /** 0-100: the fraction of all characters this value strictly exceeds. */
    percentile: number;
}

const AXIS_IDS: RadarAxisId[] = [
    'health',
    'armor',
    'meleeVsInfArmor',
    'meleeVsZeroArmor',
    'rangedVsInfArmor',
    'rangedVsZeroArmor',
];

/**
 * Raw axis values for one character at the fixed reference rank/rarity.
 *
 * "vs 0 armor" / "vs ∞ armor" are the two extremes of the general damage-mitigation rule
 * `MAX(damage × pierce, damage − armor)`: at armor=0, `damage − 0` always dominates (full,
 * unmitigated damage); at armor→∞, `damage − armor` → −∞, so the pierce floor `damage × pierce`
 * always wins. No MAX/subtraction logic is needed for either extreme — matches the existing
 * "DAMVAR" columns in `damage-cell.tsx`.
 *
 * `Math.max(0, getPierceRatio(...))` guards against a damage type `getPierceRatio` doesn't
 * recognize (its -1 sentinel) — without this, that -1 would multiply straight into the vs-∞-armor
 * axis and produce a negative value, which would then sit below every genuinely-zero character
 * (e.g. a melee-only unit's ranged axis) and inflate their percentile. An unrecognized type should
 * contribute nothing to that axis, not a fabricated negative one.
 */
function computeRawAxisValues(entry: ICharacterCombatProfile): Record<RadarAxisId, number> {
    const damage = calculateStat(entry.initialStats.damage, REFERENCE_RANK, REFERENCE_RARITY_STARS);
    const meleePierce = Math.max(0, getPierceRatio(entry.meleeAttack.pierce));
    const rangedPierce = entry.rangedAttack ? Math.max(0, getPierceRatio(entry.rangedAttack.pierce)) : 0;
    const meleeHits = entry.meleeAttack.hitCount;
    const rangedHits = entry.rangedAttack?.hitCount ?? 0;

    return {
        health: calculateStat(entry.initialStats.health, REFERENCE_RANK, REFERENCE_RARITY_STARS),
        armor: calculateStat(entry.initialStats.armor, REFERENCE_RANK, REFERENCE_RARITY_STARS),
        meleeVsZeroArmor: damage * meleeHits,
        meleeVsInfArmor: damage * meleeHits * meleePierce,
        rangedVsZeroArmor: damage * rangedHits,
        rangedVsInfArmor: damage * rangedHits * rangedPierce,
    };
}

// Computed once at module load: the reference rank/rarity is fixed, so the whole population's raw
// values never change at runtime — no need to recompute per page visit.
const ALL_CHARACTER_RAW_VALUES: Record<RadarAxisId, number>[] = charactersData2.map(entry =>
    computeRawAxisValues(entry)
);

/**
 * Fraction of `population` this value strictly exceeds, as a 0-100 percentile.
 *
 * Strict, not inclusive: when a large share of the population ties at the same value (e.g. every
 * melee-only character has a raw ranged-damage value of exactly 0), an inclusive `<=` comparison
 * would credit that whole tied group with "beating" each other, inflating a value that's actually
 * the population's floor into a misleadingly high percentile. Strict `<` means the floor always
 * reads as 0%, whoever else shares it.
 */
export function percentileOf(value: number, population: number[]): number {
    if (population.length === 0) return 0;
    return (population.filter(candidate => candidate < value).length / population.length) * 100;
}

/**
 * Builds the 6-axis radar stats for one character, both the raw reference-rank value and its
 * percentile against every character in the game (evaluated at that same reference rank/rarity).
 * Returns `undefined` if `snowprintId` doesn't match a known character.
 */
export function buildRadarStats(snowprintId: string): RadarAxisResult[] | undefined {
    const entry = charactersData2.find(candidate => candidate.id === snowprintId);
    if (!entry) return undefined;

    const raw = computeRawAxisValues(entry);
    return AXIS_IDS.map(axis => ({
        axis,
        value: raw[axis],
        percentile: percentileOf(
            raw[axis],
            ALL_CHARACTER_RAW_VALUES.map(populationEntry => populationEntry[axis])
        ),
    }));
}
