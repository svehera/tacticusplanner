import React from 'react';

import { redirect, RouteObject } from 'react-router-dom';

import MobileApp from '../mobile-app';
import { faqLazyRoute } from 'src/v2/pages/faq/faq.route';
import { dirtyDozenLazyRoute } from 'src/v2/pages/dirty-dozen/dirty-dozen.route';
import { insightsLazyRoute } from 'src/v2/pages/insights/insights.route';
import { wyoLazyRoute } from 'src/v2/pages/who-you-own/who-you-own.route';
import { sharedRosterRoute } from 'src/v2/pages/shared-roster/shared-roster.route';
import { guildWarOffenseLazyRoute } from 'src/v2/pages/guild-war-offense/guild-war-offense.route';
import { guildWarDefenseLazyRoute } from 'src/v2/pages/guild-war-defense/guild-war-defense.route';
import { guildWarZonesLazyRoute } from 'src/v2/pages/guild-war-layout/guild-war-zones.route';
import { guildLazyRoute } from 'src/v2/pages/guild/guild.route';
import { guildInsightsLazyRoute } from 'src/v2/pages/guild-insights/guild-insights.route';
import { teamsMobileLazyRoute } from 'src/v2/pages/teams/teams.route';
import { mowLookupMobileLazyRoute } from 'src/v2/pages/mow-lookup/mow-lookup.route';
import { guidesLazyRoute } from 'src/v2/pages/guides/guides.route';
import { lreLazyRoute } from 'src/v2/pages/lre/lre-route';

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
    teamsMobileLazyRoute,
    lreLazyRoute,
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
    mowLookupMobileLazyRoute,
    guidesLazyRoute,
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
