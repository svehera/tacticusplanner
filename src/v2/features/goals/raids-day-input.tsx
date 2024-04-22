import React from 'react';
import { Card, CardContent, CardHeader } from '@mui/material';
import { IDailyRaid, IMaterialRaid, IRaidLocation } from 'src/models/interfaces';
import { MaterialItemInput } from 'src/v2/features/goals/material-item-input';

interface Props {
    day: IDailyRaid;
    completedLocations: IRaidLocation[];
    inventory: Record<string, number>;
    handleAdd: (materialId: IMaterialRaid, value: number, location: IRaidLocation) => void;
}

export const RaidsDayInput: React.FC<Props> = ({ day, handleAdd, inventory, completedLocations }) => {
    return (
        <Card
            sx={{
                minWidth: 300,
            }}>
            <CardHeader
                title={'Today'}
                subheader={
                    <div className="flex-box column start">
                        <span>Energy left {day.energyLeft}</span>
                        <span>Raids left {day.raidsCount}</span>
                    </div>
                }
            />
            <CardContent>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {day.raids.map(raid => {
                        const acquiredCount = inventory[raid.materialId] ?? 0;

                        return (
                            <li key={raid.materialId}>
                                <MaterialItemInput
                                    acquiredCount={acquiredCount}
                                    materialRaid={raid}
                                    completedLocations={completedLocations}
                                    addCount={(value, location) => handleAdd(raid, value, location)}
                                />
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
        </Card>
    );
};
