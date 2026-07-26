import React from 'react';

import { RarityMapper } from '@/fsd/5-shared/model';
import { LazyTooltip, ProgressBar } from '@/fsd/5-shared/ui';
import { RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { ICharacterAscendGoal } from '@/fsd/4-entities/goal';
import { IMow2 } from '@/fsd/4-entities/mow';

import { getDoneByDays, IGoalEstimate, UpgradesService } from '@/fsd/3-features/goals';

import { ProgressionRow } from './progression-row';
import { ResourceCostRow } from './resource-cost-row';
import { buildOrbItems } from './resource-items';

interface Props {
    goal: ICharacterAscendGoal;
    goalEstimate: IGoalEstimate;
    characters: ICharacter2[];
    mows: IMow2[];
}

/** Body of an Ascend goal card: rarity/stars progression, orb costs, and shard progress. */
export const GoalCardAscend: React.FC<Props> = ({ goal, goalEstimate, characters, mows }) => {
    const isSameRarity = goal.rarityStart === goal.rarityEnd;
    const isMinStars = RarityMapper.toStars[goal.rarityEnd] === goal.starsEnd;
    const shardsData = UpgradesService.getShardsForGoal(characters, mows, goal);
    const doneBy = getDoneByDays(goalEstimate);
    const days = doneBy > 0 ? Math.ceil(doneBy) : undefined;

    const orbItems = buildOrbItems(goalEstimate, goal.unitAlliance);

    const hasShards = shardsData.totalIncrementalShardsNeeded > 0 || shardsData.totalIncrementalMythicShardsNeeded > 0;
    const hasResources = orbItems.length > 0 || hasShards;

    return (
        <div className="flex flex-1 flex-col gap-2.5">
            {isSameRarity ? (
                <ProgressionRow
                    from={<StarsIcon stars={goal.starsStart} />}
                    to={<StarsIcon stars={goal.starsEnd} />}
                    days={days}
                    energy={goalEstimate.energyTotal}
                    ariaLabel="Ascension stars progression"
                />
            ) : (
                <ProgressionRow
                    from={
                        <LazyTooltip title={`Current rarity: ${RarityMapper.rarityToRarityString(goal.rarityStart)}`}>
                            <span className="inline-flex">
                                <RarityIcon rarity={goal.rarityStart} />
                            </span>
                        </LazyTooltip>
                    }
                    to={
                        <LazyTooltip title={`Target rarity: ${RarityMapper.rarityToRarityString(goal.rarityEnd)}`}>
                            <span className="inline-flex">
                                <RarityIcon rarity={goal.rarityEnd} />
                            </span>
                        </LazyTooltip>
                    }
                    trailing={!isMinStars && <StarsIcon stars={goal.starsEnd} />}
                    days={days}
                    energy={goalEstimate.energyTotal}
                    ariaLabel={`${RarityMapper.rarityToRarityString(goal.rarityStart)} to ${RarityMapper.rarityToRarityString(goal.rarityEnd)}`}
                />
            )}

            {hasResources && (
                <div className="flex flex-1 flex-col gap-2.5 border-t border-(--card-border) pt-2.5">
                    {orbItems.length > 0 && <ResourceCostRow items={orbItems} />}
                    {hasShards && (
                        <div className="mt-auto flex flex-col gap-2.5">
                            {shardsData.totalIncrementalShardsNeeded > 0 && (
                                <ProgressBar
                                    value={shardsData.incrementalShardsAcquired}
                                    max={shardsData.totalIncrementalShardsNeeded}
                                    intent="success"
                                    label="Shards"
                                    valueLabel={`${shardsData.incrementalShardsAcquired} / ${shardsData.totalIncrementalShardsNeeded}`}
                                />
                            )}
                            {shardsData.totalIncrementalMythicShardsNeeded > 0 && (
                                <ProgressBar
                                    value={shardsData.incrementalMythicShardsAcquired}
                                    max={shardsData.totalIncrementalMythicShardsNeeded}
                                    intent="success"
                                    label="Mythic Shards"
                                    valueLabel={`${shardsData.incrementalMythicShardsAcquired} / ${shardsData.totalIncrementalMythicShardsNeeded}`}
                                />
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
