import React, { useEffect, useState } from 'react';
import { cloneDeep, uniqBy } from 'lodash';

import Typography from '@mui/material/Typography';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { ViewSettingsContext, AutoTeamsSettingsContext } from '../../contexts';
import { GlobalService, PersonalDataService } from '../../services';
import { AunShiLegendaryEvent, JainZarLegendaryEvent, ShadowSunLegendaryEvent } from '../../models/legendary-events';
import { ICharacter, ITableRow } from '../../models/interfaces';

import LegendaryEvent from './legendary-event';
import ViewSettings from './view-settings';
import AutoTeamsSettings from './auto-teams-settings';
import OverallPointsTable from './overall-points-table';

export const LegendaryEventPage = () => {
    const [characters, setCharacters] = useState(GlobalService.characters);
    
    const jainZarLegendaryEvent = new JainZarLegendaryEvent(characters, mapSelectedTeams(PersonalDataService.data.legendaryEvents.jainZar.selectedTeams));
    const aunShiLegendaryEvent = new AunShiLegendaryEvent(characters, mapSelectedTeams(PersonalDataService.data.legendaryEvents.aunShi.selectedTeams));
    const shadowSunLegendaryEvent = new ShadowSunLegendaryEvent(characters, mapSelectedTeams(PersonalDataService.data.legendaryEvents.shadowSun.selectedTeams));
    
    const [viewPreferences, setViewPreferences] = useState(PersonalDataService.data.viewPreferences);
    const [autoTeamsPreferences, setAutoTeamsPreferences] = useState(PersonalDataService.data.autoTeamsPreferences);
    

    useEffect(() => {
        PersonalDataService.data.viewPreferences = viewPreferences;
        PersonalDataService.save();
    }, [viewPreferences]);

    useEffect(() => {
        PersonalDataService.data.autoTeamsPreferences = autoTeamsPreferences;
        PersonalDataService.save();
    }, [autoTeamsPreferences]);


    const updateJainZarEventTeams = (selectedTeams: Array<ITableRow>) => {
        PersonalDataService.data.legendaryEvents.jainZar.selectedTeams = selectedTeams.map(row => {
            const newRow: ITableRow<string> = {};
            for (const rowKey in row) {
                const value = row[rowKey];
                newRow[rowKey] = typeof value !== 'string' ? value.name : value;
            }
            return newRow;
        });
        const selectedChars = selectedTeams
            .flatMap(row => Object.values(row))
            .filter(value => typeof value !== 'string')
            .map(char  => (char as ICharacter).name);
        
        PersonalDataService.data.characters.forEach(char => {
            if(selectedChars.includes(char.name)) {
                char.leSelection |= jainZarLegendaryEvent.id;
            } else  {
                char.leSelection &= ~jainZarLegendaryEvent.id;
            }
        });
        
        PersonalDataService.save();
        setCharacters([...characters]);
    };

    const updateAunShiEventTeams = (selectedTeams: Array<ITableRow>) => {
        PersonalDataService.data.legendaryEvents.aunShi.selectedTeams = selectedTeams.map(row => {
            const newRow: ITableRow<string> = {};
            for (const rowKey in row) {
                const value = row[rowKey];
                newRow[rowKey] = typeof value !== 'string' ? value.name : value;
            }
            return newRow;
        });
        const selectedChars = selectedTeams
            .flatMap(row => Object.values(row))
            .filter(value => typeof value !== 'string')
            .map(char  => (char as ICharacter).name);

        PersonalDataService.data.characters.forEach(char => {
            if(selectedChars.includes(char.name)) {
                char.leSelection |= aunShiLegendaryEvent.id;
            } else  {
                char.leSelection &= ~aunShiLegendaryEvent.id;
            }
        });

        PersonalDataService.save();
    };

    const updateShadowSunEventTeams = (selectedTeams: Array<ITableRow>) => {
        PersonalDataService.data.legendaryEvents.shadowSun.selectedTeams = selectedTeams.map(row => {
            const newRow: ITableRow<string> = {};
            for (const rowKey in row) {
                const value = row[rowKey];
                newRow[rowKey] = typeof value !== 'string' ? value.name : value;
            }
            return newRow;
        });
        const selectedChars = selectedTeams
            .flatMap(row => Object.values(row))
            .filter(value => typeof value !== 'string')
            .map(char  => (char as ICharacter).name);

        PersonalDataService.data.characters.forEach(char => {
            if(selectedChars.includes(char.name)) {
                char.leSelection |= shadowSunLegendaryEvent.id;
            } else  {
                char.leSelection &= ~shadowSunLegendaryEvent.id;
            }
        });

        PersonalDataService.save();
    };
    
    function mapSelectedTeams(teams: ITableRow[]): ITableRow<ICharacter | ''>[] {
        return teams.map(row => {
            const newRow: ITableRow<ICharacter | ''> = {};
            for (const rowKey in row) {
                const value = row[rowKey];
                if(!value) {
                    newRow[rowKey] = '';
                } else {
                    if (typeof value === 'string') {
                        newRow[rowKey] = characters.find(char => char.name === value) ?? '';
                    } else {
                        newRow[rowKey] = value;
                    }
                }
            }
            return newRow;
        });
    }
    
    const jainZarSelectedTeamsPoints = jainZarLegendaryEvent.getSelectedCharactersPoints();
    const aunShiSelectedTeamsPoints = aunShiLegendaryEvent.getSelectedCharactersPoints();
    const shadowSunSelectedTeamsPoints = shadowSunLegendaryEvent.getSelectedCharactersPoints();

    
    const result = uniqBy(cloneDeep([...jainZarSelectedTeamsPoints, ...aunShiSelectedTeamsPoints, ...shadowSunSelectedTeamsPoints]), 'name');
    result.forEach(x => {
        x.points = 0;
        x.timesSelected = 0;
        jainZarSelectedTeamsPoints.forEach(char => {
            if (x.name === char.name) {
                x.points += char.points;
                x.timesSelected += char.timesSelected;
            }
        });

        aunShiSelectedTeamsPoints.forEach(char => {
            if (x.name === char.name) {
                x.points += char.points;
                x.timesSelected += char.timesSelected;
            }
        });

        shadowSunSelectedTeamsPoints.forEach(char => {
            if (x.name === char.name) {
                x.points += char.points;
                x.timesSelected += char.timesSelected;
            }
        });
        
    });
    

    return (
        <div>
            <div style={{ marginInlineStart: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Typography fontWeight={700}>
                            View Settings:
                        </Typography>
                        <ViewSettings value={viewPreferences} valueChanges={setViewPreferences}></ViewSettings>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Typography fontWeight={700}>
                            Auto-Teams settings:
                        </Typography>
                        <AutoTeamsSettings value={autoTeamsPreferences} valueChanges={setAutoTeamsPreferences}></AutoTeamsSettings>
                    </div>
                </div>
            </div>
            <ViewSettingsContext.Provider value={viewPreferences}>
                <AutoTeamsSettingsContext.Provider value={autoTeamsPreferences}>
                    <Accordion TransitionProps={{ unmountOnExit: true }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                        >
                            <Typography>Jain Zar 3/3 (September 10)</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            
                            <LegendaryEvent legendaryEvent={jainZarLegendaryEvent}
                                selectedTeamsChange={updateJainZarEventTeams}/>
                        </AccordionDetails>
                    </Accordion>
                    
                    <Accordion TransitionProps={{ unmountOnExit: true }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                        >
                            <Typography>Aun Shi 3/3 (TBA)</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <LegendaryEvent legendaryEvent={aunShiLegendaryEvent}
                                selectedTeamsChange={updateAunShiEventTeams}/>
                        </AccordionDetails>
                    </Accordion>
    
                    <Accordion TransitionProps={{ unmountOnExit: true }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                        >
                            <Typography>Shadowsun 2/3 (TBA)</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <LegendaryEvent legendaryEvent={shadowSunLegendaryEvent}
                                selectedTeamsChange={updateShadowSunEventTeams}/>
                        </AccordionDetails>
                    </Accordion>
    
                    <Accordion TransitionProps={{ unmountOnExit: true }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                        >
                            <Typography>Overall Best Characters</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <OverallPointsTable characters={characters} selectedChars={result}/>
                        </AccordionDetails>
                    </Accordion>
                </AutoTeamsSettingsContext.Provider>
            </ViewSettingsContext.Provider>
        </div>

    );

};
