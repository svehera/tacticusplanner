import { Box, Typography } from '@mui/material';
import React, { useEffect, useMemo } from 'react';

import { rarityToMaxStars, rarityToStars } from 'src/models/constants';
import { CampaignsLocationsUsage } from 'src/models/enums';
import { ICampaignBattleComposed, IPersonalGoal, IDailyRaidsPreferences } from 'src/models/interfaces';
import { OnslaughtRewardsService } from 'src/services/onslaught-rewards-service';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { Alliance, Rarity, RarityStars } from '@/fsd/5-shared/model';
import { RaritySelect, StarsSelect } from '@/fsd/5-shared/ui';

interface Props {
    alliance: Alliance;
    currentRarity: Rarity;
    targetRarity: Rarity;
    currentStars: RarityStars;
    targetStars: RarityStars;
    possibleLocations: ICampaignBattleComposed[];
    unlockedLocations: string[];
    campaignsUsage: CampaignsLocationsUsage;
    possibleMythicLocations: ICampaignBattleComposed[];
    unlockedMythicLocations: string[];
    mythicCampaignsUsage: CampaignsLocationsUsage;
    shardsPerToken: number;
    mythicShardsPerToken: number;
    dailyRaidsPreferences: IDailyRaidsPreferences;
    onChange: (key: keyof IPersonalGoal, value: number) => void;
}

export const SetAscendGoal: React.FC<Props> = ({
    targetStars,
    alliance,
    targetRarity,
    currentStars,
    currentRarity,
    shardsPerToken,
    mythicShardsPerToken,
    dailyRaidsPreferences,
    onChange,
}) => {
    useEffect(() => {
        const onslaughtData = OnslaughtRewardsService.data;
        if (onslaughtData?.honorYourHeroesRewards && dailyRaidsPreferences) {
            const sector = OnslaughtRewardsService.getAllianceSector(dailyRaidsPreferences, alliance);
            const shards = OnslaughtRewardsService.getMeanShards(onslaughtData, sector, currentRarity, 'shards');
            const mythicShards = OnslaughtRewardsService.getMeanShards(
                onslaughtData,
                sector,
                currentRarity,
                'mythicShards'
            );

            console.log(`[SetAscendGoal] Calculation:`, {
                alliance,
                rarity: Rarity[currentRarity],
                sector,
                calculated: { shards, mythicShards },
                currentProps: { shardsPerToken, mythicShardsPerToken },
            });

            if (shards !== shardsPerToken) onChange('shardsPerToken', shards);
            if (mythicShards !== mythicShardsPerToken) onChange('mythicShardsPerToken', mythicShards);
        }
    }, [
        dailyRaidsPreferences?.onslaughtSectors,
        alliance,
        currentRarity,
        shardsPerToken,
        mythicShardsPerToken,
        onChange,
    ]);

    const rarityValues = useMemo(() => {
        return getEnumValues(Rarity).filter((x: Rarity) => x >= currentRarity);
    }, [currentRarity]);

    const starsEntries = useMemo(() => {
        const minStars = rarityToStars[targetRarity];
        const maxStars = rarityToMaxStars[targetRarity];
        return getEnumValues(RarityStars).filter((x: RarityStars) => x >= minStars && x <= maxStars);
    }, [currentStars, targetRarity]);

    return (
        <>
            <div className="flex items-center gap-3">
                <RaritySelect
                    label={'Target Rarity'}
                    rarityValues={rarityValues}
                    value={targetRarity}
                    valueChanges={value => {
                        onChange('targetRarity', value);
                        onChange('targetStars', rarityToStars[value as Rarity]);
                    }}
                />

                <StarsSelect
                    label={'Target stars'}
                    starsValues={starsEntries}
                    value={targetStars}
                    valueChanges={value => onChange('targetStars', value)}
                />
            </div>

            {(currentRarity < Rarity.Legendary || currentStars < RarityStars.OneBlueStar) && (
                <>
                    <Box className="flex items-center gap-3">
                        <Typography variant="body2" color="textSecondary">
                            Expected shards per Onslaught: <b>{shardsPerToken}</b>
                        </Typography>
                    </Box>
                </>
            )}

            {targetRarity >= Rarity.Mythic && (
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
