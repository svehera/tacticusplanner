import { describe, expect, it } from 'vitest';

import { Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';

import {
    buildBulkPlannedGoals,
    buildReadyToRankUpEntries,
    type BulkUnitEntry,
    getBulkRankGoalPlans,
} from './bulk-goal-creator.service';

/** A character with just the fields `getRankUpTarget`/`getBulkUnitEntryFromUnit` read. */
const makeCharacter = (overrides: Partial<ICharacter2> = {}): ICharacter2 =>
    ({
        snowprintId: 'test-character',
        rank: Rank.Stone1,
        rarity: Rarity.Common,
        stars: RarityStars.OneStar,
        level: 1,
        activeAbilityLevel: 1,
        passiveAbilityLevel: 1,
        name: 'Test Character',
        shortName: 'Test',
        icon: '',
        roundIcon: '',
        ...overrides,
    }) as unknown as ICharacter2;

const makeCharacterEntry = (overrides: Partial<BulkUnitEntry> = {}): BulkUnitEntry => ({
    unit: {
        snowprintId: 'test-character',
        rank: Rank.Diamond1,
        rarity: Rarity.Epic,
        stars: RarityStars.FiveStars,
        activeAbilityLevel: 1,
        passiveAbilityLevel: 1,
        primaryAbilityLevel: 1,
        secondaryAbilityLevel: 1,
        name: 'Test Character',
        shortName: 'Test',
        icon: '',
        roundIcon: '',
    } as unknown as BulkUnitEntry['unit'],
    rank: Rank.Diamond3,
    rarity: Rarity.Epic,
    stars: RarityStars.FiveStars,
    activeAbilityLevel: 1,
    passiveAbilityLevel: 1,
    unlockMow: false,
    preFarmLegendaryMythic: true,
    useIncrementalGoals: true,
    incrementalGoalMode: 'milestones',
    ...overrides,
});

/** A minimal, non-incremental/non-pre-farm entry — one plain Rank or Ascend goal per unit. */
const makeSimpleEntry = (snowprintId: string, overrides: Partial<BulkUnitEntry> = {}): BulkUnitEntry => ({
    unit: {
        snowprintId,
        rank: Rank.Stone1,
        rarity: Rarity.Common,
        stars: RarityStars.OneStar,
        activeAbilityLevel: 1,
        passiveAbilityLevel: 1,
        primaryAbilityLevel: 1,
        secondaryAbilityLevel: 1,
        name: snowprintId,
        shortName: snowprintId,
        icon: '',
        roundIcon: '',
    } as unknown as BulkUnitEntry['unit'],
    rank: Rank.Stone1,
    rarity: Rarity.Common,
    stars: RarityStars.OneStar,
    activeAbilityLevel: 1,
    passiveAbilityLevel: 1,
    unlockMow: false,
    preFarmLegendaryMythic: false,
    useIncrementalGoals: false,
    incrementalGoalMode: 'milestones',
    ...overrides,
});

describe('bulk-goal-creator.service', () => {
    it('splits incremental pre-farm core segment across D2.5 instead of overlapping D1->D3 goals', () => {
        const plans = getBulkRankGoalPlans({
            start: { rank: Rank.Diamond1, point5: false },
            target: { rank: Rank.Diamond3, point5: false },
            preFarmLegendaryMythic: true,
            useIncrementalGoals: true,
            incrementalGoalMode: 'milestones',
        });

        expect(plans).toEqual(
            expect.arrayContaining([
                {
                    start: { rank: Rank.Diamond1, point5: false },
                    end: { rank: Rank.Diamond3, point5: false },
                    filterRarities: [Rarity.Legendary],
                },
                {
                    start: { rank: Rank.Diamond2, point5: true },
                    end: { rank: Rank.Diamond3, point5: false },
                    filterRarities: [Rarity.Epic],
                },
                {
                    start: { rank: Rank.Diamond1, point5: false },
                    end: { rank: Rank.Diamond2, point5: true },
                    filterRarities: [Rarity.Common, Rarity.Uncommon, Rarity.Rare, Rarity.Epic],
                },
                {
                    start: { rank: Rank.Diamond2, point5: true },
                    end: { rank: Rank.Diamond3, point5: false },
                    filterRarities: [Rarity.Common, Rarity.Uncommon, Rarity.Rare],
                },
            ])
        );

        expect(plans).not.toContainEqual({
            start: { rank: Rank.Diamond1, point5: false },
            end: { rank: Rank.Diamond3, point5: false },
            filterRarities: [Rarity.Common, Rarity.Uncommon, Rarity.Rare, Rarity.Epic],
        });

        expect(plans).not.toContainEqual({
            start: { rank: Rank.Diamond1, point5: false },
            end: { rank: Rank.Diamond3, point5: false },
            filterRarities: [Rarity.Common, Rarity.Uncommon, Rarity.Rare],
        });
    });

    it('buildBulkPlannedGoals emits split CURE/CUR rank goals for D1->D3 with incremental pre-farm', () => {
        const plannedGoals = buildBulkPlannedGoals({
            bulkUnits: [makeCharacterEntry()],
            goalOrder: 'character',
            characterPriorityMode: 'character',
            createId: () => 'id',
        });

        const rankGoals = plannedGoals;

        expect(rankGoals).toHaveLength(4);

        expect(rankGoals).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    startingRank: Rank.Diamond1,
                    startingRankPoint5: false,
                    targetRank: Rank.Diamond2,
                    rankPoint5: true,
                    upgradesRarity: [Rarity.Common, Rarity.Uncommon, Rarity.Rare, Rarity.Epic],
                }),
                expect.objectContaining({
                    startingRank: Rank.Diamond2,
                    startingRankPoint5: true,
                    targetRank: Rank.Diamond3,
                    rankPoint5: false,
                    upgradesRarity: [Rarity.Common, Rarity.Uncommon, Rarity.Rare],
                }),
            ])
        );

        expect(rankGoals).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    startingRank: Rank.Diamond1,
                    startingRankPoint5: false,
                    targetRank: Rank.Diamond3,
                    rankPoint5: false,
                    upgradesRarity: [Rarity.Common, Rarity.Uncommon, Rarity.Rare, Rarity.Epic],
                }),
            ])
        );

        expect(rankGoals).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    startingRank: Rank.Diamond1,
                    startingRankPoint5: false,
                    targetRank: Rank.Diamond3,
                    rankPoint5: false,
                    upgradesRarity: [Rarity.Common, Rarity.Uncommon, Rarity.Rare],
                }),
            ])
        );
    });

    it('tier priority mode groups Rank goals by target rank across characters, ignoring character order', () => {
        const charA = makeSimpleEntry('charA', { rank: Rank.Diamond1 });
        const charB = makeSimpleEntry('charB', { rank: Rank.Silver1 });

        const tierGoals = buildBulkPlannedGoals({
            bulkUnits: [charA, charB],
            goalOrder: 'type',
            characterPriorityMode: 'tier',
            createId: () => 'id',
        });
        expect(tierGoals.map(goal => goal.character)).toEqual(['charB', 'charA']);

        const characterOrderGoals = buildBulkPlannedGoals({
            bulkUnits: [charA, charB],
            goalOrder: 'type',
            characterPriorityMode: 'character',
            createId: () => 'id',
        });
        expect(characterOrderGoals.map(goal => goal.character)).toEqual(['charA', 'charB']);
    });

    it('tier priority mode groups Ascend goals by target rarity, then target stars, then character', () => {
        const charA = makeSimpleEntry('charA', { rarity: Rarity.Legendary, stars: RarityStars.RedOneStar });
        const charB = makeSimpleEntry('charB', { rarity: Rarity.Epic, stars: RarityStars.FiveStars });
        const charC = makeSimpleEntry('charC', { rarity: Rarity.Epic, stars: RarityStars.OneStar });

        const tierGoals = buildBulkPlannedGoals({
            bulkUnits: [charA, charB, charC],
            goalOrder: 'type',
            characterPriorityMode: 'tier',
            createId: () => 'id',
        });
        // Epic before Legendary; within Epic, 1-star target before 5-star target.
        expect(tierGoals.map(goal => goal.character)).toEqual(['charC', 'charB', 'charA']);

        const characterOrderGoals = buildBulkPlannedGoals({
            bulkUnits: [charA, charB, charC],
            goalOrder: 'type',
            characterPriorityMode: 'character',
            createId: () => 'id',
        });
        expect(characterOrderGoals.map(goal => goal.character)).toEqual(['charA', 'charB', 'charC']);
    });

    it('tier priority mode groups Abilities goals by max(target active, target passive) level', () => {
        const charA = makeSimpleEntry('charA', { activeAbilityLevel: 20, passiveAbilityLevel: 1 });
        const charB = makeSimpleEntry('charB', { activeAbilityLevel: 1, passiveAbilityLevel: 5 });

        const tierGoals = buildBulkPlannedGoals({
            bulkUnits: [charA, charB],
            goalOrder: 'type',
            characterPriorityMode: 'tier',
            createId: () => 'id',
        });
        expect(tierGoals.map(goal => goal.character)).toEqual(['charB', 'charA']);
    });
});

describe('buildReadyToRankUpEntries', () => {
    // level 50 -> Diamond3 (rankToLevel), Legendary caps at Diamond3 (RarityMapper.toMaxRank)
    const highTarget = makeCharacter({
        snowprintId: 'highTarget',
        rank: Rank.Gold3,
        rarity: Rarity.Legendary,
        level: 50,
        activeAbilityLevel: 5,
        passiveAbilityLevel: 5,
    });
    // level 26 -> Silver1 (rankToLevel), Rare caps at Silver1 (RarityMapper.toMaxRank)
    const midTarget = makeCharacter({
        snowprintId: 'midTarget',
        rank: Rank.Bronze2,
        rarity: Rarity.Rare,
        level: 26,
    });
    // level 1 -> Stone1, already at Stone1: no rank above current is reachable yet
    const notReady = makeCharacter({ snowprintId: 'notReady', rank: Rank.Stone1, rarity: Rarity.Common, level: 1 });

    const defaultOptions = {
        raiseActiveAbility: false,
        raisePassiveAbility: false,
        minRank: Rank.Stone1,
        maxRank: Rank.Adamantine3,
    };

    it('stages only ready-to-rank-up characters, sorted descending by target rank', () => {
        const entries = buildReadyToRankUpEntries([highTarget, midTarget, notReady], new Set(), defaultOptions);

        expect(entries.map(entry => entry.unit?.snowprintId)).toEqual(['highTarget', 'midTarget']);
        expect(entries[0].rank).toBe(Rank.Diamond3);
        expect(entries[1].rank).toBe(Rank.Silver1);
    });

    it('excludes a character whose target rank falls outside the given range', () => {
        const entries = buildReadyToRankUpEntries([highTarget, midTarget], new Set(), {
            ...defaultOptions,
            minRank: Rank.Bronze1,
            maxRank: Rank.Bronze3,
        });

        expect(entries).toEqual([]);
    });

    it('excludes a character already present in existingUnitIds', () => {
        const entries = buildReadyToRankUpEntries([highTarget, midTarget], new Set(['highTarget']), defaultOptions);

        expect(entries.map(entry => entry.unit?.snowprintId)).toEqual(['midTarget']);
    });

    it('raises active/passive ability level to the XP level only when the corresponding option is enabled', () => {
        const [activeOnly] = buildReadyToRankUpEntries([highTarget], new Set(), {
            ...defaultOptions,
            raiseActiveAbility: true,
        });
        expect(activeOnly.activeAbilityLevel).toBe(50);
        expect(activeOnly.passiveAbilityLevel).toBe(5);

        const [neither] = buildReadyToRankUpEntries([highTarget], new Set(), defaultOptions);
        expect(neither.activeAbilityLevel).toBe(5);
        expect(neither.passiveAbilityLevel).toBe(5);
    });
});
