import React, { useState } from 'react';
import { useCharacters, usePersonalData } from '../../services';
import Box from '@mui/material/Box';
import { Tab, Tabs } from '@mui/material';
import { ILegendaryEvent } from '../../models/interfaces';
import { AunShiLegendaryEvent, JainZarLegendaryEvent, ShadowSunLegendaryEvent } from '../../models/legendary-events';
import { LegendaryEvent } from './legendary-event';
import AutoTeamsSettings from '../../routes/legendary-events/auto-teams-settings';
import { AutoTeamsSettingsContext } from '../../contexts';
import { SetGoalDialog } from '../../shared-components/goals/set-goal-dialog';

export const LegendaryEvents = () => {
    const [value, setValue] = React.useState(0);
    const { characters } = useCharacters();
    const { personalData, updateAutoTeamsSettings } = usePersonalData();
    const [legendaryEvent, setLegendaryEvent] = React.useState<ILegendaryEvent>(new ShadowSunLegendaryEvent(characters));
    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const [autoTeamsPreferences, setAutoTeamsPreferences] = useState(personalData.autoTeamsPreferences);
    
    return (
        <Box sx={{ bgcolor: 'background.paper' }}>
            <Tabs
                value={value}
                onChange={handleChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="scrollable auto tabs example"
            >
                <Tab label="Shadowsun 2/3 (Oct 15)" onClick={() => setLegendaryEvent(new ShadowSunLegendaryEvent(characters))}/>
                <Tab label="Aun'Shi"  onClick={() => setLegendaryEvent(new AunShiLegendaryEvent(characters))}/>
                <Tab label="Jain Zar" onClick={() => setLegendaryEvent(new JainZarLegendaryEvent(characters))} />
            </Tabs>
            <div style={{ marginInlineStart: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <AutoTeamsSettings value={autoTeamsPreferences} valueChanges={value => {
                        setAutoTeamsPreferences(value);
                        updateAutoTeamsSettings(value);
                    }}></AutoTeamsSettings>
                    <SetGoalDialog/>
                </div>
            </div>
            <AutoTeamsSettingsContext.Provider value={autoTeamsPreferences}>
                <LegendaryEvent legendaryEvent={legendaryEvent}/>
            </AutoTeamsSettingsContext.Provider>
        </Box>
    );
};
