import React from 'react';

import { RouteObject } from 'react-router-dom';

import DesktopApp from '../desktop-app';
import LegendaryEvent from './legendary-events/legendary-event';
import { LegendaryEventEnum } from '../models/enums';

const inputRoutes: RouteObject[] = [
    {
        path: 'input/wyo',
        async lazy() {
            const { WhoYouOwn } = await import('./who-you-own/who-you-own');
            return { Component: WhoYouOwn };
        },
    },
    {
        path: 'input/campaignsProgress',
        async lazy() {
            const { CampaignsProgress } = await import('./campaigns-progress');
            return { Component: CampaignsProgress };
        },
    },
    {
        path: 'input/inventory',
        async lazy() {
            const { Inventory } = await import('./inventory');
            return { Component: Inventory };
        },
    },
];

const planRoutes: RouteObject[] = [
    {
        path: 'plan/goals',
        async lazy() {
            const { Goals } = await import('./goals/goals');
            return { Component: Goals };
        },
    },
    {
        path: 'plan/dailyRaids',
        async lazy() {
            const { DailyRaids } = await import('./tables/dailyRaids');
            return { Component: DailyRaids };
        },
    },
    {
        path: 'plan/le',
        async lazy() {
            const { LegendaryEventPage } = await import('./legendary-events/legendary-events-page');
            return { Component: LegendaryEventPage };
        },
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
        async lazy() {
            const { MasterTable } = await import('./legendary-events/master-table');
            return { Component: MasterTable };
        },
    },
];

const learnRoutes: RouteObject[] = [
    {
        path: 'learn/characters',
        async lazy() {
            const { Characters } = await import('./characters/characters');
            return { Component: Characters };
        },
    },
    {
        path: 'learn/upgrades',
        async lazy() {
            const { Upgrades } = await import('./tables/upgrades');
            return { Component: Upgrades };
        },
    },
    {
        path: 'learn/rankLookup',
        async lazy() {
            const { RankLookup } = await import('./tables/rankLookup');
            return { Component: RankLookup };
        },
    },
    {
        path: 'learn/campaigns',
        async lazy() {
            const { Campaigns } = await import('./tables/campaigns');
            return { Component: Campaigns };
        },
    },
    {
        path: 'learn/dirtyDozen',
        async lazy() {
            const { DirtyDozen } = await import('./dirty-dozen/dirty-dozen');
            return { Component: DirtyDozen };
        },
    },
];

export const appRoutes: () => RouteObject[] = () => [
    {
        path: '',
        element: <DesktopApp />,
        children: [
            {
                path: 'home',
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
                async lazy() {
                    const { Contacts } = await import('./contacts/contacts');
                    return { Component: Contacts };
                },
            },
            {
                path: 'ty',
                async lazy() {
                    const { Thanks } = await import('../shared-components/thanks');
                    return { Component: Thanks };
                },
            },
        ],
    },
];
