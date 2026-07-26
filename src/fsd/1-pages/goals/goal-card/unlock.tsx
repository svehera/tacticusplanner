import React from 'react';

import { ProgressBar } from '@/fsd/5-shared/ui';

import { charsUnlockShards } from '@/fsd/4-entities/character';
import { ICharacterUnlockGoal } from '@/fsd/4-entities/goal';

import { getDoneByDays, IGoalEstimate } from '@/fsd/3-features/goals';

import { GoalEstimateChips } from './estimate-chips';

interface Props {
    goal: ICharacterUnlockGoal;
    goalEstimate: IGoalEstimate;
}

/** Body of an Unlock goal card: shard progress toward unlocking the character, plus days/energy estimate. */
export const GoalCardUnlock: React.FC<Props> = ({ goal, goalEstimate }) => {
    const targetShards = charsUnlockShards[goal.rarity];
    const doneBy = getDoneByDays(goalEstimate);
    const days = doneBy > 0 ? Math.ceil(doneBy) : undefined;
    const hasEstimate = days !== undefined || goalEstimate.energyTotal > 0;

    return (
        <div className="flex flex-1 flex-col gap-2.5">
            {hasEstimate && (
                <div className="flex min-h-[30px] items-center justify-end">
                    <GoalEstimateChips days={days} energy={goalEstimate.energyTotal} />
                </div>
            )}
            <div
                className={`flex flex-1 flex-col justify-end ${hasEstimate ? 'border-t border-(--card-border) pt-2.5' : ''}`}>
                <ProgressBar
                    value={goal.shards}
                    max={targetShards}
                    intent="success"
                    label="Shards"
                    valueLabel={`${goal.shards} / ${targetShards}`}
                />
            </div>
        </div>
    );
};
