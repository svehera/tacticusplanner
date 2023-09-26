import React, { useEffect } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';

import TopAppBar from './app-bar';
import { isMobile } from 'react-device-detect';

const App = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preferredView = localStorage.getItem('preferredView');

    useEffect(() => {
        if (isMobile && (!preferredView || preferredView === 'mobile')) {
            navigate('/mobile');
        }
        const redirect = searchParams.get('redirect');
        if(redirect) {
            navigate(redirect);
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
