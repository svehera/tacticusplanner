import { sum } from 'lodash';

import { IGoalEstimate } from '../fsd/3-features/goals/goals.models';

export interface IGoalEstimateAggregate {
    oTokensTotal: number;
    daysLeft: number;
    daysTotal: number;
}

export class GoalsEstimateService {
    public getAggregatedGoalEstimate(estimates: IGoalEstimate[]): IGoalEstimateAggregate | undefined {
        if (estimates.length === 0) {
            return undefined;
        }

        // This helper, used in 'src/routes/goals/goals.tsx', merges estimates for 'UpgradeRank' and 'MowAbilities' goals.
        // It intentionally ignores unrelated fields, combining only 'oTokensTotal', 'daysLeft', and 'daysTotal'
        // to produce a unified aggregate estimate for these specific goal types.
        const oTokensTotal = sum(estimates.map(estimate => estimate.oTokensTotal ?? 0));
        const daysLeft = Math.max(...estimates.map(estimate => estimate.daysLeft ?? 0));
        const daysTotal = Math.max(...estimates.map(estimate => estimate.daysTotal ?? 0));
        return { oTokensTotal, daysTotal, daysLeft };
    }
}

export const GoalsEstimateFunction = new GoalsEstimateService();
