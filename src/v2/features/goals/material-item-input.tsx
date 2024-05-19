import React from 'react';
import { RaidItemView } from 'src/v2/features/goals/raid-item-view';
import { RaidItemInput } from 'src/v2/features/goals/raid-item-input';
import { MaterialItemTitle } from 'src/v2/features/goals/material-item-title';
import { IUpgradeRaid, IItemRaidLocation } from 'src/v2/features/goals/goals.models';
import { UpgradeImage } from 'src/shared-components/upgrade-image';

interface Props {
    acquiredCount: number;
    upgradeRaid: IUpgradeRaid;
    addCount: (count: number, location: IItemRaidLocation) => void;
}

export const MaterialItemInput: React.FC<Props> = ({ upgradeRaid, acquiredCount, addCount }) => {
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
                            <RaidItemView location={location} />
                            <RaidItemInput
                                defaultItemsObtained={defaultItemsObtained}
                                isDisabled={location.isCompleted || upgradeRaid.isBlocked}
                                addCount={value => {
                                    location.isCompleted = true;
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
