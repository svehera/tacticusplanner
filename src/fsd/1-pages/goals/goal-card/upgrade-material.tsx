import React from 'react';

import { IGoalEstimate } from '@/fsd/3-features/goals';

import { GoalEstimateRow } from './estimate-row';

interface Props {
    goalEstimate: IGoalEstimate;
    calendarDate?: string;
}

/** Renders the body of an UpgradeMaterial goal card, showing an energy and date estimate. */
export const GoalCardUpgradeMaterial: React.FC<Props> = ({ goalEstimate, calendarDate }) => {
    return (
        <div className="flex flex-col gap-2">
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
