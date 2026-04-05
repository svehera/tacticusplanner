/* eslint-disable import-x/no-internal-modules */
import { ArrowForward } from '@mui/icons-material';
import { sum } from 'lodash';
import React from 'react';

import { Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

import { CampaignImage } from '@/fsd/4-entities/campaign';
import { ICharacter2 } from '@/fsd/4-entities/character';
import { ICharacterAscendGoal } from '@/fsd/4-entities/goal';
import { IMow2 } from '@/fsd/4-entities/mow';

import { OrbsTotal } from '@/fsd/3-features/characters/components/orbs-total';
import { IGoalEstimate, UpgradesService } from '@/fsd/3-features/goals';

import { GoalEstimateRow } from './estimate-row';

interface Props {
    goal: ICharacterAscendGoal;
    goalEstimate: IGoalEstimate;
    calendarDate: string | undefined;
    characters: ICharacter2[];
    mows: IMow2[];
}

/** Renders the body of an Ascend goal card, showing rarity/stars progression and shard costs. */
export const GoalCardAscend: React.FC<Props> = ({ goal, goalEstimate, calendarDate, characters, mows }) => {
    const isSameRarity = goal.rarityStart === goal.rarityEnd;
    const minStars = RarityMapper.toStars[goal.rarityEnd];
    const isMinStars = minStars === goal.starsEnd;
    const shardsData = UpgradesService.getShardsForGoal(characters, mows, goal);
    const noOrbs: Record<Rarity, number> = {
        [Rarity.Common]: 0,
        [Rarity.Uncommon]: 0,
        [Rarity.Rare]: 0,
        [Rarity.Epic]: 0,
        [Rarity.Legendary]: 0,
        [Rarity.Mythic]: 0,
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex-box gap5">
                {!isSameRarity && (
                    <>
                        <RarityIcon rarity={goal.rarityStart} /> <ArrowForward />
                        <RarityIcon rarity={goal.rarityEnd} />
                        {!isMinStars && <StarsIcon stars={goal.starsEnd} />}
                    </>
                )}
                {isSameRarity && (
                    <>
                        <StarsIcon stars={goal.starsStart} /> <ArrowForward />
                        <StarsIcon stars={goal.starsEnd} />
                    </>
                )}
            </div>
            {sum(Object.entries(goalEstimate.orbsEstimate?.orbs ?? noOrbs).map(([_, orbCount]) => orbCount)) > 0 && (
                <div>
                    <OrbsTotal alliance={goal.unitAlliance} orbs={goalEstimate.orbsEstimate?.orbs ?? noOrbs} />
                </div>
            )}

            {shardsData.totalIncrementalShardsNeeded > 0 && (
                <div>
                    <b>
                        {shardsData.incrementalShardsAcquired} of {shardsData.totalIncrementalShardsNeeded}
                    </b>{' '}
                    Shards
                </div>
            )}
            {shardsData.totalIncrementalMythicShardsNeeded > 0 && (
                <div>
                    <b>
                        {shardsData.incrementalMythicShardsAcquired} of {shardsData.totalIncrementalMythicShardsNeeded}
                    </b>{' '}
                    Mythic Shards
                </div>
            )}

            <div className="flex-box wrap gap-2">
                {goalEstimate.included && (
                    <GoalEstimateRow
                        daysLeft={goalEstimate.daysLeft ?? 0}
                        calendarDate={calendarDate}
                        energyTotal={goalEstimate.energyTotal}
                    />
                )}
                {!!goalEstimate.oTokensTotal && (
                    <AccessibleTooltip title={`${goalEstimate.oTokensTotal} Onslaught tokens`}>
                        <div className="flex-box gap-[3px]">
                            <CampaignImage campaign={'Onslaught'} size={18} /> {goalEstimate.oTokensTotal}
                        </div>
                    </AccessibleTooltip>
                )}
            </div>
        </div>
    );
};
