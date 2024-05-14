import React from 'react';
import { RaidItemView } from 'src/v2/features/goals/raid-item-view';
import { RaidItemInput } from 'src/v2/features/goals/raid-item-input';
import { MaterialItemTitle } from 'src/v2/features/goals/material-item-title';
import { IUpgradeRaid, IItemRaidLocation } from 'src/v2/features/goals/goals.models';

interface Props {
    acquiredCount: number;
    upgradeRaid: IUpgradeRaid;
    addCount: (count: number, location: IItemRaidLocation) => void;
}

export const MaterialItemInput: React.FC<Props> = ({ upgradeRaid, acquiredCount, addCount }) => {
    const isAllRaidsCompleted = upgradeRaid.raidLocations.every(location => location.isCompleted);

    return (
        <div style={{ opacity: isAllRaidsCompleted || upgradeRaid.isBlocked ? 0.5 : 1 }}>
            <MaterialItemTitle upgradeRaid={upgradeRaid} />
            <ul style={{ paddingInlineStart: 15 }}>
                {upgradeRaid.raidLocations.map(location => {
                    const maxObtained = Math.round(location.farmedItems);
                    const defaultItemsObtained =
                        maxObtained + acquiredCount > upgradeRaid.requiredCount
                            ? upgradeRaid.requiredCount - acquiredCount
                            : maxObtained;

                    return (
                        <li
                            key={location.id}
                            className="flex-box gap5"
                            style={{
                                justifyContent: 'space-between',
                                opacity: location.isCompleted ? 0.5 : 1,
                            }}>
                            <RaidItemView location={location} />
                            <RaidItemInput
                                defaultItemsObtained={defaultItemsObtained}
                                acquiredCount={acquiredCount}
                                requiredCount={upgradeRaid.requiredCount}
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
