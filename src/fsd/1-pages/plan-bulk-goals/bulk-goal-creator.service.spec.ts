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
});
