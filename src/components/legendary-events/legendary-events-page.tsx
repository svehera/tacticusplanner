import React from 'react';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import GlobalStoreService from '../../store/global-store.service';
import { JainZarLegendaryEvent } from '../../store/legendary-events/jain-zar.le';
import LegendaryEvent from '../legendary-event/legendary-event';
import Typography from '@mui/material/Typography';


const LegendaryEventPage = () => {

    const jainZarLegendaryEvent = new JainZarLegendaryEvent(GlobalStoreService.characters);

    return (
        <div>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
                Jain Zar
            </Typography>
            <LegendaryEvent input={jainZarLegendaryEvent}/>
        </div>

    );

};

export default LegendaryEventPage;
