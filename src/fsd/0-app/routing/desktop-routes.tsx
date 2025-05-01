import React from 'react';
import { RouteObject } from 'react-router-dom';

import { versusLazyRoute } from '@/v2/features/vs/versus.route';

import { guildApiLazyRoute } from '@/v2/pages/guild-api/guild-api.route';
import { campaignProgressionLazyRoute } from 'src/v2/pages/campaign-progression/campaign-progression.route';
import { dirtyDozenLazyRoute } from 'src/v2/pages/dirty-dozen/dirty-dozen.route';
import { faqLazyRoute } from 'src/v2/pages/faq/faq.route';
import { guidesLazyRoute } from 'src/v2/pages/guides/guides.route';
import { guildLazyRoute } from 'src/v2/pages/guild/guild.route';
import { guildInsightsLazyRoute } from 'src/v2/pages/guild-insights/guild-insights.route';
import { guildWarDefenseLazyRoute } from 'src/v2/pages/guild-war-defense/guild-war-defense.route';
import { guildWarZonesLazyRoute } from 'src/v2/pages/guild-war-layout/guild-war-zones.route';
import { guildWarOffenseLazyRoute } from 'src/v2/pages/guild-war-offense/guild-war-offense.route';
import { insightsLazyRoute } from 'src/v2/pages/insights/insights.route';
import { lreLazyRoute } from 'src/v2/pages/lre/lre-route';
import { mowLookupDesktopLazyRoute } from 'src/v2/pages/mow-lookup/mow-lookup.route';
import { myProgressLazyRoute } from 'src/v2/pages/my-progress/my-progress.route';
import { sharedRosterRoute } from 'src/v2/pages/shared-roster/shared-roster.route';
import { teamsDesktopLazyRoute } from 'src/v2/pages/teams/teams.route';
import { wyoLazyRoute } from 'src/v2/pages/who-you-own/who-you-own.route';

import DesktopApp from './desktop-app';

export const globalInputRoutes: RouteObject[] = [
    wyoLazyRoute,
    myProgressLazyRoute,
    {
        path: 'input/inventory',
        async lazy() {
            const { Inventory } = await import('@/routes/inventory');
            return { Component: Inventory };
        },
    },
    guildLazyRoute,
];

export const globalPlanRoutes: RouteObject[] = [
    {
        path: 'plan/goals',
        async lazy() {
            const { Goals } = await import('@/routes/goals/goals');
            return { Component: Goals };
        },
    },
    {
        path: 'plan/dailyRaids',
        async lazy() {
            const { DailyRaids } = await import('@/routes/tables/dailyRaids');
            return { Component: DailyRaids };
        },
    },
    guildWarOffenseLazyRoute,
    guildWarDefenseLazyRoute,
    guildWarZonesLazyRoute,
    teamsDesktopLazyRoute,
    lreLazyRoute,
    {
        path: 'plan/leMasterTable',
        async lazy() {
            const { MasterTable } = await import('@/routes/legendary-events/master-table');
            return { Component: MasterTable };
        },
    },
    campaignProgressionLazyRoute,
];

export const globalLearnRoutes: RouteObject[] = [
    {
        path: 'learn/characters',
        async lazy() {
            const { Characters } = await import('@/routes/characters/characters');
            return { Component: Characters };
        },
    },
    {
        path: 'learn/npcs',
        async lazy() {
            const { NpcInfo } = await import('@/routes/npcs/npc-info');
            return { Component: NpcInfo };
        },
    },
    versusLazyRoute,
    {
        path: 'learn/upgrades',
        async lazy() {
            const { Upgrades } = await import('@/routes/tables/upgrades');
            return { Component: Upgrades };
        },
    },
    {
        path: 'learn/rankLookup',
        async lazy() {
            const { RankLookup } = await import('@/routes/tables/rankLookup');
            return { Component: RankLookup };
        },
    },
    {
        path: 'learn/campaigns',
        async lazy() {
            const { Campaigns } = await import('@/routes/tables/campaigns');
            return { Component: Campaigns };
        },
    },
    dirtyDozenLazyRoute,
    insightsLazyRoute,
    guildInsightsLazyRoute,
    mowLookupDesktopLazyRoute,
    guidesLazyRoute,
    guildApiLazyRoute,
];

export const appRoutes: () => RouteObject[] = () => [
    {
        path: '',
        element: <DesktopApp />,
        children: [
            {
                path: 'home',
                async lazy() {
                    const { Home } = await import('@/features/misc/home/home');
                    return { Component: Home };
                },
            },
            ...globalInputRoutes,
            ...globalPlanRoutes,
            ...globalLearnRoutes,
            {
                path: 'contacts',
                async lazy() {
                    const { Contacts } = await import('@/routes/contacts/contacts');
                    return { Component: Contacts };
                },
            },
            {
                path: 'ty',
                async lazy() {
                    const { Thanks } = await import('@/shared-components/thanks');
                    return { Component: Thanks };
                },
            },
            faqLazyRoute,
            sharedRosterRoute,
        ],
    },
];
