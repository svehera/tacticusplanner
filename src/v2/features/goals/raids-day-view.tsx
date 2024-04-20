import React from 'react';
import { Card, CardContent, CardHeader } from '@mui/material';
import { IDailyRaid } from 'src/models/interfaces';
import { MaterialItemView } from 'src/v2/features/goals/material-item-view';

interface Props {
    day: IDailyRaid;
    title: string;
}

export const RaidsDayView: React.FC<Props> = ({ day, title }) => {
    return (
        <Card
            sx={{
                minWidth: 300,
            }}>
            <CardHeader title={title} subheader={'Energy left ' + day.energyLeft} />
            <CardContent>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {day.raids.map((raid, index) => {
                        return (
                            <li key={raid.materialId + index}>
                                <MaterialItemView materialRaid={raid} />
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
        </Card>
    );
};
