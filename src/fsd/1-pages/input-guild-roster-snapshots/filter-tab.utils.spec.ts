import { describe, expect, it } from 'vitest';

import { Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';
import { ISnapshotCharacter, ISnapshotMachineOfWar } from '@/fsd/5-shared/ui/unit-portrait';

import { IUnit } from '@/fsd/4-entities/unit';

import { FilterCriterion, findMemberUnit, getMatchingMembers, unitMeetsCriterion } from './filter-tab.utils';
import { GuildMemberRoster, MemberState, ParsedUnit } from './guild-roster-snapshots.models';

const makeUnit = (snowprintId: string, hasRank: boolean): IUnit =>
    (hasRank ? { snowprintId, rank: Rank.Stone1 } : { snowprintId }) as unknown as IUnit;

const makeChar = (overrides: Partial<ISnapshotCharacter> = {}): ISnapshotCharacter => ({
    id: 'charA',
    rank: Rank.Gold1,
    rarity: Rarity.Epic,
    stars: RarityStars.ThreeStars,
    shards: 0,
    mythicShards: 0,
    activeAbilityLevel: 20,
    passiveAbilityLevel: 20,
    xpLevel: 50,
    ...overrides,
});

const makeMow = (overrides: Partial<ISnapshotMachineOfWar> = {}): ISnapshotMachineOfWar => ({
    id: 'mowA',
    rarity: Rarity.Epic,
    stars: RarityStars.ThreeStars,
    primaryAbilityLevel: 20,
    secondaryAbilityLevel: 20,
    shards: 0,
    mythicShards: 0,
    locked: false,
    ...overrides,
});

const makeCriterion = (unit?: IUnit, overrides: Partial<FilterCriterion> = {}): FilterCriterion => ({
    unit,
    rank: Rank.Gold1,
    rarity: Rarity.Epic,
    stars: RarityStars.ThreeStars,
    activeAbilityLevel: 20,
    passiveAbilityLevel: 20,
    ...overrides,
});

const makeSuccessState = (playerName: string, units: ParsedUnit[]): MemberState => ({
    status: 'success',
    playerName,
    roster: {} as GuildMemberRoster,
    parsed: { units },
});

describe('findMemberUnit', () => {
    it('finds a unit by char id or mow id', () => {
        const units: ParsedUnit[] = [
            { char: makeChar({ id: 'charA' }), power: 0 },
            { mow: makeMow({ id: 'mowA' }), power: 0 },
        ];
        expect(findMemberUnit(units, 'charA')?.char?.id).toBe('charA');
        expect(findMemberUnit(units, 'mowA')?.mow?.id).toBe('mowA');
        expect(findMemberUnit(units, 'missing')).toBeUndefined();
    });
});

describe('unitMeetsCriterion', () => {
    it('is false when the member does not have the unit at all', () => {
        expect(unitMeetsCriterion(undefined, makeCriterion(makeUnit('charA', true)))).toBe(false);
    });

    it('is false when a character is below the threshold on any single field', () => {
        const criterion = makeCriterion(makeUnit('charA', true));
        expect(unitMeetsCriterion({ char: makeChar({ activeAbilityLevel: 19 }), power: 0 }, criterion)).toBe(false);
        expect(unitMeetsCriterion({ char: makeChar({ rank: Rank.Silver3 }), power: 0 }, criterion)).toBe(false);
        expect(unitMeetsCriterion({ char: makeChar({ rarity: Rarity.Rare }), power: 0 }, criterion)).toBe(false);
    });

    it('is true when a character meets or exceeds every threshold', () => {
        const criterion = makeCriterion(makeUnit('charA', true));
        expect(
            unitMeetsCriterion(
                { char: makeChar({ rank: Rank.Diamond1, rarity: Rarity.Legendary, activeAbilityLevel: 30 }), power: 0 },
                criterion
            )
        ).toBe(true);
    });

    it('ignores rank for a MoW and compares primary/secondary ability instead of active/passive', () => {
        // The criterion's `rank` is set but must be irrelevant for a MoW, which has no rank at all.
        const criterion = makeCriterion(makeUnit('mowA', false), { rank: Rank.Adamantine3 });
        expect(unitMeetsCriterion({ mow: makeMow(), power: 0 }, criterion)).toBe(true);
    });

    it('never matches a locked MoW', () => {
        const criterion = makeCriterion(makeUnit('mowA', false));
        expect(unitMeetsCriterion({ mow: makeMow({ locked: true }), power: 0 }, criterion)).toBe(false);
    });
});

describe('getMatchingMembers', () => {
    it('returns nothing when no criterion has a unit selected', () => {
        const memberStates = new Map<string, MemberState>([
            ['user1', makeSuccessState('Alice', [{ char: makeChar(), power: 0 }])],
        ]);
        expect(getMatchingMembers(memberStates, [makeCriterion()])).toEqual([]);
    });

    it('excludes a member missing the required character entirely', () => {
        const memberStates = new Map<string, MemberState>([
            ['user1', makeSuccessState('Alice', [{ char: makeChar({ id: 'someoneElse' }), power: 0 }])],
        ]);
        const results = getMatchingMembers(memberStates, [makeCriterion(makeUnit('charA', true))]);
        expect(results).toEqual([]);
    });

    it('requires every criterion to match (AND), excluding a member who only satisfies one', () => {
        const memberStates = new Map<string, MemberState>([
            [
                'user1',
                makeSuccessState('Alice', [
                    { char: makeChar({ id: 'charA' }), power: 0 },
                    { char: makeChar({ id: 'charB', activeAbilityLevel: 1 }), power: 0 }, // below threshold
                ]),
            ],
        ]);
        const results = getMatchingMembers(memberStates, [
            makeCriterion(makeUnit('charA', true)),
            makeCriterion(makeUnit('charB', true)),
        ]);
        expect(results).toEqual([]);
    });

    it('returns matching members with only the filtered units, at their actual levels', () => {
        const memberStates = new Map<string, MemberState>([
            ['user1', makeSuccessState('Alice', [{ char: makeChar({ id: 'charA' }), power: 0 }])],
            ['user2', makeSuccessState('Bob', [{ char: makeChar({ id: 'charA', activeAbilityLevel: 1 }), power: 0 }])],
        ]);
        const results = getMatchingMembers(memberStates, [makeCriterion(makeUnit('charA', true))]);
        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({ userId: 'user1', playerName: 'Alice' });
        expect(results[0].matchedUnits).toHaveLength(1);
        expect(results[0].matchedUnits[0].char?.id).toBe('charA');
    });

    it('skips members that are not successfully loaded', () => {
        const memberStates = new Map<string, MemberState>([
            ['user1', { status: 'not-shared' }],
            ['user2', { status: 'loading' }],
        ]);
        const results = getMatchingMembers(memberStates, [makeCriterion(makeUnit('charA', true))]);
        expect(results).toEqual([]);
    });
});
