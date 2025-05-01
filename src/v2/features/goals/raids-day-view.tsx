import { Card, CardContent, CardHeader } from '@mui/material';
import React from 'react';

import { IDailyRaid } from 'src/models/interfaces';

import { IUpgradesRaidsDay } from 'src/v2/features/goals/goals.models';
import { MaterialItemView } from 'src/v2/features/goals/material-item-view';

interface Props {
    day: IUpgradesRaidsDay;
    title: string;
}

export const RaidsDayView: React.FC<Props> = ({ day, title }) => {
    return (
        <Card
            variant="outlined"
            sx={{
                minWidth: 300,
            }}>
            <CardHeader
                title={title}
                subheader={
                    <div className="flex-box column start">
                        <span>Energy used {day.energyTotal}</span>
                        <span>Raids count {day.raidsTotal}</span>
                    </div>
                }
            />
            <CardContent>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {day.raids.map((raid, index) => {
                        return (
                            <li key={raid.id + index}>
                                <MaterialItemView upgradeRaid={raid} />
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
        </Card>
    );
};
