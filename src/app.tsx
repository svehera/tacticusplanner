import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import TopAppBar from './app-bar';
import { GlobalService } from './services';
import { isMobile } from 'react-device-detect';

const App = () => {
    const navigate = useNavigate();

    useEffect(() => {
        if (isMobile) {
            navigate('/mobile');
        }
    }, []);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <TopAppBar></TopAppBar>
            <Outlet/>
        </div>
    );

};

export default App;
