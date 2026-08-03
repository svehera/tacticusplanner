import React from 'react';

import { Rarity } from '@/fsd/5-shared/model';

import { getDoneByDays, hasXpBooks, ICharacterUpgradeAbilities, IGoalEstimate } from '@/fsd/3-features/goals';

import { GoalEstimateChips } from './estimate-chips';
import { ResourceCostRow } from './resource-cost-row';
import { buildAbilityCostItems } from './resource-items';
import { StatBlockPair } from './stat-block-pair';
import { XpBooksRow } from './xp-books-row';

interface Props {
    goal: ICharacterUpgradeAbilities;
    goalEstimate: IGoalEstimate;
    bookRarity: Rarity;
}

/** Body of a Character Abilities goal card: costs + estimate, active/passive blocks, XP-book row. */
export const GoalCardCharacterAbilities: React.FC<Props> = ({ goal, goalEstimate, bookRarity }) => {
    const blocks = [];
    if (goal.activeEnd > goal.activeStart)
        blocks.push({ label: 'Active', start: goal.activeStart, end: goal.activeEnd });
    if (goal.passiveEnd > goal.passiveStart)
        blocks.push({ label: 'Passive', start: goal.passiveStart, end: goal.passiveEnd });

    const costItems = buildAbilityCostItems(goalEstimate.abilitiesEstimate);
    const doneBy = getDoneByDays(goalEstimate);
    const days = doneBy > 0 ? Math.ceil(doneBy) : undefined;
    const hasEstimate = days !== undefined || goalEstimate.energyTotal > 0;
    const hasTop = costItems.length > 0 || hasEstimate;
    const showBooks = hasXpBooks(goalEstimate);

    return (
        <div className="flex flex-col gap-2.5">
            {hasTop && (
                <div className="flex min-h-[30px] items-center justify-between gap-2">
                    <ResourceCostRow items={costItems} />
                    <GoalEstimateChips days={days} energy={goalEstimate.energyTotal} />
                </div>
            )}
            {blocks.length > 0 && (
                <div className={hasTop ? 'border-t border-(--card-border) pt-2.5' : ''}>
                    <StatBlockPair blocks={blocks} />
                </div>
            )}
            {showBooks && (
                <div className={hasTop || blocks.length > 0 ? 'border-t border-(--card-border) pt-2.5' : ''}>
                    <XpBooksRow goalEstimate={goalEstimate} bookRarity={bookRarity} />
                </div>
            )}
        </div>
    );
};
