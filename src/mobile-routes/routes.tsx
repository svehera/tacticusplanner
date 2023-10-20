import React from 'react';

import { RouteObject } from 'react-router-dom';

import MobileApp from '../mobile-app';
import { LegendaryEvents } from './legendary-events/legendary-events';
import { Home } from './home/home';
import { Goals } from '../routes/goals/goals';
import { WhoYouOwn } from '../routes/who-you-own/who-you-own';
import { Events } from './events/events';
import { LegendaryEventEnum } from '../models/enums';

export const mobileAppRoutes: () => RouteObject[] = () => [
    {
        path: 'mobile',
        element: <MobileApp />,
        children: [
            {
                path: '/mobile',
                element: <Home />,
            },
            {
                path: 'wyo',
                element: <WhoYouOwn />,
            },
            {
                path: 'events',
                element: <Events />,
            },
            {
                path: 'le/shadowsun',
                element: <LegendaryEvents id={LegendaryEventEnum.Shadowsun} />,
            },
            {
                path: 'le/aunshi',
                element: <LegendaryEvents id={LegendaryEventEnum.AunShi} />,
            },
            {
                path: 'le/ragnar',
                element: <LegendaryEvents id={LegendaryEventEnum.Ragnar} />,
            },
            {
                path: 'goals',
                element: <Goals />,
            },
        ],
    },
];
