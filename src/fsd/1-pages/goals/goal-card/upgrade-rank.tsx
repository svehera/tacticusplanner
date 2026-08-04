import React from 'react';

import { Rank, Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { LazyTooltip } from '@/fsd/5-shared/ui';
import { RarityIcon } from '@/fsd/5-shared/ui/icons';

import { ICharacterUpgradeRankGoal } from '@/fsd/4-entities/goal';

import { hasXpBooks, IGoalEstimate } from '@/fsd/3-features/goals';

import { ProgressionRow } from './progression-row';
import { RankEmblem } from './rank-emblem';
import { XpBooksRow } from './xp-books-row';

interface Props {
    goal: ICharacterUpgradeRankGoal;
    goalEstimate: IGoalEstimate;
    bookRarity: Rarity;
}

/** Body of an UpgradeRank goal card: rank progression (raid days) over an XP-book row (XP days). */
export const GoalCardUpgradeRank: React.FC<Props> = ({ goal, goalEstimate, bookRarity }) => {
    const hasBooks = hasXpBooks(goalEstimate);
    // Top row shows days spent on raids (materials); the XP row below shows the XP-income days.
    const raidDays = goalEstimate.daysLeft > 0 ? Math.ceil(goalEstimate.daysLeft) : undefined;

    return (
        <div className="flex flex-1 flex-col justify-center gap-2.5">
            <ProgressionRow
                from={<RankEmblem rank={goal.rankStart} rankPoint5={goal.rankStartPoint5} role="Current rank" />}
                to={<RankEmblem rank={goal.rankEnd} rankPoint5={goal.rankPoint5} role="Target rank" />}
                trailing={
                    goal.upgradesRarity.length > 0 && goal.upgradesRarity.length < 6 ? (
                        <LazyTooltip
                            title={`Filtered upgrade materials: ${goal.upgradesRarity.map(rarity => RarityMapper.rarityToRarityString(rarity)).join(', ')}`}>
                            <span
                                role="img"
                                aria-label={`Filtered upgrade materials: ${goal.upgradesRarity.map(rarity => RarityMapper.rarityToRarityString(rarity)).join(', ')}`}
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
                    <XpBooksRow goalEstimate={goalEstimate} bookRarity={bookRarity} />
                </div>
            )}
        </div>
    );
};
