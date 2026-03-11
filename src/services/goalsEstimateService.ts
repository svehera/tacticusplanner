import { IGoalEstimate } from '../fsd/3-features/goals/goals.models';

export const getAggregatedGoalEstimateForRankOrMow = (
    goalId: string,
    estimates: IGoalEstimate[]
): IGoalEstimate | undefined => {
    const goalEstimates = estimates.filter(x => x.goalId === goalId);
    if (!goalEstimates.length) {
        return undefined;
    }

    return goalEstimates.reduce(
        (prev, curr) =>
            ({
                // We run this reduce solely to aggregate estimates for ascension goals that include
                // both non-mythic and mythic shards, that's why we ignore other fields.
                ...curr,
                oTokensTotal: (prev.oTokensTotal ?? 0) + (curr.oTokensTotal ?? 0),
                daysLeft: Math.max(prev.daysLeft ?? 0, curr.daysLeft ?? 0),
                daysTotal: (prev.daysTotal ?? 0) + (curr.daysTotal ?? 0),
            }) as IGoalEstimate
    );
};
