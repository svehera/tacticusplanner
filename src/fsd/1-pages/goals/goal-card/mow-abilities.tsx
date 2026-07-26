import React from 'react';

import { RarityIcon } from '@/fsd/5-shared/ui/icons';

import { ICharacterUpgradeMow } from '@/fsd/4-entities/goal';

import { getDoneByDays, IGoalEstimate, ShardsService } from '@/fsd/3-features/goals';

import { GoalEstimateChips } from './estimate-chips';
import { ResourceCostRow } from './resource-cost-row';
import { buildMowCostItems } from './resource-items';
import { StatBlockPair } from './stat-block-pair';

interface Props {
    goal: ICharacterUpgradeMow;
    goalEstimate: IGoalEstimate;
}

/** Body of a MoW Abilities goal card: primary/secondary stat blocks, shards, material costs, estimate. */
export const GoalCardMowAbilities: React.FC<Props> = ({ goal, goalEstimate }) => {
    const targetShards = ShardsService.getTargetShardsForMow(goal);
    const doneBy = getDoneByDays(goalEstimate);
    const days = doneBy > 0 ? Math.ceil(doneBy) : undefined;
    const hasEstimate = days !== undefined || goalEstimate.energyTotal > 0;
    // < 6 means a genuine rarity filter (6 == all rarities == unfiltered).
    const showRarityFilter = goal.upgradesRarity.length > 0 && goal.upgradesRarity.length < 6;

    const blocks = [];
    if (goal.primaryEnd > goal.primaryStart)
        blocks.push({ label: 'Primary', start: goal.primaryStart, end: goal.primaryEnd });
    if (goal.secondaryEnd > goal.secondaryStart)
        blocks.push({ label: 'Secondary', start: goal.secondaryStart, end: goal.secondaryEnd });

    const costItems = buildMowCostItems(goalEstimate.mowEstimate, goal.unitAlliance);

    const hasTop = costItems.length > 0 || hasEstimate;
    const hasBottom = blocks.length > 0 || showRarityFilter || targetShards > 0;

    return (
        <div className="flex flex-col gap-2.5">
            {hasTop && (
                <div className="flex min-h-[30px] items-center justify-between gap-2">
                    <ResourceCostRow items={costItems} />
                    <GoalEstimateChips days={days} energy={goalEstimate.energyTotal} />
                </div>
            )}
            {hasBottom && (
                <div className={`flex flex-col gap-2.5 ${hasTop ? 'border-t border-(--card-border) pt-2.5' : ''}`}>
                    <StatBlockPair blocks={blocks} />
                    {showRarityFilter && (
                        <div className="flex items-center gap-1 text-xs text-(--soft-fg)">
                            <span>Materials:</span>
                            <span className="flex items-center gap-0.5 [&>img]:h-[18px] [&>img]:w-auto">
                                {goal.upgradesRarity.map(rarity => (
                                    <RarityIcon key={rarity} rarity={rarity} />
                                ))}
                            </span>
                        </div>
                    )}
                    {targetShards > 0 && (
                        <div className="text-sm text-(--soft-fg)">
                            Shards{' '}
                            <span className="font-bold text-(--fg) tabular-nums">
                                {goal.shards} / {targetShards}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
