import React from 'react';

import { RouteObject } from 'react-router-dom';

import DesktopApp from '../desktop-app';
import LegendaryEvent from './legendary-events/legendary-event';
import { LegendaryEventEnum } from '../models/enums';
import { faqLazyRoute } from 'src/v2/pages/faq/faq.route';
import { dirtyDozenLazyRoute } from 'src/v2/pages/dirty-dozen/dirty-dozen.route';
import { insightsLazyRoute } from 'src/v2/pages/insights/insights.route';
import { wyoLazyRoute } from 'src/v2/pages/who-you-own/who-you-own.route';
import { sharedRosterRoute } from 'src/v2/pages/shared-roster/shared-roster.route';
import { guildWarOffenseLazyRoute } from 'src/v2/pages/guild-war-offense/guild-war-offense.route';
import { guildWarDefenseLazyRoute } from 'src/v2/pages/guild-war-defense/guild-war-defense.route';

const inputRoutes: RouteObject[] = [
    wyoLazyRoute,
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
    guildWarOffenseLazyRoute,
    guildWarDefenseLazyRoute,
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
    dirtyDozenLazyRoute,
    insightsLazyRoute,
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
            faqLazyRoute,
            sharedRosterRoute,
        ],
    },
];
