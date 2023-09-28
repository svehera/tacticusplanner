import React from 'react';

import {
    RouteObject,
} from 'react-router-dom';

import MobileApp from '../mobile-app';
import { LegendaryEvents } from './legendary-events/legendary-events';
import { Home } from './home/home';
import { Goals } from '../routes/goals/goals';
import { WhoYouOwn } from '../routes/who-you-own/who-you-own';

export const mobileAppRoutes: () => RouteObject[] = () => [
    {
        path: 'mobile',
        element: <MobileApp/>,
        children: [
            {
                path: '/mobile',
                element: <Home/>,
            },
            {
                path: 'wyo',
                element: <WhoYouOwn/>,
            },
            {
                path: 'le',
                element: <LegendaryEvents/>,
            },
            {
                path: 'goals',
                element: <Goals/>,
            }
        ],
    },
];