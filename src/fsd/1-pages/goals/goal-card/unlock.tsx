import React from 'react';

import { getFactionPray } from '@/fsd/5-shared/lib';

import { charsUnlockShards } from '@/fsd/4-entities/character';
import { ICharacterUnlockGoal } from '@/fsd/4-entities/goal';

import { IGoalEstimate } from '@/fsd/3-features/goals';

import { GoalEstimateRow } from './estimate-row';

interface Props {
    goal: ICharacterUnlockGoal;
    goalEstimate: IGoalEstimate;
    calendarDate: string;
}

export const GoalCardUnlock: React.FC<Props> = ({ goal, goalEstimate, calendarDate }) => {
    const targetShards = charsUnlockShards[goal.rarity];

    return (
        <div className="flex flex-col gap-2">
            <div>
                <b>
                    {goal.shards} of {targetShards}
                </b>{' '}
                Shards
            </div>

            <div className="flex-box wrap gap-2">
                {!goalEstimate.daysLeft && !goalEstimate.energyTotal && <span>{getFactionPray(goal.faction)}</span>}
                {(!!goalEstimate.daysLeft || !!goalEstimate.energyTotal) && (
                    <GoalEstimateRow
                        daysLeft={goalEstimate.daysLeft ?? 0}
                        calendarDate={calendarDate}
                        energyTotal={goalEstimate.energyTotal}
                    />
                )}
            </div>
        </div>
    );
};
