import { RouteObject } from 'react-router-dom';

import { faqLazyRoute } from '@/fsd/1-pages/faq/faq.route';
import { guidesLazyRoute } from '@/fsd/1-pages/guides/guides.route';
import { guildLazyRoute } from '@/fsd/1-pages/guild/guild.route';
import { guildApiLazyRoute } from '@/fsd/1-pages/guild-api/guild-api.route';
import { guildInsightsLazyRoute } from '@/fsd/1-pages/guild-insights/guild-insights.route';
import { guildWarDefenseLazyRoute } from '@/fsd/1-pages/guild-war-defense/guild-war-defense.route';
import { guildWarZonesLazyRoute } from '@/fsd/1-pages/guild-war-layout/guild-war-zones.route';
import { guildWarOffenseLazyRoute } from '@/fsd/1-pages/guild-war-offense/guild-war-offense.route';
import { myProgressLazyRoute } from '@/fsd/1-pages/input-progress/my-progress.route';
import { resourcesLazyRoute } from '@/fsd/1-pages/input-resources/resources.route';
import { rosterSnapshotsLazyRoute } from '@/fsd/1-pages/input-roster-snapshots';
import { xpIncomeLazyRoute } from '@/fsd/1-pages/input-xp-income/xp-income.route';
import { insightsLazyRoute } from '@/fsd/1-pages/insights/insights.route';
import { dirtyDozenLazyRoute } from '@/fsd/1-pages/learn-dirty-dozen';
import { mowLookupDesktopLazyRoute } from '@/fsd/1-pages/learn-mow';
import { campaignProgressionLazyRoute } from '@/fsd/1-pages/plan-campaign-progression';
import { lreLazyRoute } from '@/fsd/1-pages/plan-lre';
import { teams2Route } from '@/fsd/1-pages/plan-teams2/teams2.route';
import { sharedRosterRoute } from '@/fsd/1-pages/shared-roster/shared-roster.route';
import { teamsDesktopLazyRoute } from '@/fsd/1-pages/teams/teams.route';
import { wyoLazyRoute } from '@/fsd/1-pages/who-you-own/who-you-own.route';

import DesktopApp from './desktop-app';

export const globalInputRoutes: RouteObject[] = [
    wyoLazyRoute,
    rosterSnapshotsLazyRoute,
    myProgressLazyRoute,
    {
        path: 'input/inventory',
        async lazy() {
            const { Inventory } = await import('@/fsd/1-pages/input-inventory');
            return { Component: Inventory };
        },
    },
    xpIncomeLazyRoute,
    resourcesLazyRoute,
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
    teams2Route,
    guildWarOffenseLazyRoute,
    guildWarDefenseLazyRoute,
    guildWarZonesLazyRoute,
    teamsDesktopLazyRoute,
    lreLazyRoute,
    {
        path: 'plan/leMasterTable',
        async lazy() {
            const { MasterTable } = await import('@/fsd/1-pages/plan-lre/master-table');
            return { Component: MasterTable };
        },
    },
    {
        path: 'plan/debugraids',
        async lazy() {
            const { DebugRaids } = await import('@/fsd/1-pages/plan-debug-raids');
            return { Component: DebugRaids };
        },
    },
    campaignProgressionLazyRoute,
];

export const globalLearnRoutes: RouteObject[] = [
    {
        path: 'learn/characters',
        async lazy() {
            const { LearnCharacters } = await import('@/fsd/1-pages/learn-characters');
            return { Component: LearnCharacters };
        },
    },
    {
        path: 'learn/npcs',
        async lazy() {
            const { NpcInfo } = await import('@/fsd/1-pages/learn-npcs');
            return { Component: NpcInfo };
        },
    },
    {
        path: 'learn/upgrades',
        async lazy() {
            const { Upgrades } = await import('@/fsd/1-pages/learn-upgrades');
            return { Component: Upgrades };
        },
    },
    {
        path: 'learn/equipment',
        async lazy() {
            const { Equipment } = await import('@/fsd/1-pages/learn-equipment');
            return { Component: Equipment };
        },
    },
    {
        path: 'learn/rankLookup',
        async lazy() {
            const { RankLookup } = await import('@/fsd/1-pages/learn-characters');
            return { Component: RankLookup };
        },
    },
    {
        path: 'learn/campaigns',
        async lazy() {
            const { Campaigns } = await import('@/fsd/1-pages/learn-campaigns/campaigns');
            return { Component: Campaigns };
        },
    },
    {
        path: 'learn/hse',
        async lazy() {
            const { HomeScreenEvent } = await import('@/fsd/1-pages/learn-hse/hse');
            return { Component: HomeScreenEvent };
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
                    const { DesktopHome } = await import('@/fsd/1-pages/home');
                    return { Component: DesktopHome };
                },
            },
            ...globalInputRoutes,
            ...globalPlanRoutes,
            ...globalLearnRoutes,
            {
                path: 'contacts',
                async lazy() {
                    const { Contacts } = await import('@/fsd/1-pages/contacts');
                    return { Component: Contacts };
                },
            },
            {
                path: 'ty',
                async lazy() {
                    const { Thanks } = await import('@/fsd/3-features/thank-you/thanks');
                    return { Component: Thanks };
                },
            },
            faqLazyRoute,
            sharedRosterRoute,
        ],
    },
];
