import { Box, Typography } from '@mui/material';
import React, { useEffect, useMemo } from 'react';

import { rarityToMaxStars, rarityToStars } from 'src/models/constants';
import { ICampaignBattleComposed, IDailyRaidsPreferences } from 'src/models/interfaces';
import { OnslaughtRewardsService } from 'src/services/onslaught-rewards-service';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { Alliance, Rarity, RarityStars } from '@/fsd/5-shared/model';
import { RaritySelect, StarsSelect } from '@/fsd/5-shared/ui';

interface Props {
    goal: any;
    possibleLocations: ICampaignBattleComposed[];
    unlockedLocations: string[];
    possibleMythicLocations?: ICampaignBattleComposed[];
    unlockedMythicLocations?: string[];
    shardsPerToken: number;
    mythicShardsPerToken: number;
    alliance: Alliance;
    dailyRaidsPreferences: IDailyRaidsPreferences;
    onChange: (key: any, value: number) => void;
}

export const EditAscendGoal: React.FC<Props> = ({
    goal,
    shardsPerToken,
    mythicShardsPerToken,
    alliance,
    dailyRaidsPreferences,
    onChange,
}) => {
    useEffect(() => {
        const onslaughtData = OnslaughtRewardsService.data;
        if (onslaughtData?.honorYourHeroesRewards && dailyRaidsPreferences) {
            const sector = OnslaughtRewardsService.getAllianceSector(dailyRaidsPreferences, alliance);
            const shards = OnslaughtRewardsService.getMeanShards(
                onslaughtData,
                sector,
                goal.rarityStart as Rarity,
                'shards'
            );
            const mythicShards = OnslaughtRewardsService.getMeanShards(
                onslaughtData,
                sector,
                goal.rarityStart as Rarity,
                'mythicShards'
            );

            console.log(`[EditAscendGoal] Calculation:`, {
                alliance,
                rarity: Rarity[goal.rarityStart],
                sector,
                calculated: { shards, mythicShards },
                currentState: { shards: shardsPerToken, mythic: mythicShardsPerToken },
            });

            if (shards !== shardsPerToken) onChange('shardsPerToken', shards);
            if (mythicShards !== mythicShardsPerToken) onChange('mythicShardsPerToken', mythicShards);
        }
    }, [dailyRaidsPreferences?.onslaughtSectors, alliance, goal.rarityStart, shardsPerToken, mythicShardsPerToken]);

    const rarityValues = useMemo(() => {
        return getEnumValues(Rarity).filter((x: Rarity) => x >= (goal.rarityStart as Rarity));
    }, [goal.rarityStart]);

    const starsEntries = useMemo(() => {
        const maxStars = rarityToMaxStars[goal.rarityStart as Rarity];
        return getEnumValues(RarityStars).filter((x: RarityStars) => x >= goal.starsStart && x <= maxStars);
    }, [goal.starsStart, goal.rarityStart]);

    const starsTargetEntries = useMemo(() => {
        const minStars = rarityToStars[goal.rarityEnd as Rarity];
        const maxStars = rarityToMaxStars[goal.rarityEnd as Rarity];
        const entries = getEnumValues(RarityStars).filter((x: RarityStars) => x >= minStars && x <= maxStars);
        return entries.length > 0 ? entries : [RarityStars.None];
    }, [goal.rarityEnd]);

    return (
        <>
            <div className="flex gap-3">
                <RaritySelect
                    label={'Current Rarity'}
                    rarityValues={rarityValues}
                    value={goal.rarityStart}
                    valueChanges={value => onChange('rarityStart', value)}
                />

                <RaritySelect
                    label={'Target Rarity'}
                    rarityValues={rarityValues}
                    value={goal.rarityEnd}
                    valueChanges={value => onChange('rarityEnd', value)}
                />
            </div>

            <div className="flex gap-3">
                <StarsSelect
                    label={'Current stars'}
                    starsValues={starsEntries}
                    value={goal.starsStart ?? RarityStars.None}
                    valueChanges={value => onChange('starsStart', value)}
                />
                <StarsSelect
                    label={'Target stars'}
                    starsValues={starsTargetEntries}
                    value={starsTargetEntries.includes(goal.starsEnd) ? goal.starsEnd : starsTargetEntries[0]}
                    valueChanges={value => onChange('starsEnd', value)}
                />
            </div>

            {(goal.rarityStart < Rarity.Mythic || goal.starsStart < RarityStars.OneBlueStar) && (
                <>
                    <Box className="flex items-center gap-3">
                        <Typography variant="body2" color="textSecondary">
                            Expected shards per Onslaught: <b>{shardsPerToken}</b>
                        </Typography>
                    </Box>
                </>
            )}

            {goal.rarityEnd >= Rarity.Mythic && (
                <>
                    <Box className="flex items-center gap-3">
                        <Typography variant="body2" color="textSecondary">
                            Expected mythic shards per Onslaught: <b>{mythicShardsPerToken}</b>
                        </Typography>
                    </Box>
                </>
            )}
        </>
    );
};
