import React from 'react';

import { redirect, RouteObject } from 'react-router-dom';

import MobileApp from '../mobile-app';
import { LegendaryEventEnum } from '../models/enums';
import { faqLazyRoute } from 'src/v2/pages/faq/faq.route';
import { dirtyDozenLazyRoute } from 'src/v2/pages/dirty-dozen/dirty-dozen.route';
import { insightsLazyRoute } from 'src/v2/pages/insights/insights.route';
import { wyoLazyRoute } from 'src/v2/pages/who-you-own/who-you-own.route';
import { sharedRosterRoute } from 'src/v2/pages/shared-roster/shared-roster.route';
import LegendaryEvent from 'src/routes/legendary-events/legendary-event';
import { guildWarOffenseLazyRoute } from 'src/v2/pages/guild-war-offense/guild-war-offense.route';
import { guildWarDefenseLazyRoute } from 'src/v2/pages/guild-war-defense/guild-war-defense.route';
import { guildWarZonesLazyRoute } from 'src/v2/pages/guild-war-layout/guild-war-zones.route';
import { guildLazyRoute } from 'src/v2/pages/guild/guild.route';
import { guildInsightsLazyRoute } from 'src/v2/pages/guild-insights/guild-insights.route';

const inputRoutes: RouteObject[] = [
    {
        path: 'input',
        async lazy() {
            const { InputRoutes } = await import('./events/inputRoutes');
            return { Component: InputRoutes };
        },
    },
    wyoLazyRoute,
    {
        path: 'input/campaignsProgress',
        async lazy() {
            const { CampaignsProgress } = await import('../routes/campaigns-progress');
            return { Component: CampaignsProgress };
        },
    },
    {
        path: 'input/inventory',
        async lazy() {
            const { Inventory } = await import('../routes/inventory');
            return { Component: Inventory };
        },
    },
    guildLazyRoute,
];

const planRoutes: RouteObject[] = [
    {
        path: 'plan',
        async lazy() {
            const { PlanRoutes } = await import('./events/planRoutes');
            return { Component: PlanRoutes };
        },
    },
    {
        path: 'plan/lre',
        async lazy() {
            const { PlanLeRoutes } = await import('./events/leRoutes');
            return { Component: PlanLeRoutes };
        },
    },
    {
        path: 'plan/guildWar',
        async lazy() {
            const { PlanGuildWarRoutes } = await import('./events/guildWarRoutes');
            return { Component: PlanGuildWarRoutes };
        },
    },
    {
        path: 'plan/goals',
        async lazy() {
            const { Goals } = await import('../routes/goals/goals');
            return { Component: Goals };
        },
    },
    {
        path: 'plan/dailyRaids',
        async lazy() {
            const { DailyRaids } = await import('../routes/tables/dailyRaids');
            return { Component: DailyRaids };
        },
    },
    {
        path: 'plan/leMasterTable',
        async lazy() {
            const { MasterTable } = await import('../routes/legendary-events/master-table');
            return { Component: MasterTable };
        },
    },
    guildWarOffenseLazyRoute,
    guildWarDefenseLazyRoute,
    guildWarZonesLazyRoute,
    {
        path: 'plan/le',
        async lazy() {
            const { LegendaryEventPage } = await import('../routes/legendary-events/legendary-events-page');
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
            {
                path: 'kharn',
                element: <LegendaryEvent id={LegendaryEventEnum.Kharn} />,
            },
        ],
    },
];

const learnRoutes: RouteObject[] = [
    {
        path: 'learn',
        async lazy() {
            const { LearnRoutes } = await import('./events/learnRoutes');
            return { Component: LearnRoutes };
        },
    },
    {
        path: 'learn/characters',
        async lazy() {
            const { Characters } = await import('../routes/characters/characters');
            return { Component: Characters };
        },
    },
    {
        path: 'learn/upgrades',
        async lazy() {
            const { Upgrades } = await import('../routes/tables/upgrades');
            return { Component: Upgrades };
        },
    },
    {
        path: 'learn/rankLookup',
        async lazy() {
            const { RankLookup } = await import('../routes/tables/rankLookup');
            return { Component: RankLookup };
        },
    },
    {
        path: 'learn/campaigns',
        async lazy() {
            const { Campaigns } = await import('../routes/tables/campaigns');
            return { Component: Campaigns };
        },
    },
    dirtyDozenLazyRoute,
    insightsLazyRoute,
    guildInsightsLazyRoute,
];

export const mobileAppRoutes: () => RouteObject[] = () => [
    {
        path: 'mobile',
        element: <MobileApp />,
        children: [
            {
                path: '/mobile',
                loader: () => redirect('/mobile/home'),
            },
            {
                path: 'home',
                async lazy() {
                    const { MobileHome } = await import('./home/mobileHome');
                    return { Component: MobileHome };
                },
            },
            ...inputRoutes,
            ...planRoutes,
            ...learnRoutes,
            {
                path: 'contacts',
                async lazy() {
                    const { Contacts } = await import('../routes/contacts/contacts');
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
