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


const LegendaryEventPage = () => {

    const jainZarLegendaryEvent = new JainZarLegendaryEvent(GlobalStoreService.characters, PersonalDataService.data.legendaryEvents.jainZar.selectedTeams);
    const [viewPreferences, setViewPreferences] = useState(PersonalDataService.data.viewPreferences);

    useEffect(() => {
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
    };

    return (
        <div>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
                Legendary Events
            </Typography>
            <ViewSettings value={viewPreferences} valueChanges={setViewPreferences}></ViewSettings>
            <ViewSettingsContext.Provider value={viewPreferences}>
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}
                    >
                        <Typography>Jain Zar 3/3 (September 10)</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <LegendaryEvent legendaryEvent={jainZarLegendaryEvent}
                            selectedTeamsChange={updateJainZarEventTeams}/>
                    </AccordionDetails>
                </Accordion>
            </ViewSettingsContext.Provider>
        </div>

    );

};

export default LegendaryEventPage;
