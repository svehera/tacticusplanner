import { redirect, RouteObject } from 'react-router-dom';

import { faqLazyRoute } from '@/fsd/1-pages/faq/faq.route';
import { sharedRosterRoute } from '@/fsd/1-pages/shared-roster/shared-roster.route';

import { globalInputRoutes, globalLearnRoutes, globalPlanRoutes } from '../desktop-routes';
import MobileApp from '../mobile-app';

const inputRoutes: RouteObject[] = [
    {
        path: 'input',
        async lazy() {
            const { InputRoutes } = await import('@/fsd/0-app/routing/mobile-routes/events/inputRoutes');
            return { Component: InputRoutes };
        },
    },
    ...globalInputRoutes,
];

const planRoutes: RouteObject[] = [
    {
        path: 'plan',
        async lazy() {
            const { PlanRoutes } = await import('@/fsd/0-app/routing/mobile-routes/events/planRoutes');
            return { Component: PlanRoutes };
        },
    },
    ...globalPlanRoutes,
];

const learnRoutes: RouteObject[] = [
    {
        path: 'learn',
        async lazy() {
            const { LearnRoutes } = await import('@/fsd/0-app/routing/mobile-routes/events/learnRoutes');
            return { Component: LearnRoutes };
        },
    },
    ...globalLearnRoutes,
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
                    const { MobileHome } = await import('@/fsd/1-pages/home');
                    return { Component: MobileHome };
                },
            },
            ...inputRoutes,
            ...planRoutes,
            ...learnRoutes,
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
