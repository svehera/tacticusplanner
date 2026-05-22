import { MenuItem, Select } from '@mui/material';
import React, { useMemo } from 'react';

import { rarityToMaxStars, rarityToStars } from 'src/models/constants';
import { ICampaignBattleComposed, SHARD_FARM_TYPE_VALUES, ShardFarmType } from 'src/models/interfaces';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { Alliance, Rarity, RarityStars } from '@/fsd/5-shared/model';
import { RaritySelect, StarsSelect } from '@/fsd/5-shared/ui';
import { OnslaughtIcon } from '@/fsd/5-shared/ui/icons';

import { ICharacterAscendGoal } from '@/fsd/3-features/goals/goals.models';

import {
    formatOnslaughtRewardRange,
    IOnslaughtPreferences,
    defaultOnslaughtPreferences,
} from '@/fsd/1-pages/input-onslaught/onslaught-rewards';

interface Props {
    goal: ICharacterAscendGoal;
    possibleLocations: ICampaignBattleComposed[];
    unlockedLocations: string[];
    possibleMythicLocations: ICampaignBattleComposed[];
    unlockedMythicLocations: string[];
    farmType: ShardFarmType;
    alliance?: Alliance;
    onslaughtPreferences?: IOnslaughtPreferences;
    onChange: (key: keyof ICharacterAscendGoal, value: number | ShardFarmType) => void;
}

export const EditAscendGoal: React.FC<Props> = ({
    goal,
    farmType,
    alliance,
    onslaughtPreferences = defaultOnslaughtPreferences,
    onChange,
}) => {
    const rarityValues = useMemo(() => {
        return getEnumValues(Rarity).filter(x => x >= goal.rarityStart);
    }, [goal.rarityStart]);

    const starsEntries = useMemo(() => {
        const maxStars = rarityToMaxStars[goal.rarityStart];
        return getEnumValues(RarityStars).filter(x => x >= goal.starsStart && x <= maxStars);
    }, [goal.starsStart, goal.rarityStart]);

    const starsTargetEntries = useMemo(() => {
        const minStars = rarityToStars[goal.rarityEnd];
        const maxStars = rarityToMaxStars[goal.rarityEnd];
        return getEnumValues(RarityStars).filter(x => x >= minStars && x <= maxStars);
    }, [goal.rarityEnd]);

    console.log('goal:', goal);

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
                    value={goal.starsStart}
                    valueChanges={value => onChange('starsStart', value)}
                />
                <StarsSelect
                    label={'Target stars'}
                    starsValues={starsTargetEntries}
                    value={goal.starsEnd ?? starsTargetEntries[0]}
                    valueChanges={value => onChange('starsEnd', value)}
                />
            </div>

            <div>
                <span className="text-sm text-gray-500">
                    Change your onslaught sector by going to input &gt; onslaught
                </span>
            </div>

            {goal.starsStart < RarityStars.OneBlueStar && (
                <>
                    {alliance && (
                        <div className="flex items-center gap-2 text-sm">
                            <OnslaughtIcon
                                sector={onslaughtPreferences[alliance].sector}
                                tier={onslaughtPreferences[alliance].tier}
                                size={24}
                            />
                            <span className="text-gray-500">Estimated shards per onslaught:</span>
                            <span className="font-medium">
                                {formatOnslaughtRewardRange(
                                    goal.rarityStart,
                                    goal.starsStart,
                                    onslaughtPreferences[alliance].sector,
                                    onslaughtPreferences[alliance].tier
                                )}
                            </span>
                        </div>
                    )}
                </>
            )}

            {goal.starsStart >= RarityStars.OneBlueStar && (
                <>
                    {alliance && (
                        <div className="flex items-center gap-2 text-sm">
                            <OnslaughtIcon
                                sector={onslaughtPreferences[alliance].sector}
                                tier={onslaughtPreferences[alliance].tier}
                                size={24}
                            />
                            <span className="text-gray-500">Estimated mythic shards per onslaught:</span>
                            <span className="font-medium text-purple-600">
                                {formatOnslaughtRewardRange(
                                    Rarity.Legendary,
                                    RarityStars.OneBlueStar,
                                    onslaughtPreferences[alliance].sector,
                                    onslaughtPreferences[alliance].tier
                                )}
                            </span>
                        </div>
                    )}
                </>
            )}

            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <label className="mb-1 block text-sm font-medium">Farm Type</label>
                    <Select
                        label="Farm Type"
                        value={farmType}
                        onChange={event => onChange('farmType', event.target.value as ShardFarmType)}
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
