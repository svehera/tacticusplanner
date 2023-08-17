import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import {
    createBrowserRouter,
    RouterProvider,
} from 'react-router-dom';
import WhoYouOwn from './components/who-you-own/who-you-own';
import LegendaryEventPage from './components/legendary-events/legendary-events-page';

const router = createBrowserRouter([
    {
        path: '/tacticusplanner',
        element: <App />,
        children: [
            {
                path: '/tacticusplanner/',
                element: <WhoYouOwn />,
            },
            {
                path: 'le',
                element: <LegendaryEventPage />,
            },
        ],
    },
]);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
