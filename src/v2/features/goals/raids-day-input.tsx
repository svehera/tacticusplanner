import React from 'react';
import { Card, CardContent, CardHeader } from '@mui/material';
import { MaterialItemInput } from 'src/v2/features/goals/material-item-input';
import { IUpgradeRaid, IItemRaidLocation, IUpgradesRaidsDay } from 'src/v2/features/goals/goals.models';

interface Props {
    day: IUpgradesRaidsDay;
    handleAdd: (materialId: IUpgradeRaid, value: number, location: IItemRaidLocation) => void;
}

export const RaidsDayInput: React.FC<Props> = ({ day, handleAdd }) => {
    return (
        <Card
            sx={{
                minWidth: 300,
            }}>
            <CardHeader
                title={'Today'}
                subheader={
                    <div className="flex-box column start">
                        <span>Energy used {day.energyTotal}</span>
                        <span>Raids total {day.raidsTotal}</span>
                    </div>
                }
            />
            <CardContent>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {day.raids.map((raid, index) => {
                        return (
                            <li key={raid.id + index}>
                                <MaterialItemInput
                                    acquiredCount={raid.acquiredCount ?? 0}
                                    upgradeRaid={raid}
                                    addCount={(value, location) => {
                                        raid.acquiredCount += value;
                                        handleAdd(raid, value, location);
                                    }}
                                />
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
        </Card>
    );
};
