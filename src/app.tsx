import React from 'react';
import { Outlet } from 'react-router-dom';

import TopAppBar from './app-bar';
import { GlobalService } from './services';

const App = () => {
    GlobalService.init();

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <TopAppBar></TopAppBar>
            <Outlet/>
        </div>
    );

};

export default App;
