import { ArrowForward } from '@mui/icons-material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import React from 'react';

import { getEstimatedDate } from '@/fsd/5-shared/lib';
import { Rarity } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { RankIcon, RarityIcon } from '@/fsd/5-shared/ui/icons';

import { ICharacterUpgradeRankGoal } from '@/fsd/4-entities/goal';

import { IGoalEstimate, XpTotal } from '@/fsd/3-features/goals';

import { XpGoalProgressBar } from '../xp-book-progress-bar';

import { GoalEstimateRow } from './estimate-row';

interface Props {
    goal: ICharacterUpgradeRankGoal;
    goalEstimate: IGoalEstimate;
    calendarDate: string;
    bookRarity: Rarity;
}

export const GoalCardUpgradeRank: React.FC<Props> = ({ goal, goalEstimate, calendarDate, bookRarity }) => {
    const { xpEstimate } = goalEstimate;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex-box gap-[3px]">
                <RankIcon rank={goal.rankStart} /> <ArrowForward />
                <RankIcon rank={goal.rankEnd} rankPoint5={goal.rankPoint5} />
                {!!goal.upgradesRarity.length && (
                    <div className="flex-box gap-[3px]">
                        {goal.upgradesRarity.map(x => (
                            <RarityIcon key={x} rarity={x} />
                        ))}
                    </div>
                )}
            </div>

            {goalEstimate.included && (
                <div className="flex-box wrap gap-2">
                    <GoalEstimateRow
                        daysLeft={goalEstimate.daysLeft ?? 0}
                        calendarDate={calendarDate}
                        energyTotal={goalEstimate.energyTotal}
                    />
                </div>
            )}

            {(goalEstimate.xpDaysLeft !== undefined ||
                goalEstimate.xpBooksApplied !== undefined ||
                goalEstimate.xpBooksRequired !== undefined) && (
                <div className="flex-box wrap gap-2">
                    <AccessibleTooltip
                        title={
                            goalEstimate.xpDaysLeft === undefined
                                ? 'XP Income not set / No XP needed for this goal'
                                : `${Math.ceil(goalEstimate.xpDaysLeft)} days. Estimated date ${getEstimatedDate(goalEstimate.xpDaysLeft)}`
                        }>
                        <div className="flex-box gap-[3px]">
                            <CalendarMonthIcon
                                sx={{
                                    color: goalEstimate.xpDaysLeft === undefined ? 'error.main' : 'inherit',
                                }}
                            />
                            {Math.ceil(goalEstimate.xpDaysLeft ?? 0)}
                        </div>
                    </AccessibleTooltip>
                    {goalEstimate.xpBooksApplied !== undefined && goalEstimate.xpBooksRequired !== undefined && (
                        <XpGoalProgressBar
                            applied={goalEstimate.xpBooksApplied ?? 0}
                            required={goalEstimate.xpBooksRequired ?? 0}
                            bookRarity={bookRarity}
                        />
                    )}
                </div>
            )}

            {goalEstimate.xpDaysLeft === undefined && xpEstimate && <XpTotal {...xpEstimate} />}
        </div>
    );
};
