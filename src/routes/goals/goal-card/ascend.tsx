import { ArrowForward } from '@mui/icons-material';
import React from 'react';

import { ICharacter2 } from '@/models/interfaces';
import { rarityToStars } from 'src/models/constants';

import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { RarityIcon } from '@/fsd/5-shared/ui/icons/rarity.icon';
import { StarsIcon } from '@/fsd/5-shared/ui/icons/stars.icon';

import { CampaignImage } from '@/fsd/4-entities/campaign/campaign.icon';
import { ICharacterAscendGoal } from '@/fsd/4-entities/goal';
import { IMow2 } from '@/fsd/4-entities/mow/@x/unit';

import { IGoalEstimate } from '@/fsd/3-features/goals/goals.models';
import { UpgradesService } from '@/fsd/3-features/goals/upgrades.service';

import { GoalEstimateRow } from './estimate-row';

interface Props {
    goal: ICharacterAscendGoal;
    goalEstimate: IGoalEstimate;
    calendarDate: string;
    characters: ICharacter2[];
    mows: IMow2[];
}

export const GoalCardAscend: React.FC<Props> = ({ goal, goalEstimate, calendarDate, characters, mows }) => {
    const isSameRarity = goal.rarityStart === goal.rarityEnd;
    const minStars = rarityToStars[goal.rarityEnd];
    const isMinStars = minStars === goal.starsEnd;
    const shardsData = UpgradesService.getShardsForGoal(characters, mows, goal);

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
                        daysLeft={goalEstimate.daysLeft}
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
