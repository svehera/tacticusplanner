import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';

import reportWebVitals from './reportWebVitals';

import {
    createBrowserRouter,
    RouterProvider,
} from 'react-router-dom';
import { appRoutes } from './routes/routes';
import { mobileAppRoutes } from './mobile-routes/routes';

const routes =  createBrowserRouter([...appRoutes, ...mobileAppRoutes]);

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <RouterProvider router={routes}/>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
