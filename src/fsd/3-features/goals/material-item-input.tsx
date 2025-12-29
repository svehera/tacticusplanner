import Button from '@mui/material/Button';
import React from 'react';

import { RarityMapper } from '@/fsd/5-shared/model';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CampaignLocation } from '@/fsd/4-entities/campaign/campaign-location';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { UpgradeImage } from '@/fsd/4-entities/upgrade/upgrade-image';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IUpgradeRaid, IItemRaidLocation } from '@/fsd/3-features/goals/goals.models';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { RaidItemInput } from '@/fsd/3-features/goals/raid-item-input';

interface Props {
    acquiredCount: number;
    upgradeRaid: IUpgradeRaid;
    addCount: (count: number, location: IItemRaidLocation) => void;
    increment: () => void;
    decrement: () => void;
}

export const MaterialItemInput: React.FC<Props> = ({ upgradeRaid, acquiredCount, addCount, increment, decrement }) => {
    const isAllRaidsCompleted = upgradeRaid.raidLocations.every(location => location.isCompleted);

    return (
        <div className="flex-box between" style={{ opacity: isAllRaidsCompleted ? 0.5 : 1 }}>
            <div className="flex-box column">
                <UpgradeImage
                    material={upgradeRaid.label}
                    iconPath={upgradeRaid.iconPath}
                    rarity={RarityMapper.rarityToRarityString(upgradeRaid.rarity)}
                    tooltip={
                        <div>
                            {upgradeRaid.label}
                            <ul className="ps-[15px]">
                                {upgradeRaid.relatedCharacters.map(x => (
                                    <li key={x}>{x}</li>
                                ))}
                            </ul>
                        </div>
                    }
                />
                <span>
                    {upgradeRaid.acquiredCount}/{upgradeRaid.requiredCount}
                </span>
                <div className="flex-box">
                    <Button size="small" className="w-[30px] !min-w-0" onClick={decrement}>
                        -
                    </Button>
                    <Button size="small" className="w-[30px] !min-w-0" onClick={increment}>
                        +
                    </Button>
                </div>
            </div>
            <ul className="w-full ps-[15px]">
                {upgradeRaid.raidLocations.map(location => {
                    const maxObtained = Math.round(location.farmedItems);
                    const defaultItemsObtained = Math.max(
                        maxObtained + acquiredCount > upgradeRaid.requiredCount
                            ? upgradeRaid.requiredCount - acquiredCount
                            : maxObtained,
                        0
                    );

                    return (
                        <li
                            key={location.id}
                            className="flex-box between"
                            style={{ opacity: location.isCompleted ? 0.5 : 1 }}>
                            <CampaignLocation location={location} unlocked={true} />
                            <RaidItemInput
                                defaultItemsObtained={defaultItemsObtained}
                                isDisabled={location.isCompleted || upgradeRaid.isBlocked}
                                addCount={value => {
                                    addCount(value, location);
                                }}
                            />
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
