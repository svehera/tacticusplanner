import React from 'react';
import { Outlet } from 'react-router-dom';

import './app.css';
import TopAppBar from './app-bar';
import { GlobalService } from './services';


const App = () => {
    GlobalService.init();

    return (
        <div>
            <TopAppBar></TopAppBar>
            <Outlet/>
        </div>
    );

};

export default App;
