import { describe, expect, it } from 'vitest';

import { Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';

import { buildBulkPlannedGoals, type BulkUnitEntry, getBulkRankGoalPlans } from './bulk-goal-creator.service';

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
