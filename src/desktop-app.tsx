import React, { useEffect } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';

import TopAppBar from './app-bar';
import { isMobile } from 'react-device-detect';

const DesktopApp = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preferredView = localStorage.getItem('preferredView');

    useEffect(() => {
        if (isMobile && (!preferredView || preferredView === 'mobile')) {
            navigate('/mobile/home');
            return;
        }
        const redirect = searchParams.get('redirect');
        if (redirect) {
            searchParams.delete('redirect');

            navigate({
                pathname: redirect,
                search: '?' + searchParams.toString(),
            });
            return;
        }
        if (!redirect && location.pathname === '/') {
            navigate('/home');
            return;
        }
    }, []);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <TopAppBar></TopAppBar>
            <div style={{ margin: 20 }}>
                <Outlet />
            </div>
        </div>
    );
};

export default DesktopApp;
