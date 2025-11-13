import { RouteObject } from 'react-router-dom';

export const resourcesLazyRoute: RouteObject = {
    path: 'input/resources',
    async lazy() {
        const { Resources } = await import('./resources');
        return { Component: Resources };
    },
};
