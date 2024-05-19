import React from 'react';
import { CampaignType, Rarity } from 'src/models/enums';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import Checkbox from '@mui/material/Checkbox';
import { ICustomDailyRaidsSettings } from 'src/models/interfaces';
import { uniq } from 'lodash';

interface Props {
    settings: ICustomDailyRaidsSettings;
    settingsChange: (value: ICustomDailyRaidsSettings) => void;
}

export const DailyRaidsCustomLocations: React.FC<Props> = ({ settings, settingsChange }) => {
    const rarities: Rarity[] = [Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Uncommon, Rarity.Common];

    const handleChange = (rarity: Rarity, checked: boolean, campaignTypes: CampaignType[]) => {
        const currentValue = settings[rarity];
        settingsChange({
            ...settings,
            [rarity]: checked
                ? uniq([...currentValue, ...campaignTypes])
                : currentValue.filter(x => !campaignTypes.includes(x)),
        });
    };

    return (
        <div className="flex-box">
            <div className="flex-box column">
                <div style={{ height: 24 }} className="flex-box"></div>
                <div style={{ height: 42 }} className="flex-box">
                    Elite
                </div>
                <div style={{ height: 42 }} className="flex-box">
                    Mirror
                </div>
                <div style={{ height: 42 }} className="flex-box">
                    Normal
                </div>
            </div>
            <div className="flex-box">
                {rarities.map(rarity => {
                    const value = settings[rarity];
                    return (
                        <div key={rarity} className="flex-box column">
                            <RarityImage rarity={rarity} />
                            <Checkbox
                                disabled={!value.includes(CampaignType.Mirror) && !value.includes(CampaignType.Normal)}
                                checked={value.includes(CampaignType.Elite)}
                                onChange={event =>
                                    handleChange(rarity, event.target.checked, [CampaignType.Elite, CampaignType.Early])
                                }
                            />
                            <Checkbox
                                disabled={!value.includes(CampaignType.Elite) && !value.includes(CampaignType.Normal)}
                                checked={value.includes(CampaignType.Mirror)}
                                onChange={event => handleChange(rarity, event.target.checked, [CampaignType.Mirror])}
                            />
                            <Checkbox
                                disabled={!value.includes(CampaignType.Mirror) && !value.includes(CampaignType.Elite)}
                                checked={value.includes(CampaignType.Normal)}
                                onChange={event => handleChange(rarity, event.target.checked, [CampaignType.Normal])}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
