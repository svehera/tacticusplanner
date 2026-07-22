import React from 'react';

import { IGoalEstimate } from '@/fsd/3-features/goals';

import { GoalEstimateChips } from './estimate-chips';

interface Props {
    goalEstimate: IGoalEstimate;
    calendarDate?: string;
}
export const GoalCardPreFarmMaterial: React.FC<Props> = ({ goalEstimate }) => {
    const info = goalEstimate.materialQuantityInfo;
    const days = (goalEstimate.daysLeft ?? 0) > 0 ? Math.ceil(goalEstimate.daysLeft ?? 0) : undefined;

    const quantityLabel = info ? `${info.held}/${info.thisGoalQuantity}` : undefined;

    return (
        <div className="flex flex-col gap-2">
            {quantityLabel !== undefined && (
                <div className="text-sm font-medium text-(--fg) tabular-nums">{quantityLabel}</div>
            )}
            {goalEstimate.included && (
                <div className="flex-box wrap gap-2">
                    <GoalEstimateChips days={days} energy={goalEstimate.energyTotal} />
                </div>
            )}
        </div>
    );
};
