import React, { useEffect, useState } from 'react';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import GlobalStoreService from '../../store/global-store.service';
import { JainZarLegendaryEvent } from '../../store/legendary-events/jain-zar.le';
import LegendaryEvent from '../legendary-event/legendary-event';
import Typography from '@mui/material/Typography';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ViewSettings from '../view-settings/view-settings';
import { ViewSettingsContext } from '../../contexts/view-settings.context';
import { PersonalDataService } from '../../store/personal-data/personal-data.service';
import { update } from 'lodash';
import { ICharacter, ITableRow } from '../../store/static-data/interfaces';
import { AunShiLegendaryEvent } from '../../store/legendary-events/aun-shi.le';
import { ShadowSunLegendaryEvent } from '../../store/legendary-events/shadow-sun.le';
import OverallPointsTable from '../overall-points-table/overall-points-table';


const LegendaryEventPage = () => {
    const [characters, setCharacters] = useState(GlobalStoreService.characters);
    
    const jainZarLegendaryEvent = new JainZarLegendaryEvent(characters, PersonalDataService.data.legendaryEvents.jainZar.selectedTeams);
    const aunShiLegendaryEvent = new AunShiLegendaryEvent(characters, PersonalDataService.data.legendaryEvents.aunShi.selectedTeams);
    const shadowSunLegendaryEvent = new ShadowSunLegendaryEvent(characters, PersonalDataService.data.legendaryEvents.shadowSun.selectedTeams);
    
    const [viewPreferences, setViewPreferences] = useState(PersonalDataService.data.viewPreferences);
    

    useEffect(() => {
        PersonalDataService.data.viewPreferences = viewPreferences;
        PersonalDataService.save();
    }, [viewPreferences]);


    const updateJainZarEventTeams = (selectedTeams: Array<ITableRow>) => {
        PersonalDataService.data.legendaryEvents.jainZar.selectedTeams = selectedTeams;
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
        PersonalDataService.data.legendaryEvents.aunShi.selectedTeams = selectedTeams;
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
        PersonalDataService.data.legendaryEvents.shadowSun.selectedTeams = selectedTeams;
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

    return (
        <div>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
                Legendary Events
            </Typography>
            <ViewSettings value={viewPreferences} valueChanges={setViewPreferences}></ViewSettings>
            <ViewSettingsContext.Provider value={viewPreferences}>
                <Accordion >
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                    >
                        <Typography>Jain Zar 3/3 (September 10)</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        
                        <LegendaryEvent legendaryEvent={jainZarLegendaryEvent}
                            selectedTeamsChange={updateJainZarEventTeams}/>
                    </AccordionDetails>
                </Accordion>
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                    >
                        <Typography>Aun Shi 3/3 (TBA)</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <LegendaryEvent legendaryEvent={aunShiLegendaryEvent}
                            selectedTeamsChange={updateAunShiEventTeams}/>
                    </AccordionDetails>
                </Accordion>

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                    >
                        <Typography>Shadowsun 2/3 (TBA)</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <LegendaryEvent legendaryEvent={shadowSunLegendaryEvent}
                            selectedTeamsChange={updateShadowSunEventTeams}/>
                    </AccordionDetails>
                </Accordion>

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                    >
                        <Typography>Overall Best Characters</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <OverallPointsTable characters={characters}/>
                    </AccordionDetails>
                </Accordion>
            </ViewSettingsContext.Provider>
        </div>

    );

};

export default LegendaryEventPage;
