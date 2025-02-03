import React from 'react';
import { RaidItemInput } from 'src/v2/features/goals/raid-item-input';
import { IUpgradeRaid, IItemRaidLocation } from 'src/v2/features/goals/goals.models';
import { UpgradeImage } from 'src/shared-components/upgrade-image';
import Button from '@mui/material/Button';
import { CampaignLocation } from 'src/shared-components/goals/campaign-location';

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
                    rarity={upgradeRaid.rarity}
                    iconPath={upgradeRaid.iconPath}
                    tooltip={
                        <div>
                            {upgradeRaid.label}
                            <ul style={{ paddingInlineStart: 15 }}>
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
                    <Button size="small" className="item-quantity-button" onClick={decrement}>
                        -
                    </Button>
                    <Button size="small" className="item-quantity-button" onClick={increment}>
                        +
                    </Button>
                </div>
            </div>
            <ul style={{ width: '100%', paddingInlineStart: 15 }}>
                {upgradeRaid.raidLocations.map(location => {
                    const maxObtained = Math.round(location.farmedItems);
                    const defaultItemsObtained =
                        maxObtained + acquiredCount > upgradeRaid.requiredCount
                            ? upgradeRaid.requiredCount - acquiredCount
                            : maxObtained;

                    return (
                        <li
                            key={location.id}
                            className="flex-box between"
                            style={{
                                opacity: location.isCompleted ? 0.5 : 1,
                            }}>
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
