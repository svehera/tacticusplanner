import React, { useEffect, useState } from 'react';
import { GlobalService, PersonalDataService } from '../../services';
import Box from '@mui/material/Box';
import { Tab, Tabs } from '@mui/material';
import { ILegendaryEvent } from '../../models/interfaces';
import { AunShiLegendaryEvent, JainZarLegendaryEvent, ShadowSunLegendaryEvent } from '../../models/legendary-events';
import { LegendaryEvent } from './legendary-event';
import AutoTeamsSettings from '../../routes/legendary-events/auto-teams-settings';

export const LegendaryEvents = () => {
    const [value, setValue] = React.useState(0);
    const [legendaryEvent, setLegendaryEvent] = React.useState<ILegendaryEvent>(new JainZarLegendaryEvent(GlobalService.characters, PersonalDataService.data.legendaryEvents.jainZar.selectedTeams));
    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const [autoTeamsPreferences, setAutoTeamsPreferences] = useState(PersonalDataService.data.autoTeamsPreferences);

    useEffect(() => {
        PersonalDataService.data.autoTeamsPreferences = autoTeamsPreferences;
        PersonalDataService.save();
    }, [autoTeamsPreferences]);
    
    return (
        <Box sx={{ maxWidth: 600, bgcolor: 'background.paper' }}>
            <Tabs
                value={value}
                onChange={handleChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="scrollable auto tabs example"
            >
                <Tab label="Jain Zar" onClick={() => setLegendaryEvent(new JainZarLegendaryEvent(GlobalService.characters, PersonalDataService.data.legendaryEvents.jainZar.selectedTeams))} />
                <Tab label="Aun'Shi"  onClick={() => setLegendaryEvent(new AunShiLegendaryEvent(GlobalService.characters, PersonalDataService.data.legendaryEvents.aunShi.selectedTeams))}/>
                <Tab label="Shadowsun" onClick={() => setLegendaryEvent(new ShadowSunLegendaryEvent(GlobalService.characters, PersonalDataService.data.legendaryEvents.shadowSun.selectedTeams))}/>
            </Tabs>
            <div style={{ marginInlineStart: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <AutoTeamsSettings value={autoTeamsPreferences} valueChanges={setAutoTeamsPreferences}></AutoTeamsSettings>
                </div>
            </div>
            <LegendaryEvent legendaryEvent={legendaryEvent}/>
        </Box>
    );
};
