import React from 'react';
import './App.css';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import ButtonAppBar from './AppBar/AppBar';

import GlobalStoreService from './store/global-store.service';
import LegendaryEvent from './components/legendary-event/legendary-event';
import { JainZarLegendaryEvent } from './store/legendary-events/jain-zar.le';
import WhoYouOwn from './components/who-you-own/who-you-own';


const App = () => {
    GlobalStoreService.init();

    const le = new JainZarLegendaryEvent(GlobalStoreService.characters);

    return (
        <div>
            <ButtonAppBar></ButtonAppBar>
            <WhoYouOwn></WhoYouOwn>
            <h3>Jain Zair alpha</h3>
            <LegendaryEvent input={le}></LegendaryEvent>
        </div>

    );

};

export default App;
