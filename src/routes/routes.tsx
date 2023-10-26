import React from 'react';

import { RouteObject } from 'react-router-dom';

import DesktopApp from '../desktop-app';
import { About } from './root/about';
import { WhoYouOwn } from './who-you-own/who-you-own';
import { Characters } from './characters/characters';
import { DirtyDozen } from './dirty-dozen/dirty-dozen';
import { LegendaryEventPage } from './legendary-events/legendary-events-page';
import { Contacts } from './contacts/contacts';
import { Goals } from './goals/goals';
import { Thanks } from '../shared-components/thanks';
import LegendaryEvent from './legendary-events/legendary-event';
import { LegendaryEventEnum } from '../models/enums';
import { Campaigns } from './tables/campaigns';
import { Upgrades } from './tables/upgrades';
import { RankLookup } from './tables/rankLookup';

export const appRoutes: () => RouteObject[] = () => [
    {
        path: '',
        element: <DesktopApp />,
        children: [
            {
                path: '/',
                element: <About />,
            },
            {
                path: 'wyo',
                element: <WhoYouOwn />,
            },
            {
                path: 'characters',
                element: <Characters />,
            },
            {
                path: 'upgrades',
                element: <Upgrades />,
            },
            {
                path: 'rankLookup',
                element: <RankLookup />,
            },
            {
                path: 'campaigns',
                element: <Campaigns />,
            },
            {
                path: 'dirtyDozen',
                element: <DirtyDozen />,
            },
            {
                path: 'le',
                element: <LegendaryEventPage />,
                children: [
                    {
                        path: 'shadowsun',
                        element: <LegendaryEvent id={LegendaryEventEnum.Shadowsun} />,
                    },
                    {
                        path: 'aunshi',
                        element: <LegendaryEvent id={LegendaryEventEnum.AunShi} />,
                    },
                    {
                        path: 'Ragnar',
                        element: <LegendaryEvent id={LegendaryEventEnum.Ragnar} />,
                    },
                ],
            },
            {
                path: 'goals',
                element: <Goals />,
            },
            {
                path: 'contacts',
                element: <Contacts />,
            },
            {
                path: 'ty',
                element: <Thanks />,
            },
        ],
    },
];
