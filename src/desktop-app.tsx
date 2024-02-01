import React, { useEffect } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { isMobile } from 'react-device-detect';

import TopAppBar from './app-bar';

const DesktopApp = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preferredView = localStorage.getItem('preferredView');

    useEffect(() => {
        const redirect = searchParams.get('redirect');

        // Redirect to mobile view if on mobile device and preferred view is not set to desktop
        if (isMobile && !!redirect && (!preferredView || preferredView === 'mobile')) {
            navigate('/mobile/home');
            return;
        }

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
