import { RouteObject } from 'react-router-dom';

export const onslaughtLazyRoute: RouteObject = {
    path: 'input/onslaught',
    handle: {
        section: 'My Game',
        title: 'Onslaught',
        description:
            'Set your current sector and tier for each alliance. These values are used to estimate shards earned per onslaught token when computing ascension goal timelines.',
    },
    async lazy() {
        const { Onslaught } = await import('./onslaught');
        return { Component: Onslaught };
    },
};
