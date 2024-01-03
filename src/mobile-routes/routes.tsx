import React from 'react';

import { redirect, RouteObject } from 'react-router-dom';

import MobileApp from '../mobile-app';
import { LegendaryEvents } from './legendary-events/legendary-events';
import { MobileHome } from './home/mobileHome';
import { Goals } from '../routes/goals/goals';
import { WhoYouOwn } from '../routes/who-you-own/who-you-own';
import { PlanRoutes } from './events/planRoutes';
import { LegendaryEventEnum } from '../models/enums';
import { InputRoutes } from './events/inputRoutes';
import { LearnRoutes } from './events/learnRoutes';
import { CampaignsProgress } from '../routes/campaigns-progress';
import { Inventory } from '../routes/inventory';
import { DailyRaids } from '../routes/tables/dailyRaids';
import { Characters } from '../routes/characters/characters';
import { Upgrades } from '../routes/tables/upgrades';
import { RankLookup } from '../routes/tables/rankLookup';
import { Campaigns } from '../routes/tables/campaigns';
import { DirtyDozen } from '../routes/dirty-dozen/dirty-dozen';
import { Contacts } from '../routes/contacts/contacts';
import { Thanks } from '../shared-components/thanks';
import { MasterTable } from '../routes/legendary-events/master-table';

const inputRoutes: RouteObject[] = [
    {
        path: 'input',
        element: <InputRoutes />,
    },
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
        path: 'plan',
        element: <PlanRoutes />,
    },
    {
        path: 'plan/goals',
        element: <Goals />,
    },
    {
        path: 'plan/dailyRaids',
        element: <DailyRaids />,
    },
    {
        path: 'plan/leMasterTable',
        element: <MasterTable />,
    },
    {
        path: 'plan/le/shadowsun',
        element: <LegendaryEvents id={LegendaryEventEnum.Shadowsun} />,
    },
    {
        path: 'plan/le/aunshi',
        element: <LegendaryEvents id={LegendaryEventEnum.AunShi} />,
    },
    {
        path: 'plan/le/ragnar',
        element: <LegendaryEvents id={LegendaryEventEnum.Ragnar} />,
    },
    {
        path: 'plan/le/vitruvius',
        element: <LegendaryEvents id={LegendaryEventEnum.Vitruvius} />,
    },
];

const learnRoutes: RouteObject[] = [
    {
        path: 'learn',
        element: <LearnRoutes />,
    },
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
                element: <MobileHome />,
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
