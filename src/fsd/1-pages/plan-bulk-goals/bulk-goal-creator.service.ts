/* eslint-disable import-x/no-internal-modules */
import { CampaignsLocationsUsage, PersonalGoalType } from 'src/models/enums';
import { IPersonalGoal } from 'src/models/interfaces';

import { Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';

import { IUnit } from '@/fsd/4-entities/unit';

export type GoalCategory = 'Unlock' | 'Ascend' | 'Rank' | 'Abilities';
export type RankStep = { rank: Rank; point5: boolean };
export type IncrementalGoalMode = 'milestones' | 'full' | 'macro';
type GoalOrder = 'character' | 'type';

export type BulkUnitEntry = {
    unit: IUnit | undefined;
    rank: Rank;
    rarity: Rarity;
    stars: number;
    activeAbilityLevel: number;
    passiveAbilityLevel: number;
    unlockMow: boolean;
    preFarmLegendaryMythic: boolean;
    useIncrementalGoals: boolean;
    incrementalGoalMode: IncrementalGoalMode;
};

type PlannedGoalItem = { category: GoalCategory; unitIndex: number; goal: IPersonalGoal };

type RankGoalPlan = {
    start: RankStep;
    end: RankStep;
    filterRarities?: Rarity[];
};

const CATEGORY_ORDER: Record<GoalCategory, number> = { Unlock: 0, Ascend: 1, Rank: 2, Abilities: 3 };

const rankValues = Object.values(Rank)
    .filter((rank): rank is Rank => typeof rank === 'number')
    .toSorted((first, second) => first - second);

const D2_5: RankStep = { rank: Rank.Diamond2, point5: true };

const rankStepValue = (step: RankStep): number => step.rank + (step.point5 ? 0.5 : 0);
const rankStepAtLeast = (first: RankStep, second: RankStep): RankStep =>
    rankStepValue(first) >= rankStepValue(second) ? first : second;

const getIncrementalBreakpoints = (mode: IncrementalGoalMode): RankStep[] => {
    switch (mode) {
        case 'full': {
            return rankValues.filter(rank => rank >= Rank.Stone2).map(rank => ({ rank, point5: false }));
        }
        case 'macro': {
            return [
                { rank: Rank.Gold1, point5: false },
                { rank: Rank.Diamond3, point5: false },
                { rank: Rank.Adamantine3, point5: false },
            ];
        }
        case 'milestones': {
            return [
                { rank: Rank.Bronze1, point5: false },
                { rank: Rank.Silver1, point5: false },
                { rank: Rank.Gold1, point5: false },
                { rank: Rank.Diamond1, point5: false },
                { rank: Rank.Diamond3, point5: false },
                { rank: Rank.Adamantine3, point5: false },
            ];
        }
    }
};

const getIncrementalSegments = (start: RankStep, end: RankStep, mode: IncrementalGoalMode): RankStep[] => {
    const breakpoints = getIncrementalBreakpoints(mode).filter(
        point => rankStepValue(point) > rankStepValue(start) && rankStepValue(point) < rankStepValue(end)
    );

    return [...breakpoints, end];
};

const splitCorePreFarmSegment = (start: RankStep, end: RankStep): RankGoalPlan[] => {
    if (rankStepValue(end) <= rankStepValue(start)) {
        return [];
    }

    if (rankStepValue(end) <= rankStepValue(D2_5)) {
        return [
            {
                start,
                end,
                filterRarities: [Rarity.Common, Rarity.Uncommon, Rarity.Rare, Rarity.Epic],
            },
        ];
    }

    if (rankStepValue(start) >= rankStepValue(D2_5)) {
        return [
            {
                start,
                end,
                filterRarities: [Rarity.Common, Rarity.Uncommon, Rarity.Rare],
            },
        ];
    }

    return [
        {
            start,
            end: D2_5,
            filterRarities: [Rarity.Common, Rarity.Uncommon, Rarity.Rare, Rarity.Epic],
        },
        {
            start: D2_5,
            end,
            filterRarities: [Rarity.Common, Rarity.Uncommon, Rarity.Rare],
        },
    ];
};

export const getBulkRankGoalPlans = ({
    start,
    target,
    useIncrementalGoals,
    preFarmLegendaryMythic,
    incrementalGoalMode,
}: {
    start: RankStep;
    target: RankStep;
    useIncrementalGoals: boolean;
    preFarmLegendaryMythic: boolean;
    incrementalGoalMode: IncrementalGoalMode;
}): RankGoalPlan[] => {
    if (rankStepValue(target) <= rankStepValue(start)) {
        return [];
    }

    const plans: RankGoalPlan[] = [];

    if (preFarmLegendaryMythic) {
        const lmFilter =
            rankStepValue(target) >= Rank.Adamantine1 ? [Rarity.Legendary, Rarity.Mythic] : [Rarity.Legendary];
        plans.push({ start, end: target, filterRarities: lmFilter });

        if (rankStepValue(target) >= Rank.Diamond3) {
            plans.push({
                start: rankStepAtLeast(start, D2_5),
                end: target,
                filterRarities: [Rarity.Epic],
            });
        }
    }

    if (useIncrementalGoals) {
        let currentStep = start;

        for (const segmentEnd of getIncrementalSegments(start, target, incrementalGoalMode)) {
            if (rankStepValue(segmentEnd) <= rankStepValue(currentStep)) {
                continue;
            }

            if (preFarmLegendaryMythic) {
                plans.push(...splitCorePreFarmSegment(currentStep, segmentEnd));
            } else {
                plans.push({ start: currentStep, end: segmentEnd });
            }

            currentStep = segmentEnd;
        }

        return plans;
    }

    if (preFarmLegendaryMythic) {
        plans.push(...splitCorePreFarmSegment(start, target));
        return plans;
    }

    plans.push({ start, end: target });
    return plans;
};

export const buildBulkPlannedGoals = ({
    bulkUnits,
    goalOrder,
    createId,
}: {
    bulkUnits: BulkUnitEntry[];
    goalOrder: GoalOrder;
    createId: () => string;
}) => {
    const items: PlannedGoalItem[] = [];

    const pushGoal = (category: GoalCategory, unitIndex: number, goal: IPersonalGoal) => {
        items.push({ category, unitIndex, goal });
    };

    const pushRankGoal = (
        unitId: string,
        unitIndex: number,
        start: RankStep,
        end: RankStep,
        filterRarities?: Rarity[]
    ) => {
        if (rankStepValue(end) <= rankStepValue(start)) {
            return;
        }

        pushGoal('Rank', unitIndex, {
            id: createId(),
            character: unitId,
            type: PersonalGoalType.UpgradeRank,
            priority: 1,
            dailyRaids: true,
            startingRank: start.rank,
            startingRankPoint5: start.point5,
            targetRank: end.rank,
            rankPoint5: end.point5,
            upgradesRarity: filterRarities ?? [],
        });
    };

    for (const [index, entry] of bulkUnits.entries()) {
        if (!entry.unit) continue;
        const unit = entry.unit;
        const isMow = !('rank' in unit);
        const unitId = unit.snowprintId;

        if (!isMow && 'rank' in unit && unit.rank === Rank.Locked && entry.rank > Rank.Locked) {
            pushGoal('Unlock', index, {
                id: createId(),
                character: unitId,
                type: PersonalGoalType.Unlock,
                priority: 1,
                dailyRaids: true,
                campaignsUsage: CampaignsLocationsUsage.LeastEnergy,
                mythicCampaignsUsage: CampaignsLocationsUsage.LeastEnergy,
            });
        }

        if (entry.rarity > unit.rarity || entry.stars > unit.stars) {
            pushGoal('Ascend', index, {
                id: createId(),
                character: unitId,
                type: PersonalGoalType.Ascend,
                priority: 1,
                dailyRaids: true,
                targetRarity: entry.rarity,
                targetStars: entry.stars as RarityStars,
                shardsPerToken: 0,
                mythicShardsPerToken: 0,
                campaignsUsage: CampaignsLocationsUsage.LeastEnergy,
                mythicCampaignsUsage: CampaignsLocationsUsage.LeastEnergy,
            });
        }

        if (!isMow && 'rank' in unit) {
            const startRankStep: RankStep = {
                rank: unit.rank === Rank.Locked ? Rank.Stone1 : unit.rank,
                point5: false,
            };
            const targetRankStep: RankStep = { rank: entry.rank, point5: false };

            for (const rankGoalPlan of getBulkRankGoalPlans({
                start: startRankStep,
                target: targetRankStep,
                preFarmLegendaryMythic: entry.preFarmLegendaryMythic,
                useIncrementalGoals: entry.useIncrementalGoals,
                incrementalGoalMode: entry.incrementalGoalMode,
            })) {
                pushRankGoal(unitId, index, rankGoalPlan.start, rankGoalPlan.end, rankGoalPlan.filterRarities);
            }
        }

        const currentActive = 'activeAbilityLevel' in unit ? unit.activeAbilityLevel : unit.primaryAbilityLevel;
        const currentPassive = 'passiveAbilityLevel' in unit ? unit.passiveAbilityLevel : unit.secondaryAbilityLevel;

        if (entry.activeAbilityLevel > currentActive || entry.passiveAbilityLevel > currentPassive) {
            pushGoal('Abilities', index, {
                id: createId(),
                character: unitId,
                type: isMow ? PersonalGoalType.MowAbilities : PersonalGoalType.CharacterAbilities,
                priority: 1,
                dailyRaids: true,
                firstAbilityLevel: entry.activeAbilityLevel,
                secondAbilityLevel: entry.passiveAbilityLevel,
            });
        }
    }

    if (goalOrder === 'type') {
        items.sort((a, b) => {
            const categoryDiff = CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
            return categoryDiff === 0 ? a.unitIndex - b.unitIndex : categoryDiff;
        });
    } else {
        items.sort((a, b) => {
            const indexDiff = a.unitIndex - b.unitIndex;
            return indexDiff === 0 ? CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category] : indexDiff;
        });
    }

    return items.map(item => item.goal);
};
