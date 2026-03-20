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
        return estimates.reduce<IGoalEstimateAggregate>(
            (accumulator, current) => {
                return {
                    oTokensTotal: accumulator.oTokensTotal + (current.oTokensTotal ?? 0),
                    daysLeft: Math.max(accumulator.daysLeft, current.daysLeft ?? 0),
                    daysTotal: Math.max(accumulator.daysTotal, current.daysTotal ?? 0),
                };
            },
            { oTokensTotal: 0, daysLeft: 0, daysTotal: 0 }
        );
    }
}

export const GoalsEstimateFunction = new GoalsEstimateService();
