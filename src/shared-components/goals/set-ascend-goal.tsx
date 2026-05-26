import { MenuItem, Select } from '@mui/material';
import React, { useMemo } from 'react';

import { rarityToMaxStars, rarityToStars } from 'src/models/constants';
import { CampaignsLocationsUsage } from 'src/models/enums';
import { ICampaignBattleComposed, IPersonalGoal, SHARD_FARM_TYPE_VALUES, ShardFarmType } from 'src/models/interfaces';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { Alliance, Rarity, RarityStars } from '@/fsd/5-shared/model';
import { RaritySelect, StarsSelect } from '@/fsd/5-shared/ui';
import { OnslaughtIcon } from '@/fsd/5-shared/ui/icons/onslaught-icon';

import {
    formatOnslaughtRewardRange,
    IOnslaughtPreferences,
    defaultOnslaughtPreferences,
} from '@/fsd/1-pages/input-onslaught/onslaught-rewards';

interface Props {
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
    farmType: ShardFarmType;
    alliance?: Alliance;
    onslaughtPreferences?: IOnslaughtPreferences;
    onChange: (key: keyof IPersonalGoal, value: number | ShardFarmType) => void;
}

export const SetAscendGoal: React.FC<Props> = ({
    targetStars,
    targetRarity,
    currentStars,
    currentRarity,
    farmType,
    alliance,
    onslaughtPreferences = defaultOnslaughtPreferences,
    onChange,
}) => {
    const rarityValues = useMemo(() => {
        return getEnumValues(Rarity).filter(x => x >= currentRarity);
    }, [currentRarity]);

    const starsEntries = useMemo(() => {
        const minStars = rarityToStars[targetRarity];
        const maxStars = rarityToMaxStars[targetRarity];
        return getEnumValues(RarityStars).filter(x => x >= minStars && x <= maxStars);
    }, [currentStars, targetRarity]);

    const shardRangeLabel = useMemo(() => {
        if (!alliance) return;
        return formatOnslaughtRewardRange(
            currentRarity,
            currentStars,
            onslaughtPreferences[alliance].sector,
            onslaughtPreferences[alliance].tier
        );
    }, [alliance, currentRarity, currentStars, onslaughtPreferences]);

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

            <div>
                <span className="text-sm text-gray-500">
                    Change your onslaught sector by going to input &gt; onslaught
                </span>
            </div>

            {currentStars < RarityStars.OneBlueStar && alliance && shardRangeLabel && (
                <div className="flex items-center gap-2 text-sm">
                    <OnslaughtIcon
                        sector={onslaughtPreferences[alliance].sector}
                        tier={onslaughtPreferences[alliance].tier}
                        size={50}
                    />
                    <span className="text-gray-500">Estimated shards per onslaught:</span>
                    <span className="font-medium">{shardRangeLabel}</span>
                </div>
            )}

            {targetRarity >= Rarity.Mythic && alliance && (
                <div className="flex items-center gap-2 text-sm">
                    <OnslaughtIcon
                        sector={onslaughtPreferences[alliance].sector}
                        tier={onslaughtPreferences[alliance].tier}
                        size={50}
                    />
                    <span className="text-gray-500">Estimated mythic shards per onslaught:</span>
                    <span className="font-medium text-purple-600">
                        {alliance
                            ? formatOnslaughtRewardRange(
                                  currentRarity,
                                  currentStars,
                                  onslaughtPreferences[alliance].sector,
                                  onslaughtPreferences[alliance].tier
                              )
                            : '—'}
                    </span>
                </div>
            )}

            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <label className="mb-1 block text-sm font-medium">Farm Type</label>
                    <Select
                        label="Farm Type"
                        value={farmType}
                        onChange={event => onChange('shardFarmType', event.target.value as ShardFarmType)}
                        fullWidth>
                        {SHARD_FARM_TYPE_VALUES.map(type => (
                            <MenuItem key={type} value={type}>
                                {type
                                    .split('_')
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                    .join(' ')}
                            </MenuItem>
                        ))}
                    </Select>
                </div>
            </div>
        </>
    );
};
