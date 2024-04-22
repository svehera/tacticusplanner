import { IMaterialRaid } from 'src/models/interfaces';
import React from 'react';
import { RaidItemView } from 'src/v2/features/goals/raid-item-view';
import { MaterialItemTitle } from 'src/v2/features/goals/material-item-title';

interface Props {
    materialRaid: IMaterialRaid;
}

export const MaterialItemView: React.FC<Props> = ({ materialRaid }) => {
    const isAllLocationsBlocked =
        !!materialRaid.materialRef &&
        materialRaid.materialRef.locationsString === materialRaid.materialRef.missingLocationsString;

    return (
        <div style={{ opacity: isAllLocationsBlocked ? 0.5 : 1 }}>
            <MaterialItemTitle materialRaid={materialRaid} />
            <ul style={{ paddingInlineStart: 15 }}>
                {materialRaid.locations.map(location => {
                    return (
                        <li
                            key={location.campaign + location.battleNumber}
                            className="flex-box gap5"
                            style={{
                                justifyContent: 'space-between',
                            }}>
                            <RaidItemView location={location} />
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
