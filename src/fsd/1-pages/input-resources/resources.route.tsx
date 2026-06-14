import { RouteObject } from 'react-router-dom';

export const resourcesLazyRoute: RouteObject = {
    path: 'input/resources',
    handle: {
        section: 'My Game',
        title: 'Resources',
        description: 'Overview of your gold, gems, and other currency income sources.',
    },
    async lazy() {
        const { Resources } = await import('./resources');
        return { Component: Resources };
    },
};
