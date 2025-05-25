import React, { useMemo } from 'react';

import { rarityToMaxStars, rarityToStars } from 'src/models/constants';
import { CampaignsLocationsUsage } from 'src/models/enums';
import { ICampaignBattleComposed, IPersonalGoal } from 'src/models/interfaces';
import { CampaignLocation } from 'src/shared-components/goals/campaign-location';
import { CampaignsUsageSelect } from 'src/shared-components/goals/campaigns-usage-select';
import { NumbersInput } from 'src/shared-components/goals/numbers-input';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { Rarity, RarityStars } from '@/fsd/5-shared/model';
import { RaritySelect, StarsSelect } from '@/fsd/5-shared/ui';

interface Props {
    currentRarity: Rarity;
    targetRarity: Rarity;
    currentStars: RarityStars;
    targetStars: RarityStars;
    possibleLocations: ICampaignBattleComposed[];
    unlockedLocations: string[];
    campaignsUsage: CampaignsLocationsUsage;
    shardsPerToken: number;
    onChange: (key: keyof IPersonalGoal, value: number) => void;
}

export const SetAscendGoal: React.FC<Props> = ({
    targetStars,
    targetRarity,
    currentStars,
    currentRarity,
    possibleLocations,
    unlockedLocations,
    campaignsUsage,
    shardsPerToken,
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

    return (
        <>
            <div className="flex gap-3 items-center">
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

            <div className="flex-box gap5 wrap">
                {possibleLocations.map(location => (
                    <CampaignLocation
                        key={location.id}
                        location={location}
                        unlocked={unlockedLocations.includes(location.id)}
                    />
                ))}
            </div>

            {!!possibleLocations.length && (
                <div className="flex gap-3 items-center">
                    <div style={{ width: '50%' }}>
                        <CampaignsUsageSelect
                            disabled={!unlockedLocations.length}
                            value={campaignsUsage ?? CampaignsLocationsUsage.LeastEnergy}
                            valueChange={value => onChange('campaignsUsage', value)}
                        />
                    </div>
                    <div style={{ width: '50%' }}>
                        <NumbersInput
                            title="Shards per onslaught"
                            helperText="Put 0 to ignore Onslaught raids"
                            value={shardsPerToken}
                            valueChange={value => onChange('shardsPerToken', value)}
                        />
                    </div>
                </div>
            )}

            {!possibleLocations.length && (
                <div className="flex-box gap10 full-width">
                    <NumbersInput
                        title="Shards per onslaught"
                        helperText="You should put more than 0 to be able to create the goal"
                        value={shardsPerToken}
                        valueChange={value => onChange('shardsPerToken', value)}
                    />
                </div>
            )}
        </>
    );
};
