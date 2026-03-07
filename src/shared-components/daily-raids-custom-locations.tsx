import Checkbox from '@mui/material/Checkbox';
import { uniq } from 'lodash';
import React, { useMemo } from 'react';

import { ICustomDailyRaidsSettings } from 'src/models/interfaces';

import { Rarity } from '@/fsd/5-shared/model';
import { MiscIcon } from '@/fsd/5-shared/ui/icons/misc.icon';
import { RarityIcon } from '@/fsd/5-shared/ui/icons/rarity.icon';

import { CampaignType } from '@/fsd/4-entities/campaign';

interface Properties {
    hasCE: boolean;
    settings: ICustomDailyRaidsSettings;
    settingsChange: (value: ICustomDailyRaidsSettings) => void;
}

export const DailyRaidsCustomLocations: React.FC<Properties> = ({ settings, settingsChange, hasCE }) => {
    const rarities: Array<Rarity | 'Shard' | 'Mythic Shard'> = [
        'Mythic Shard',
        'Shard',
        Rarity.Mythic,
        Rarity.Legendary,
        Rarity.Epic,
        Rarity.Rare,
        Rarity.Uncommon,
        Rarity.Common,
    ];

    const handleChange = (
        rarity: Rarity | 'Shard' | 'Mythic Shard',
        checked: boolean,
        campaignTypes: CampaignType[]
    ) => {
        const currentValue = settings[rarity] ?? [
            CampaignType.Normal,
            CampaignType.Early,
            CampaignType.Mirror,
            CampaignType.Elite,
            CampaignType.Standard,
            CampaignType.Extremis,
        ];
        settingsChange({
            ...settings,
            [rarity]: checked
                ? uniq([...currentValue, ...campaignTypes])
                : currentValue.filter(x => !campaignTypes.includes(x)),
        });
    };

    const campaignTypes = useMemo(() => {
        const defaultList = [
            CampaignType.Extremis,
            CampaignType.Elite,
            CampaignType.Early,
            CampaignType.Standard,
            CampaignType.Mirror,
            CampaignType.Normal,
        ];
        if (!hasCE) {
            return defaultList;
        }

        return [...defaultList];
    }, [hasCE]);

    const campaignLabels: Partial<Record<CampaignType, string>> = {
        [CampaignType.Early]: 'Indomitus 15-29',
        [CampaignType.Elite]: 'Elite',
        [CampaignType.Mirror]: 'Mirror',
        [CampaignType.Normal]: 'Normal',
        [CampaignType.Standard]: 'Standard CE',
        [CampaignType.Extremis]: 'Extremis CE',
    };

    const isRarity = (value: Rarity | 'Shard' | 'Mythic Shard'): value is Rarity => {
        return Object.values(Rarity).includes(value as Rarity);
    };

    return (
        <div className="flex">
            <div className="flex flex-col">
                <div className="h-6"></div>
                {campaignTypes.map(type => (
                    <div key={type} className="flex h-[42px] items-center justify-center font-medium">
                        {campaignLabels[type]}
                    </div>
                ))}
            </div>

            <div className="flex">
                {rarities.map(rarity => {
                    const value = settings[rarity] ?? [
                        CampaignType.Normal,
                        CampaignType.Early,
                        CampaignType.Mirror,
                        CampaignType.Elite,
                        CampaignType.Standard,
                        CampaignType.Extremis,
                    ];

                    return (
                        <div key={rarity} className="mx-2 flex flex-col items-center">
                            {rarity === 'Shard' && <MiscIcon icon="shard" height={26} width={-1} />}
                            {rarity === 'Mythic Shard' && <MiscIcon icon="mythicShard" height={26} width={-1} />}
                            {isRarity(rarity) && <RarityIcon rarity={rarity} />}
                            {campaignTypes.map(type => (
                                <div
                                    key={type}
                                    className="flex min-h-[42px] min-w-[42px] flex-col justify-center gap-3">
                                    <Checkbox
                                        className="mt-2"
                                        checked={value.includes(type)}
                                        onChange={event => handleChange(rarity, event.target.checked, [type])}
                                    />
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
