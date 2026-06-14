import { RouteObject } from 'react-router-dom';

export const onslaughtLazyRoute: RouteObject = {
    path: 'input/onslaught',
    handle: {
        section: 'My Game',
        title: 'Onslaught',
        description:
            'Log your current sector and tier per alliance to estimate shard income across ascension goal timelines.',
    },
    async lazy() {
        const { Onslaught } = await import('./onslaught');
        return { Component: Onslaught };
    },
};
