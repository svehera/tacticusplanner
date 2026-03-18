import { ArrowForward } from '@mui/icons-material';
import React from 'react';

import { RarityIcon } from '@/fsd/5-shared/ui/icons';

import { ICharacterUpgradeMow } from '@/fsd/4-entities/goal';

import { IGoalEstimate, ShardsService, MowMaterialsTotal } from '@/fsd/3-features/goals';

import { GoalEstimateRow } from './estimate-row';

interface Props {
    goal: ICharacterUpgradeMow;
    goalEstimate: IGoalEstimate;
    calendarDate: string;
}

export const GoalCardMowAbilities: React.FC<Props> = ({ goal, goalEstimate, calendarDate }) => {
    const hasPrimaryGoal = goal.primaryEnd > goal.primaryStart;
    const hasSecondaryGoal = goal.secondaryEnd > goal.secondaryStart;
    const targetShards = ShardsService.getTargetShardsForMow(goal);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex-box gap5">
                <div className="flex-box column start gap-[3px]">
                    {hasPrimaryGoal && (
                        <div className="flex-box gap-[3px]">
                            <span>Primary:</span> <b>{goal.primaryStart}</b> <ArrowForward fontSize="small" />
                            <b>{goal.primaryEnd}</b>
                        </div>
                    )}
                    {hasSecondaryGoal && (
                        <div className="flex-box gap-[3px]">
                            <span>Secondary:</span> <b>{goal.secondaryStart}</b> <ArrowForward fontSize="small" />
                            <b>{goal.secondaryEnd}</b>
                        </div>
                    )}
                </div>
                {!!goal.upgradesRarity.length && (
                    <div className="flex-box gap-[3px]">
                        <ArrowForward fontSize="small" />
                        {goal.upgradesRarity.map(x => (
                            <RarityIcon key={x} rarity={x} />
                        ))}
                    </div>
                )}
            </div>

            <div>
                <b>
                    {goal.shards} of {targetShards}
                </b>{' '}
                Shards
            </div>

            {goalEstimate.mowEstimate && (
                <MowMaterialsTotal size="small" mowAlliance={goal.unitAlliance} total={goalEstimate.mowEstimate} />
            )}

            {goalEstimate.included && (
                <div className="flex-box wrap gap-2">
                    <GoalEstimateRow
                        daysLeft={goalEstimate.daysLeft}
                        calendarDate={calendarDate}
                        energyTotal={goalEstimate.energyTotal}
                    />
                </div>
            )}
        </div>
    );
};
