import { IGoalEstimate } from '../fsd/3-features/goals/goals.models';

export interface IGoalEstimateAggregate {
    oTokensTotal: number;
    daysLeft: number;
    daysTotal: number;
}

export const getAggregatedGoalEstimate = (estimates: IGoalEstimate[]): IGoalEstimateAggregate | undefined => {
    if (!estimates.length) {
        return undefined;
    }

    // We run this reduce solely to aggregate estimates for ascension goals that include
    // both non-mythic and mythic shards, that's why we ignore other fields.
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
};
