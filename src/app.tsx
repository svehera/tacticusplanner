import React from 'react';
import { Outlet } from 'react-router-dom';
import { StoreProvider } from './reducers/store.provider';

export const App = () => {
    return (
        <React.Fragment>
            <StoreProvider>
                <Outlet />
            </StoreProvider>
        </React.Fragment>
    );
};
