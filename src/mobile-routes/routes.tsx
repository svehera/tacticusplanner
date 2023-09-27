import React from 'react';

import {
    RouteObject,
} from 'react-router-dom';

import MobileApp from '../mobile-app';
import { Characters } from './characters/characters';
import { LegendaryEvents } from './legendary-events/legendary-events';
import { Home } from './home/home';
import { Goals } from '../routes/goals/goals';

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
                element: <Characters/>,
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