import React from 'react';
import { Card, CardContent, CardHeader } from '@mui/material';
import { IDailyRaid, IMaterialRaid, IRaidLocation } from 'src/models/interfaces';
import { MaterialItemInput } from 'src/v2/features/goals/material-item-input';

interface Props {
    day: IDailyRaid;
    completedLocations: IRaidLocation[];
    handleAdd: (materialId: IMaterialRaid, value: number, location: IRaidLocation) => void;
}

export const RaidsDayInput: React.FC<Props> = ({ day, handleAdd, completedLocations }) => {
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
                    {day.raids.map((raid, index) => {
                        return (
                            <li key={raid.materialId + index}>
                                <MaterialItemInput
                                    acquiredCount={raid.materialRef?.quantity ?? 0}
                                    materialRaid={raid}
                                    completedLocations={completedLocations}
                                    addCount={(value, location) => {
                                        if (raid.materialRef) {
                                            raid.materialRef.quantity += value;
                                        }
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
