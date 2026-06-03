import { RouteObject } from 'react-router-dom';

export const resourcesLazyRoute: RouteObject = {
    path: 'input/resources',
    handle: {
        section: 'My Game',
        title: 'Resources',
        description: 'Log your daily gold, gems, and other currency income to inform planning.',
    },
    async lazy() {
        const { Resources } = await import('./resources');
        return { Component: Resources };
    },
};
