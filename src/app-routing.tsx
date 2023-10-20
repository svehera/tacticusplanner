import { createBrowserRouter } from 'react-router-dom';
import { appRoutes } from './routes/routes';
import { mobileAppRoutes } from './mobile-routes/routes';
import React from 'react';
import { App } from './app';

export const routes = createBrowserRouter([
    {
        path: '',
        element: <App />,
        children: [...appRoutes(), ...mobileAppRoutes()],
    },
]);
