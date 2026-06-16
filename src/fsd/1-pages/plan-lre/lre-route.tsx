import { RouteObject } from 'react-router-dom';

export const lreLazyRoute: RouteObject = {
    path: 'plan/lre',
    handle: {
        section: 'Plan',
        title: 'LRE',
        description:
            'Build teams for each track of the current Legendary Release Event and track your score, chest, and shard progress.',
    },
    async lazy() {
        const { Lre } = await import('./lre');
        return { Component: Lre };
    },
};
