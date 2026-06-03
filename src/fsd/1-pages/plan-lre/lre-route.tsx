import { RouteObject } from 'react-router-dom';

export const lreLazyRoute: RouteObject = {
    path: 'plan/lre',
    handle: {
        section: 'Plan',
        title: 'LRE',
        description: 'Plan your Long Range Escalation node picks and track expected rewards.',
    },
    async lazy() {
        const { Lre } = await import('./lre');
        return { Component: Lre };
    },
};
