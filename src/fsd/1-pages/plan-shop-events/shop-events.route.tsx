import { RouteObject } from 'react-router-dom';

export const shopEventsLazyRoutes: RouteObject[] = [
    {
        path: 'plan/shop-events',
        handle: {
            section: 'Plan',
            title: 'Shop Events',
            description: 'Browse seasonal and merchant shop events.',
        },
        async lazy() {
            const { ShopEventsList } = await import('./shop-events-list');
            return { Component: ShopEventsList };
        },
    },
    {
        path: 'plan/shop-events/:eventId',
        handle: {
            section: 'Plan',
            title: 'Shop Event',
            description: 'Track shop stock and plan which items to prioritize buying.',
        },
        async lazy() {
            const { ShopEventDetail } = await import('./shop-event-detail');
            return { Component: ShopEventDetail };
        },
    },
];
