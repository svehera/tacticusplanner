import React from 'react';
import { Outlet } from 'react-router-dom';
import { StoreProvider } from './reducers/store.provider2';

import { StaticDataService } from './services';

export const App = () => {
    localStorage.setItem('appVersion', StaticDataService.whatsNew.currentVersion);

    return (
        <React.Fragment>
            <StoreProvider>
                <Outlet />
            </StoreProvider>
        </React.Fragment>
    );
};
