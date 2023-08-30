import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';

import App from './app';
import reportWebVitals from './reportWebVitals';

import {
    createBrowserRouter,
    RouterProvider,
} from 'react-router-dom';
import { About, Characters, Contacts, DirtyDozen, LegendaryEventPage, WhoYouOwn } from './routes';


const router = createBrowserRouter([
    {
        path: '',
        element: <App/>,
        children: [
            {
                path: '/',
                element: <About/>,
            },
            {
                path: 'wyo',
                element: <WhoYouOwn/>,
            },
            {
                path: 'characters',
                element: <Characters/>,
            },
            {
                path: 'dirtyDozen',
                element: <DirtyDozen/>,
            },
            {
                path: 'le',
                element: <LegendaryEventPage/>,
            },
            {
                path: 'contacts',
                element: <Contacts/>,
            },
        ],
    },
]);

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <RouterProvider router={router}/>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
