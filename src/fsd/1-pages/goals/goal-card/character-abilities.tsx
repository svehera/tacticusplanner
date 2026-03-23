import { ArrowForward } from '@mui/icons-material';
import React from 'react';

import { CharacterAbilitiesTotal } from '@/fsd/3-features/characters';
import { ICharacterUpgradeAbilities, IGoalEstimate } from '@/fsd/3-features/goals';

interface Props {
    goal: ICharacterUpgradeAbilities;
    goalEstimate: IGoalEstimate;
}

export const GoalCardCharacterAbilities: React.FC<Props> = ({ goal, goalEstimate }) => {
    const hasActiveGoal = goal.activeEnd > goal.activeStart;
    const hasPassiveGoal = goal.passiveEnd > goal.passiveStart;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex-box column start gap-[3px]">
                {hasActiveGoal && (
                    <div className="flex-box gap-[3px]">
                        <span>Active:</span> <b>{goal.activeStart}</b> <ArrowForward fontSize="small" />
                        <b>{goal.activeEnd}</b>
                    </div>
                )}
                {hasPassiveGoal && (
                    <div className="flex-box gap-[3px]">
                        <span>Passive:</span> <b>{goal.passiveStart}</b> <ArrowForward fontSize="small" />
                        <b>{goal.passiveEnd}</b>
                    </div>
                )}
            </div>

            {goalEstimate.abilitiesEstimate && <CharacterAbilitiesTotal {...goalEstimate.abilitiesEstimate} />}
        </div>
    );
};
