import React, { useContext, useState } from 'react';
import Box from '@mui/material/Box';
import { Tab, Tabs } from '@mui/material';
import { ILegendaryEvent } from '../../models/interfaces';
import { AunShiLegendaryEvent, ShadowSunLegendaryEvent } from '../../models/legendary-events';
import { LegendaryEvent } from './legendary-event';
import AutoTeamsSettings from '../../routes/legendary-events/auto-teams-settings';
import { SetGoalDialog } from '../../shared-components/goals/set-goal-dialog';
import { MyProgressDialog } from '../../routes/legendary-events/my-progress-dialog';
import { getDefaultLE } from '../../models/constants';
import { StoreContext } from '../../reducers/store.provider';

export const LegendaryEvents = () => {
    const [value, setValue] = useState(0);
    const { characters, goals } = useContext(StoreContext);
    const [legendaryEvent, setLegendaryEvent] = useState<ILegendaryEvent>(() => getDefaultLE(characters));
    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ bgcolor: 'background.paper' }}>
            <Tabs
                value={value}
                onChange={handleChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="scrollable auto tabs example">
                <Tab
                    label="Shadowsun 2/3 (Oct 15)"
                    onClick={() => setLegendaryEvent(new ShadowSunLegendaryEvent(characters))}
                />
                <Tab label="Aun'Shi" onClick={() => setLegendaryEvent(new AunShiLegendaryEvent(characters))} />
            </Tabs>
            <div style={{ marginInlineStart: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <AutoTeamsSettings />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, margin: '10px 0' }}>
                        <SetGoalDialog key={goals.length} />
                        <MyProgressDialog legendaryEvent={legendaryEvent} />
                    </div>
                </div>
            </div>
            <LegendaryEvent legendaryEvent={legendaryEvent} />
        </Box>
    );
};
