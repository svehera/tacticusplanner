import { Rank } from '@/fsd/5-shared/model';

import { CharactersService, ICharacterData } from '@/fsd/4-entities/character';
import {
    ICharacterAscendGoal,
    ICharacterUnlockGoal,
    ICharacterUpgradeMow,
    ICharacterUpgradeRankGoal,
} from '@/fsd/4-entities/goal';

import { buildGoalRows, CampaignData, GoalCostRow } from './campaign-progression.models';

type RankGoal = ICharacterUpgradeRankGoal | ICharacterUpgradeMow;

export interface AscensionGoalRow extends GoalCostRow {
    goal: ICharacterAscendGoal;
    unit?: ICharacterData;
}

export interface RankupGoalRow extends GoalCostRow {
    goal: RankGoal;
    unit?: ICharacterData;
    rankStart: number;
    rankEnd: number;
    rankLookupHref: string;
}

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

function isAscensionGoal(goal: ICharacterAscendGoal | ICharacterUnlockGoal | undefined): goal is ICharacterAscendGoal {
    return !!goal && 'rarityStart' in goal && 'starsStart' in goal;
}

function getRankStart(goal: RankGoal): number {
    return 'rankStart' in goal ? goal.rankStart : 0;
}

function getRankEnd(goal: RankGoal): number {
    return 'rankEnd' in goal ? goal.rankEnd : 1;
}

function getRankLookupHref(goal: RankGoal): string {
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

export function buildRankupGoalRows(
    campaignData: CampaignData,
    goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow>
): RankupGoalRow[] {
    const goalsById = buildGoalMap(goals);
    return buildGoalRows(campaignData, goalId => goalsById.has(goalId)).map(baseRow => {
        const goal = goalsById.get(baseRow.goalId)!;
        return {
            ...baseRow,
            goal,
            unit: CharactersService.getUnit(goal.unitId) ?? undefined,
            rankStart: getRankStart(goal),
            rankEnd: getRankEnd(goal),
            rankLookupHref: getRankLookupHref(goal),
        };
    });
}
