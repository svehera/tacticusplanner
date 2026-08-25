import { Rank, Rarity } from '@/fsd/5-shared/model';

import { IUnit } from '@/fsd/4-entities/unit';

import { MemberState, ParsedUnit } from './guild-roster-snapshots.models';

export interface FilterCriterion {
    unit: IUnit | undefined;
    rank: Rank;
    rarity: Rarity;
    stars: number;
    activeAbilityLevel: number;
    passiveAbilityLevel: number;
}

/** The `char?.id ?? mow?.id` lookup idiom already used elsewhere in this feature. */
export function findMemberUnit(units: ParsedUnit[], snowprintId: string): ParsedUnit | undefined {
    return units.find(u => (u.char?.id ?? u.mow?.id) === snowprintId);
}

/**
 * Whether a member's unit meets a filter criterion's minimums. `undefined` (member doesn't have the
 * unit at all) never matches. MoWs have no rank, so rank is never checked for them, and their ability
 * levels are `primary`/`secondary` rather than `active`/`passive`; a locked MoW never matches.
 */
export function unitMeetsCriterion(parsedUnit: ParsedUnit | undefined, criterion: FilterCriterion): boolean {
    if (!parsedUnit) return false;

    if (parsedUnit.char) {
        const char = parsedUnit.char;
        return (
            char.rank >= criterion.rank &&
            char.rarity >= criterion.rarity &&
            char.stars >= criterion.stars &&
            char.activeAbilityLevel >= criterion.activeAbilityLevel &&
            char.passiveAbilityLevel >= criterion.passiveAbilityLevel
        );
    }

    if (parsedUnit.mow) {
        const mow = parsedUnit.mow;
        return (
            !mow.locked &&
            mow.rarity >= criterion.rarity &&
            mow.stars >= criterion.stars &&
            mow.primaryAbilityLevel >= criterion.activeAbilityLevel &&
            mow.secondaryAbilityLevel >= criterion.passiveAbilityLevel
        );
    }

    return false;
}

export interface MatchingMember {
    userId: string;
    playerName: string;
    matchedUnits: ParsedUnit[];
}

/**
 * Guild members whose roster meets every criterion that has a unit selected (an AND across all
 * criteria — a member missing even one required unit, or below its threshold, is excluded entirely).
 * Criteria with no unit picked yet are ignored; if none have a unit picked, nothing matches (an empty
 * filter isn't treated as "everyone qualifies").
 */
export function getMatchingMembers(
    memberStates: Map<string, MemberState>,
    criteria: FilterCriterion[]
): MatchingMember[] {
    const activeCriteria = criteria.filter(
        (criterion): criterion is FilterCriterion & { unit: IUnit } => criterion.unit !== undefined
    );
    if (activeCriteria.length === 0) return [];

    const results: MatchingMember[] = [];
    for (const [userId, state] of memberStates) {
        if (state.status !== 'success') continue;

        const matchedUnits: ParsedUnit[] = [];
        let allMatch = true;
        for (const criterion of activeCriteria) {
            const found = findMemberUnit(state.parsed.units, criterion.unit.snowprintId);
            if (!found || !unitMeetsCriterion(found, criterion)) {
                allMatch = false;
                break;
            }
            matchedUnits.push(found);
        }

        if (allMatch) {
            results.push({ userId, playerName: state.playerName, matchedUnits });
        }
    }
    return results;
}
