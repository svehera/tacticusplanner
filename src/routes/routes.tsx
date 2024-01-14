import React from 'react';

import { redirect, RouteObject } from 'react-router-dom';

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
import { DailyRaids } from './tables/dailyRaids';
import { CampaignsProgress } from './campaigns-progress';
import { Inventory } from './inventory';
import { MasterTable } from './legendary-events/master-table';

const inputRoutes: RouteObject[] = [
    {
        path: 'input/wyo',
        element: <WhoYouOwn />,
    },
    {
        path: 'input/campaignsProgress',
        element: <CampaignsProgress />,
    },
    {
        path: 'input/inventory',
        element: <Inventory />,
    },
];

const planRoutes: RouteObject[] = [
    {
        path: 'plan/goals',
        element: <Goals />,
    },
    {
        path: 'plan/dailyRaids',
        element: <DailyRaids />,
    },
    {
        path: 'plan/le',
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
                path: 'ragnar',
                element: <LegendaryEvent id={LegendaryEventEnum.Ragnar} />,
            },
            {
                path: 'vitruvius',
                element: <LegendaryEvent id={LegendaryEventEnum.Vitruvius} />,
            },
        ],
    },
    {
        path: 'plan/leMasterTable',
        element: <MasterTable />,
    },
];

const learnRoutes: RouteObject[] = [
    {
        path: 'learn/characters',
        element: <Characters />,
    },
    {
        path: 'learn/upgrades',
        element: <Upgrades />,
    },
    {
        path: 'learn/rankLookup',
        element: <RankLookup />,
    },
    {
        path: 'learn/campaigns',
        element: <Campaigns />,
    },
    {
        path: 'learn/dirtyDozen',
        element: <DirtyDozen />,
    },
];

export const appRoutes: () => RouteObject[] = () => [
    {
        path: '',
        element: <DesktopApp />,
        children: [
            {
                path: 'home',
                // element: <Home />,
                async lazy() {
                    const { Home } = await import('../features/misc/home/home');
                    return { Component: Home };
                },
            },
            ...inputRoutes,
            ...planRoutes,
            ...learnRoutes,
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
