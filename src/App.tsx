import React from 'react';
import { Outlet } from 'react-router-dom';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import './App.css';
import ButtonAppBar from './AppBar';

import GlobalStoreService from './store/global-store.service';


const App = () => {
    GlobalStoreService.init();

    return (
        <div>
            <ButtonAppBar></ButtonAppBar>
            <Outlet/>
        </div>

    );

};

export default App;
