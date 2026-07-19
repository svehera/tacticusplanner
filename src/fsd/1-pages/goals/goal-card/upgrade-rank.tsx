import { Calendar } from 'lucide-react';
import React from 'react';

import { Rank, Rarity } from '@/fsd/5-shared/model';
import { AccessibleTooltip, LazyTooltip } from '@/fsd/5-shared/ui';
import { MiscIcon, RarityIcon } from '@/fsd/5-shared/ui/icons';

import { ICharacterUpgradeRankGoal } from '@/fsd/4-entities/goal';

import { IGoalEstimate } from '@/fsd/3-features/goals';

import { ProgressionRow } from './progression-row';
import { RankEmblem } from './rank-emblem';

interface Props {
    goal: ICharacterUpgradeRankGoal;
    goalEstimate: IGoalEstimate;
    bookRarity: Rarity;
}

/** Body of an UpgradeRank goal card: rank progression (raid days) over an XP-book row (XP days). */
export const GoalCardUpgradeRank: React.FC<Props> = ({ goal, goalEstimate, bookRarity }) => {
    const { xpEstimate } = goalEstimate;
    const applied = goalEstimate.xpBooksApplied;
    const required = goalEstimate.xpBooksRequired;
    const hasBooks = applied !== undefined && required !== undefined && required > 0;
    const bookIcon = (Rarity[bookRarity].toLowerCase() + 'Book') as never;
    // Top row shows days spent on raids (materials); the XP row below shows the XP-income days.
    const raidDays = goalEstimate.daysLeft > 0 ? Math.ceil(goalEstimate.daysLeft) : undefined;
    // XP income is the bottleneck when it finishes later than the material farm.
    const xpIsDriver = (goalEstimate.xpDaysLeft ?? 0) > goalEstimate.daysLeft;
    const xpPct = Math.min(100, Math.round(((applied ?? 0) / Math.max(1, required ?? 0)) * 100));

    return (
        <div className="flex flex-1 flex-col justify-center gap-2.5">
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
                days={raidDays}
                energy={goalEstimate.energyTotal}
                ariaLabel={`${Rank[goal.rankStart].replace(/(\d)$/, ' $1')} to ${Rank[goal.rankEnd].replace(/(\d)$/, ' $1')}`}
            />

            {hasBooks && (
                <div className="border-t border-(--card-border) pt-2.5">
                    <div className="flex min-h-[28px] items-center gap-2">
                        <MiscIcon icon={bookIcon} width={18} height={18} />
                        <span className="shrink-0 text-xs font-bold text-(--fg) tabular-nums">
                            {applied} / {required}
                        </span>
                        <div
                            role="progressbar"
                            aria-label={`${Rarity[bookRarity]} XP Books`}
                            aria-valuenow={xpPct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            className="h-2 min-w-[30px] flex-1 overflow-hidden rounded-full bg-(--fg)/12">
                            <div
                                className="h-full origin-left bg-(--primary) transition-transform duration-500 motion-reduce:transition-none"
                                style={{ transform: `scaleX(${xpPct / 100})` }}
                            />
                        </div>
                        {xpEstimate && (
                            <>
                                <span aria-hidden className="h-3 w-px shrink-0 bg-(--card-border)" />
                                <span className="shrink-0 text-xs whitespace-nowrap text-(--soft-fg) tabular-nums">
                                    Lv <span className="font-bold text-(--fg)">{xpEstimate.currentLevel}</span>→
                                    <span className="font-bold text-(--fg)">{xpEstimate.targetLevel}</span>
                                </span>
                            </>
                        )}
                        {goalEstimate.xpDaysLeft !== undefined && (
                            <>
                                <span aria-hidden className="h-3 w-px shrink-0 bg-(--card-border)" />
                                <AccessibleTooltip
                                    title={`${Math.ceil(goalEstimate.xpDaysLeft)} days — estimated from your XP Income settings${xpIsDriver ? ' (this is what gates completion)' : ''}`}>
                                    <span className="inline-flex shrink-0 items-center gap-0.5 text-xs text-(--soft-fg) tabular-nums">
                                        <Calendar className="size-3.5" aria-hidden />
                                        <span className="font-bold text-(--fg)">
                                            {Math.ceil(goalEstimate.xpDaysLeft)}
                                        </span>
                                        d
                                    </span>
                                </AccessibleTooltip>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
