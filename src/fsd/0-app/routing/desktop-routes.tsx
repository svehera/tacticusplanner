import { RouteObject } from 'react-router-dom';

import { faqLazyRoute } from '@/fsd/1-pages/faq/faq.route';
import { guidesLazyRoute } from '@/fsd/1-pages/guides/guides.route';
import { guildLazyRoute } from '@/fsd/1-pages/guild/guild.route';
import { guildApiLazyRoute } from '@/fsd/1-pages/guild-api/guild-api.route';
import { guildInsightsLazyRoute } from '@/fsd/1-pages/guild-insights/guild-insights.route';
import { guildWarZonesLazyRoute } from '@/fsd/1-pages/guild-war-layout/guild-war-zones.route';
import { equipmentLazyRoute } from '@/fsd/1-pages/input-equipment/equipment.route';
import { guildRosterSnapshotsLazyRoute } from '@/fsd/1-pages/input-guild-roster-snapshots';
import { onslaughtLazyRoute } from '@/fsd/1-pages/input-onslaught/onslaught.route';
import { myProgressLazyRoute } from '@/fsd/1-pages/input-progress/my-progress.route';
import { resourcesLazyRoute } from '@/fsd/1-pages/input-resources/resources.route';
import { rosterSnapshotsLazyRoute } from '@/fsd/1-pages/input-roster-snapshots';
import { xpIncomeLazyRoute } from '@/fsd/1-pages/input-xp-income/xp-income.route';
import { insightsLazyRoute } from '@/fsd/1-pages/insights/insights.route';
import { dirtyDozenLazyRoute } from '@/fsd/1-pages/learn-dirty-dozen';
import { guildPerformanceLazyRoute } from '@/fsd/1-pages/learn-guild-performance';
import { mowLookupDesktopLazyRoute } from '@/fsd/1-pages/learn-mow';
import { armageddonLazyRoute } from '@/fsd/1-pages/plan-armageddon/armageddon.route';
import { bulkGoalCreatorRoute } from '@/fsd/1-pages/plan-bulk-goals/bulk-goal-creator.route';
import { campaignProgressionLazyRoute } from '@/fsd/1-pages/plan-campaign-progression';
import { cesRoute } from '@/fsd/1-pages/plan-ces/ces.route';
import { lreLazyRoute } from '@/fsd/1-pages/plan-lre';
import { questsRoute } from '@/fsd/1-pages/plan-quests/quests.route';
import { teams2Route } from '@/fsd/1-pages/plan-teams2/teams2.route';
import { warDefense2Route } from '@/fsd/1-pages/plan-war-defense-2/war-defense2.route';
import { warOffense2Route } from '@/fsd/1-pages/plan-war-offense2/war-offense2.route';
import { sharedRosterRoute } from '@/fsd/1-pages/shared-roster/shared-roster.route';
import { wyoLazyRoute } from '@/fsd/1-pages/who-you-own/who-you-own.route';

import DesktopApp from './desktop-app';

export const globalInputRoutes: RouteObject[] = [
    wyoLazyRoute,
    rosterSnapshotsLazyRoute,
    guildRosterSnapshotsLazyRoute,
    onslaughtLazyRoute,
    myProgressLazyRoute,
    {
        path: 'input/inventory',
        handle: {
            section: 'My Game',
            title: 'Inventory',
            description: 'View and manage your crafting materials and upgrade components.',
        },
        async lazy() {
            const { Inventory } = await import('@/fsd/1-pages/input-inventory');
            return { Component: Inventory };
        },
    },
    xpIncomeLazyRoute,
    resourcesLazyRoute,
    equipmentLazyRoute,
    guildLazyRoute,
];

export const globalPlanRoutes: RouteObject[] = [
    {
        path: 'plan/goals',
        handle: {
            section: 'Plan',
            title: 'Goals',
            description: 'Set and track character upgrade, ascension, and ability goals.',
        },
        async lazy() {
            const { Goals } = await import('@/routes/goals/goals');
            return { Component: Goals };
        },
    },
    {
        path: 'plan/dailyRaids',
        handle: {
            section: 'Plan',
            title: 'Daily Raids',
            description: 'Allocate your energy across raid nodes each day to hit your upgrade goals on time.',
        },
        async lazy() {
            const { DailyRaids } = await import('@/routes/tables/daily-raids');
            return { Component: DailyRaids };
        },
    },
    bulkGoalCreatorRoute,
    teams2Route,
    warDefense2Route,
    warOffense2Route,
    guildWarZonesLazyRoute,
    lreLazyRoute,
    {
        path: 'plan/leMasterTable',
        handle: {
            section: 'Plan',
            title: 'LE Master Table',
            description:
                'Cross-event overview of all Legendary Release Events with point thresholds and character picks.',
        },
        async lazy() {
            const { MasterTable } = await import('@/fsd/1-pages/plan-lre/master-table');
            return { Component: MasterTable };
        },
    },
    armageddonLazyRoute,
    campaignProgressionLazyRoute,
    questsRoute,
    cesRoute,
    {
        path: 'plan/hse',
        handle: {
            section: 'Plan',
            title: 'HSE',
            description: 'Plan your battles and reward path for the current Home Screen Event.',
        },
        async lazy() {
            const { HomeScreenEvent } = await import('@/fsd/1-pages/plan-hse/hse');
            return { Component: HomeScreenEvent };
        },
    },
];

export const globalLearnRoutes: RouteObject[] = [
    {
        path: 'learn/characters',
        handle: {
            section: 'Library',
            title: 'Characters',
            description: 'Browse all characters — factions, traits, abilities, and upgrade paths.',
        },
        async lazy() {
            const { LearnCharacters } = await import('@/fsd/1-pages/learn-characters');
            return { Component: LearnCharacters };
        },
    },
    {
        path: 'learn/npcs',
        handle: {
            section: 'Library',
            title: 'NPCs',
            description: 'Reference stats and mechanics for non-player characters you fight in campaigns.',
        },
        async lazy() {
            const { NpcInfo } = await import('@/fsd/1-pages/learn-npcs');
            return { Component: NpcInfo };
        },
    },
    {
        path: 'learn/upgrades',
        handle: {
            section: 'Library',
            title: 'Upgrades',
            description: 'Look up crafting recipes and shard requirements for every upgrade tier.',
        },
        async lazy() {
            const { Upgrades } = await import('@/fsd/1-pages/learn-upgrades');
            return { Component: Upgrades };
        },
    },
    {
        path: 'learn/equipment',
        handle: {
            section: 'Library',
            title: 'Equipment',
            description: 'Browse all equipment pieces, their bonuses, and how to unlock them.',
        },
        async lazy() {
            const { Equipment } = await import('@/fsd/1-pages/learn-equipment');
            return { Component: Equipment };
        },
    },
    {
        path: 'learn/nerd-math',
        handle: {
            section: 'Library',
            title: 'Nerd Math',
            description: 'Detailed calculations for damage, survivability, and stat efficiency.',
        },
        async lazy() {
            const { NerdMath } = await import('@/fsd/1-pages/learn-nerd-math');
            return { Component: NerdMath };
        },
    },
    {
        path: 'learn/rankLookup',
        handle: {
            section: 'Library',
            title: 'Rank Lookup',
            description: 'Find the exact materials needed to take any character from one rank to another.',
        },
        async lazy() {
            const { RankLookup } = await import('@/fsd/1-pages/learn-characters');
            return { Component: RankLookup };
        },
    },
    {
        path: 'learn/campaigns',
        handle: {
            section: 'Library',
            title: 'Campaigns',
            description: 'Browse every campaign node — drop tables, enemy types, and difficulty flags.',
        },
        async lazy() {
            const { Campaigns } = await import('@/fsd/1-pages/learn-campaigns/campaigns');
            return { Component: Campaigns };
        },
    },
    dirtyDozenLazyRoute,
    insightsLazyRoute,
    guildPerformanceLazyRoute,
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
                handle: {
                    title: 'Home',
                    description: 'Your dashboard — quick links and an overview of your current progress.',
                },
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
                handle: { title: 'Contacts', description: 'Get in touch with the Tacticus Planner team.' },
                async lazy() {
                    const { Contacts } = await import('@/fsd/1-pages/contacts');
                    return { Component: Contacts };
                },
            },
            {
                path: 'ty',
                handle: { title: 'Thank You' },
                async lazy() {
                    const { Thanks } = await import('@/fsd/3-features/thank-you/thanks');
                    return { Component: Thanks };
                },
            },
            faqLazyRoute,
            sharedRosterRoute,
            {
                path: 'ui-kit',
                handle: { title: 'UI Kit' },
                async lazy() {
                    const { UiKitPage } = await import('@/fsd/1-pages/ui-kit');
                    return { Component: UiKitPage };
                },
            },
        ],
    },
];
