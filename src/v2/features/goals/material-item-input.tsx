import { IMaterialRaid, IRaidLocation } from 'src/models/interfaces';
import React, { useMemo } from 'react';
import { RaidItemView } from 'src/v2/features/goals/raid-item-view';
import { RaidItemInput } from 'src/v2/features/goals/raid-item-input';
import { MaterialItemTitle } from 'src/v2/features/goals/material-item-title';

interface Props {
    acquiredCount: number;
    materialRaid: IMaterialRaid;
    completedLocations: IRaidLocation[];
    addCount: (count: number, location: IRaidLocation) => void;
}

export const MaterialItemInput: React.FC<Props> = ({ materialRaid, completedLocations, acquiredCount, addCount }) => {
    const isAllLocationsBlocked =
        !!materialRaid.materialRef &&
        materialRaid.materialRef.locationsString === materialRaid.materialRef.missingLocationsString;

    const isAllRaidsCompleted = useMemo(
        () =>
            materialRaid.locations.every(location =>
                completedLocations.some(completedLocation => completedLocation.id === location.id)
            ),
        [completedLocations]
    );

    return (
        <div style={{ opacity: isAllRaidsCompleted || isAllLocationsBlocked ? 0.5 : 1 }}>
            <MaterialItemTitle materialRaid={materialRaid} />
            <ul style={{ paddingInlineStart: 15 }}>
                {materialRaid.locations.map(location => {
                    const isLocationCompleted = completedLocations.some(
                        completedLocation => completedLocation.id === location.id
                    );

                    const maxObtained = Math.round(location.farmedItems);
                    const defaultItemsObtained =
                        maxObtained + acquiredCount > materialRaid.totalCount
                            ? materialRaid.totalCount - acquiredCount
                            : maxObtained;

                    return (
                        <li
                            key={location.campaign + location.battleNumber}
                            className="flex-box gap5"
                            style={{
                                justifyContent: 'space-between',
                                opacity: isLocationCompleted ? 0.5 : 1,
                            }}>
                            <RaidItemView location={location} />
                            <RaidItemInput
                                defaultItemsObtained={defaultItemsObtained}
                                acquiredCount={acquiredCount}
                                requiredCount={materialRaid.totalCount}
                                isDisabled={isLocationCompleted || isAllLocationsBlocked}
                                addCount={value => addCount(value, location)}
                            />
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
