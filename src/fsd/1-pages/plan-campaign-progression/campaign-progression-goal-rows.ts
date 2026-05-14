import { Rank } from '@/fsd/5-shared/model';

import { CharactersService, ICharacterData } from '@/fsd/4-entities/character';
import {
    ICharacterAscendGoal,
    ICharacterUnlockGoal,
    ICharacterUpgradeMow,
    ICharacterUpgradeRankGoal,
    PersonalGoalType,
} from '@/fsd/4-entities/goal';

import { buildGoalRows, CampaignData, GoalCostRow } from './campaign-progression.models';

/** A goal-cost row enriched with ascension/unlock goal data and its associated character. */
export interface AscensionGoalRow extends GoalCostRow {
    goal: ICharacterAscendGoal;
    unit?: ICharacterData;
}

/** A goal-cost row enriched with rank-up goal data, rank bounds, and a rank-lookup link. */
export interface RankupGoalRow extends GoalCostRow {
    goal: ICharacterUpgradeRankGoal;
    unitName: string;
    unitRoundIcon: string;
    rankStart: number;
    rankEnd: number;
    rankLookupHref: string;
}

/** Indexes `goals` by their `goalId`, warning if duplicates are found. */
function buildGoalMap<T extends { goalId: string }>(goals: T[]): Map<string, T> {
    const goalsById = new Map<string, T>();
    for (const goal of goals) {
        if (goalsById.has(goal.goalId)) {
            console.warn('multiple goals with ID ' + goal.goalId + ' found.');
        }
        goalsById.set(goal.goalId, goal);
    }
    return goalsById;
}

/** Type guard: returns true when `goal` is an ascension (not just unlock) goal. */
function isAscensionGoal(goal: ICharacterAscendGoal | ICharacterUnlockGoal | undefined): goal is ICharacterAscendGoal {
    return !!goal && 'rarityStart' in goal && 'starsStart' in goal;
}

/** Type guard: returns true when `goal` is a character rank-up goal. */
function isRankupGoal(goal: ICharacterUpgradeRankGoal | ICharacterUpgradeMow): goal is ICharacterUpgradeRankGoal {
    return goal.type === PersonalGoalType.UpgradeRank;
}

/** Returns the starting rank for a rank-up goal. */
function getRankStart(goal: ICharacterUpgradeRankGoal): number {
    return goal.rankStart;
}

/** Returns the target rank for a rank-up goal. */
function getRankEnd(goal: ICharacterUpgradeRankGoal): number {
    return goal.rankEnd;
}

/** Builds a relative URL to the rank-lookup page pre-filled with the goal's character and rank range. */
function getRankLookupHref(goal: ICharacterUpgradeRankGoal): string {
    const rankStart = Math.max(getRankStart(goal), 1);
    const rankEnd = getRankEnd(goal);
    return (
        '../../learn/rankLookup?character=' +
        goal.unitId +
        '&rankStart=' +
        Rank[rankStart] +
        '&rankEnd=' +
        Rank[Math.max(rankStart + 1, rankEnd)]
    );
}

/** Builds ascension/unlock rows for `campaignData` filtered to goals in `goals`. */
export function buildAscensionGoalRows(
    campaignData: CampaignData,
    goals: Array<ICharacterUnlockGoal | ICharacterAscendGoal>
): AscensionGoalRow[] {
    const goalsById = buildGoalMap(goals);
    return buildGoalRows(campaignData, goalId => isAscensionGoal(goalsById.get(goalId))).flatMap(baseRow => {
        const goal = goalsById.get(baseRow.goalId);
        if (!isAscensionGoal(goal)) return [];
        return [
            {
                ...baseRow,
                goal,
                unit: CharactersService.getUnit(goal.unitId) ?? undefined,
            },
        ];
    });
}

/** Builds rank-up rows for `campaignData` filtered to goals in `goals`. */
export function buildRankupGoalRows(
    campaignData: CampaignData,
    goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow>
): RankupGoalRow[] {
    const goalsById = buildGoalMap(goals.filter(goal => isRankupGoal(goal)));
    return buildGoalRows(campaignData, goalId => goalsById.has(goalId)).map(baseRow => {
        const goal = goalsById.get(baseRow.goalId)!;
        return {
            ...baseRow,
            goal,
            unitName: goal.unitName,
            unitRoundIcon: CharactersService.getUnit(goal.unitId)?.roundIcon ?? goal.unitRoundIcon,
            rankStart: getRankStart(goal),
            rankEnd: getRankEnd(goal),
            rankLookupHref: getRankLookupHref(goal),
        };
    });
}
