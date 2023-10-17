import React from 'react';
import { Outlet } from 'react-router-dom';
import { StoreProvider } from './reducers/store.provider';

const appVersion = '1.0.0';

export const App = () => {
    localStorage.setItem('appVersion', appVersion);

    return (
        <React.Fragment>
            <StoreProvider>
                <Outlet />
            </StoreProvider>
        </React.Fragment>
    );
};
