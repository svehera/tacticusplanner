import { CheckCircle, FilterListOff } from '@mui/icons-material';
import { Card, CardContent, Divider } from '@mui/material';
import Button from '@mui/material/Button';
import React, { useMemo } from 'react';

import { getEstimatedDate } from '@/fsd/5-shared/lib';
import { Rarity } from '@/fsd/5-shared/model';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { PersonalGoalType } from '@/fsd/4-entities/goal';
import { IMow2 } from '@/fsd/4-entities/mow';

import { CharacterRaidGoalSelect, GoalsService, IGoalEstimate } from '@/fsd/3-features/goals';

import { GoalCardActions } from './actions';
import { GoalCardAscend } from './ascend';
import { GoalCardCharacterAbilities } from './character-abilities';
import { GoalCardMowAbilities } from './mow-abilities';
import { GoalCardRaidsButton } from './raids-button';
import { GoalCardUnlock } from './unlock';
import { GoalCardUpgradeRank } from './upgrade-rank';

const showRaidsButton = (goal: CharacterRaidGoalSelect): boolean =>
    goal.type === PersonalGoalType.UpgradeRank || goal.type === PersonalGoalType.MowAbilities;

interface Props {
    goal: CharacterRaidGoalSelect;
    goalEstimate?: IGoalEstimate;
    menuItemSelect?: (item: 'edit' | 'delete' | 'moveUp' | 'moveDown') => void;
    onToggleInclude?: () => void;
    bgColor: string;
    characters: ICharacter2[];
    mows: IMow2[];
    bookRarity: Rarity;
}

export const GoalCard: React.FC<Props> = ({
    goal,
    menuItemSelect,
    onToggleInclude,
    goalEstimate: passed,
    bgColor,
    characters,
    mows,
    bookRarity,
}: Props) => {
    const goalEstimate: IGoalEstimate = passed ?? {
        goalId: goal.goalId,
        daysLeft: 0,
        daysTotal: 0,
        oTokensTotal: 0,
        energyTotal: 0,
        xpBooksTotal: 0,
    };
    const completionEstimate: IGoalEstimate = passed ?? { ...goalEstimate, energyTotal: Number.POSITIVE_INFINITY };
    const isGoalCompleted = GoalsService.isGoalCompleted(goal, completionEstimate);
    const calendarDate = useMemo(() => (passed ? getEstimatedDate(passed.daysLeft) : null), [passed]);

    const renderBody = () => {
        switch (goal.type) {
            case PersonalGoalType.Ascend:
                return (
                    <GoalCardAscend
                        goal={goal}
                        goalEstimate={goalEstimate}
                        calendarDate={calendarDate}
                        characters={characters}
                        mows={mows}
                    />
                );
            case PersonalGoalType.UpgradeRank:
                return (
                    <GoalCardUpgradeRank
                        goal={goal}
                        goalEstimate={goalEstimate}
                        calendarDate={calendarDate}
                        bookRarity={bookRarity}
                    />
                );
            case PersonalGoalType.MowAbilities:
                return <GoalCardMowAbilities goal={goal} goalEstimate={goalEstimate} calendarDate={calendarDate} />;
            case PersonalGoalType.CharacterAbilities:
                return <GoalCardCharacterAbilities goal={goal} goalEstimate={goalEstimate} />;
            case PersonalGoalType.Unlock:
                return <GoalCardUnlock goal={goal} goalEstimate={goalEstimate} calendarDate={calendarDate} />;
        }
    };

    const hasFooter = !!onToggleInclude || showRaidsButton(goal);

    return (
        <Card
            variant="outlined"
            className={isGoalCompleted ? 'bg-(--success)!' : ''}
            sx={{
                width: 350,
                minHeight: 200,
                display: 'flex',
                flexDirection: 'column',
                background: bgColor,
            }}>
            {/* Header: 3-column grid — [icon + #n] | name+date | actions */}
            <div
                className="grid px-3 pt-3 pb-2"
                style={{ gridTemplateColumns: 'auto 1fr auto', gap: '0 8px', minHeight: 83 }}>
                <div className="flex items-center gap-1 self-start">
                    <span className="text-[1.4rem] leading-none font-medium">#{goal.priority}</span>
                    <UnitShardIcon icon={goal.unitRoundIcon} height={40} />
                </div>
                <div className="flex min-w-0 flex-col flex-wrap justify-start">
                    <span className="text-[1.05rem] leading-snug font-medium">{goal.unitName ?? goal.unitId}</span>
                    {calendarDate && <span className="text-xs opacity-60">{calendarDate}</span>}
                </div>
                <div className="self-start">
                    <GoalCardActions goalEstimate={goalEstimate} menuItemSelect={menuItemSelect} />
                </div>
            </div>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', pt: 1, '&:last-child': { pb: 2 } }}>
                <div className="flex-1">
                    {renderBody()}
                    {goal.notes && <p className="mt-2 text-sm opacity-70">{goal.notes}</p>}
                </div>
                {hasFooter && (
                    <>
                        <Divider sx={{ mt: 1.5, mb: 1 }} />
                        <div className="flex items-center justify-between gap-2">
                            {onToggleInclude && (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color={goal.include ? 'success' : 'error'}
                                    startIcon={
                                        goal.include ? (
                                            <CheckCircle fontSize="small" />
                                        ) : (
                                            <FilterListOff fontSize="small" />
                                        )
                                    }
                                    onClick={onToggleInclude}>
                                    {goal.include ? 'Active' : 'Inactive'}
                                </Button>
                            )}
                            {showRaidsButton(goal) && <GoalCardRaidsButton unitId={goal.unitId} />}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};
