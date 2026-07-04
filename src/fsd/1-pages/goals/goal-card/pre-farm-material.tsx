import React from 'react';

import { IGoalEstimate } from '@/fsd/3-features/goals';

import { GoalEstimateRow } from './estimate-row';

interface Props {
    goalEstimate: IGoalEstimate;
    calendarDate?: string;
}

export const GoalCardPreFarmMaterial: React.FC<Props> = ({ goalEstimate, calendarDate }) => {
    const info = goalEstimate.materialQuantityInfo;

    const quantityLabel = info ? `${info.held}/${info.thisGoalQuantity}` : undefined;

    return (
        <div className="flex flex-col gap-2">
            {quantityLabel !== undefined && (
                <div className="text-sm font-medium text-(--fg) tabular-nums">{quantityLabel}</div>
            )}
            {goalEstimate.included && (
                <div className="flex-box wrap gap-2">
                    <GoalEstimateRow
                        daysLeft={goalEstimate.daysLeft ?? 0}
                        calendarDate={calendarDate}
                        energyTotal={goalEstimate.energyTotal}
                    />
                </div>
            )}
        </div>
    );
};
