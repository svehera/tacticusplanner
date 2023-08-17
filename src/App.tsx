import React from 'react';
import { Outlet } from 'react-router-dom';
import './App.css';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import ButtonAppBar from './AppBar/AppBar';

import GlobalStoreService from './store/global-store.service';


const App = () => {
    GlobalStoreService.init();

    // const le = new JainZarLegendaryEvent(GlobalStoreService.characters);

    return (
        <div>
            <ButtonAppBar></ButtonAppBar>
            <Outlet/>
        </div>

    );

};

export default App;
