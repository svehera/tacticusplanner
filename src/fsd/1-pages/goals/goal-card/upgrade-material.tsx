import React from 'react';

import { ProgressBar } from '@/fsd/5-shared/ui';

import { getDoneByDays, getMaterialBar, IGoalEstimate } from '@/fsd/3-features/goals';

import { GoalEstimateChips } from './estimate-chips';

interface Props {
    goalEstimate: IGoalEstimate;
}

/** Body of an UpgradeMaterial goal card: held-vs-needed progress plus days/energy estimate. */
export const GoalCardUpgradeMaterial: React.FC<Props> = ({ goalEstimate }) => {
    const info = goalEstimate.materialQuantityInfo;
    const doneBy = getDoneByDays(goalEstimate);
    const days = doneBy > 0 ? Math.ceil(doneBy) : undefined;
    const bar = info ? getMaterialBar(info) : undefined;
    const hasEstimate = days !== undefined || goalEstimate.energyTotal > 0;

    return (
        <div className="flex flex-col gap-2.5">
            {hasEstimate && (
                <div className="flex min-h-[30px] items-center justify-end">
                    <GoalEstimateChips days={days} energy={goalEstimate.energyTotal} />
                </div>
            )}
            {bar && (
                <div className={hasEstimate ? 'border-t border-(--card-border) pt-2.5' : ''}>
                    <ProgressBar
                        value={bar.value}
                        max={bar.max}
                        intent="success"
                        label={bar.label}
                        valueLabel={bar.valueLabel}
                    />
                </div>
            )}
        </div>
    );
};
