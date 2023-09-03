import React from 'react';

import {
    RouteObject,
} from 'react-router-dom';

import MobileApp from '../mobile-app';
import { About } from '../routes/root/about';
import { Characters } from './characters/characters';
import { LegendaryEvents } from './legendary-events/legendary-events';

export const mobileAppRoutes: () => RouteObject[] = () => [
    {
        path: 'mobile',
        element: <MobileApp/>,
        children: [
            {
                path: '/mobile',
                element: <About/>,
            },
            {
                path: 'characters',
                element: <Characters/>,
            },
            {
                path: 'legendaryEvents',
                element: <LegendaryEvents/>,
            }
        ],
    },
];