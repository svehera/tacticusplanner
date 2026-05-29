import React from 'react';

import { IGoalEstimate } from '@/fsd/3-features/goals';

import { GoalEstimateRow } from './estimate-row';

interface Props {
    goalEstimate: IGoalEstimate;
    calendarDate?: string;
}

/** Renders the body of an UpgradeMaterial goal card, showing quantity info and an energy/date estimate. */
export const GoalCardUpgradeMaterial: React.FC<Props> = ({ goalEstimate, calendarDate }) => {
    const info = goalEstimate.materialQuantityInfo;

    const quantityLabel = info
        ? info.isGoalPriority
            ? `${info.coveredByInventory ?? 0}/${info.thisGoalQuantity} (${info.held}/${info.totalNeeded})`
            : `${info.held}/${info.totalNeeded} (${info.thisGoalQuantity})`
        : undefined;

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
