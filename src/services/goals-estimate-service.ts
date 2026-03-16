import { IGoalEstimate } from '../fsd/3-features/goals/goals.models';

export interface IGoalEstimateAggregate {
    oTokensTotal: number;
    daysLeft: number;
    daysTotal: number;
}

export class GoalsEstimateService {
    public getAggregatedGoalEstimate(estimates: IGoalEstimate[]): IGoalEstimateAggregate | undefined {
        if (!estimates.length) {
            return undefined;
        }

        // This helper, used in 'src/routes/goals/goals.tsx', merges estimates for 'UpgradeRank' and 'MowAbilities' goals.
        // It intentionally ignores unrelated fields, combining only 'oTokensTotal', 'daysLeft', and 'daysTotal'
        // to produce a unified aggregate estimate for these specific goal types.
        return estimates.reduce<IGoalEstimateAggregate>(
            (acc, curr) => {
                return {
                    oTokensTotal: acc.oTokensTotal + (curr.oTokensTotal ?? 0),
                    daysLeft: Math.max(acc.daysLeft, curr.daysLeft ?? 0),
                    daysTotal: Math.max(acc.daysTotal, curr.daysTotal ?? 0),
                };
            },
            { oTokensTotal: 0, daysLeft: 0, daysTotal: 0 }
        );
    }
}

export const GoalsEstimateFunction = new GoalsEstimateService();
