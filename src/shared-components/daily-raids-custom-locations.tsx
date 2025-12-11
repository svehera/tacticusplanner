import { Info } from '@mui/icons-material';
import { Badge, FormControlLabel, Switch } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import { uniq } from 'lodash';
import React, { useMemo, useState } from 'react';

import { ICustomDailyRaidsSettings } from 'src/models/interfaces';

import { Rarity } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { RarityIcon } from '@/fsd/5-shared/ui/icons/rarity.icon';

import { CampaignType, CampaignsService } from '@/fsd/4-entities/campaign';

interface Props {
    hasCE: boolean;
    settings: ICustomDailyRaidsSettings;
    settingsChange: (value: ICustomDailyRaidsSettings) => void;
}

export const DailyRaidsCustomLocations: React.FC<Props> = ({ settings, settingsChange, hasCE }) => {
    const [showDroprates, setShowDroprates] = useState<boolean>(false);
    const rarities: Rarity[] = [
        Rarity.Mythic,
        Rarity.Legendary,
        Rarity.Epic,
        Rarity.Rare,
        Rarity.Uncommon,
        Rarity.Common,
    ];

    const handleChange = (rarity: Rarity, checked: boolean, campaignTypes: CampaignType[]) => {
        const currentValue = settings[rarity];
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

    return (
        <div className="flex">
            <div className="flex flex-col">
                <div className="h-6">
                    <FormControlLabel
                        control={<Switch value={showDroprates} onChange={(_, checked) => setShowDroprates(checked)} />}
                        label={
                            <div className="flex items-center text-fg">
                                <span>Show Rates&nbsp;</span>
                                <AccessibleTooltip title={'Energy conversion efficiency per 1 energy used'}>
                                    <Info color="primary" />
                                </AccessibleTooltip>
                            </div>
                        }
                    />
                </div>
                {campaignTypes.map(type => (
                    <div key={type} className="h-[42px] flex items-center justify-center font-medium">
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
                        <div key={rarity} className="flex flex-col items-center mx-2">
                            <RarityIcon rarity={rarity} />
                            {campaignTypes.map(type => (
                                <div
                                    key={type}
                                    className="flex flex-col gap-3 min-h-[42px] min-w-[42px] justify-center">
                                    {!showDroprates ? (
                                        <Checkbox
                                            className="mt-2"
                                            checked={value.includes(type)}
                                            onChange={event => handleChange(rarity, event.target.checked, [type])}
                                        />
                                    ) : (
                                        <Badge
                                            className="cursor-pointer"
                                            badgeContent="✓"
                                            invisible={!value.includes(type)}
                                            color="primary"
                                            onClick={() => handleChange(rarity, !value.includes(type), [type])}>
                                            <span>{CampaignsService.getItemAcquiredPerEnergyUsed(type, rarity)}</span>
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
