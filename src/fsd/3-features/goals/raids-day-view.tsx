import { Card, CardContent, CardHeader } from '@mui/material';
import React from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IUpgradesRaidsDay } from '@/fsd/3-features/goals/goals.models';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MaterialItemView } from '@/fsd/3-features/goals/material-item-view';

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
                <ul className="p-0 list-none">
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
