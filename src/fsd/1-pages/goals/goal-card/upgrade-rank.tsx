import { Calendar } from 'lucide-react';
import React from 'react';

import { Rank, Rarity } from '@/fsd/5-shared/model';
import { AccessibleTooltip, LazyTooltip, ProgressBar } from '@/fsd/5-shared/ui';
import { MiscIcon, RarityIcon } from '@/fsd/5-shared/ui/icons';

import { ICharacterUpgradeRankGoal } from '@/fsd/4-entities/goal';

import { getDoneByDays, IGoalEstimate } from '@/fsd/3-features/goals';

import { ProgressionRow } from './progression-row';
import { RankEmblem } from './rank-emblem';

interface Props {
    goal: ICharacterUpgradeRankGoal;
    goalEstimate: IGoalEstimate;
    bookRarity: Rarity;
}

/** Body of an UpgradeRank goal card: rank progression and XP-book progress. */
export const GoalCardUpgradeRank: React.FC<Props> = ({ goal, goalEstimate, bookRarity }) => {
    const { xpEstimate } = goalEstimate;
    const applied = goalEstimate.xpBooksApplied;
    const required = goalEstimate.xpBooksRequired;
    const hasBooks = applied !== undefined && required !== undefined && required > 0;
    const bookIcon = (Rarity[bookRarity].toLowerCase() + 'Book') as never;
    const doneBy = getDoneByDays(goalEstimate);
    // XP income is the bottleneck when it finishes later than the material farm.
    const xpIsDriver = (goalEstimate.xpDaysLeft ?? 0) > goalEstimate.daysLeft;

    return (
        <div className="flex flex-col gap-2.5">
            <ProgressionRow
                from={<RankEmblem rank={goal.rankStart} rankPoint5={goal.rankStartPoint5} role="Current rank" />}
                to={<RankEmblem rank={goal.rankEnd} rankPoint5={goal.rankPoint5} role="Target rank" />}
                trailing={
                    goal.upgradesRarity.length > 0 && goal.upgradesRarity.length < 6 ? (
                        <LazyTooltip
                            title={`Filtered upgrade materials: ${goal.upgradesRarity.map(rarity => Rarity[rarity]).join(', ')}`}>
                            <span
                                role="img"
                                aria-label={`Filtered upgrade materials: ${goal.upgradesRarity.map(rarity => Rarity[rarity]).join(', ')}`}
                                className="flex items-center gap-0.5 [&>img]:h-[18px] [&>img]:w-auto">
                                {goal.upgradesRarity.map(rarity => (
                                    <RarityIcon key={rarity} rarity={rarity} />
                                ))}
                            </span>
                        </LazyTooltip>
                    ) : undefined
                }
                days={doneBy > 0 ? Math.ceil(doneBy) : undefined}
                energy={goalEstimate.energyTotal}
                ariaLabel={`${Rank[goal.rankStart].replace(/(\d)$/, ' $1')} to ${Rank[goal.rankEnd].replace(/(\d)$/, ' $1')}`}
            />

            {hasBooks && (
                <div className="flex flex-col gap-2.5 border-t border-(--card-border) pt-2.5">
                    <ProgressBar
                        value={applied}
                        max={required}
                        intent="primary"
                        ariaLabel={`${Rarity[bookRarity]} XP Books`}
                        label={
                            <>
                                <MiscIcon icon={bookIcon} width={20} height={20} />
                                {Rarity[bookRarity]} XP Books
                            </>
                        }
                        valueLabel={`${applied} / ${required}`}
                        subLeft={
                            goalEstimate.xpDaysLeft === undefined ? undefined : (
                                <AccessibleTooltip
                                    title={`${Math.ceil(goalEstimate.xpDaysLeft)} days — estimated from your XP Income settings${xpIsDriver ? ' (this is what gates completion)' : ''}`}>
                                    <span
                                        className={`inline-flex items-center gap-1 ${xpIsDriver ? 'text-(--primary)' : 'text-(--soft-fg)'}`}>
                                        <Calendar className="size-3.5" aria-hidden />
                                        <span
                                            className={`font-bold ${xpIsDriver ? 'text-(--primary)' : 'text-(--fg)'}`}>
                                            {Math.ceil(goalEstimate.xpDaysLeft)}
                                        </span>
                                        d
                                    </span>
                                </AccessibleTooltip>
                            )
                        }
                        subRight={
                            xpEstimate && (
                                <>
                                    Lv <span className="font-bold text-(--fg)">{xpEstimate.currentLevel}</span> →{' '}
                                    <span className="font-bold text-(--fg)">{xpEstimate.targetLevel}</span>
                                </>
                            )
                        }
                    />
                </div>
            )}
        </div>
    );
};
