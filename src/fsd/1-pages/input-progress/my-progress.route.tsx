import { RouteObject } from 'react-router-dom';

export const myProgressLazyRoute: RouteObject = {
    path: 'input/myProgress',
    handle: {
        section: 'My Game',
        title: 'My Progress',
        description: 'Track your campaign completion across all storylines.',
    },
    async lazy() {
        const { MyProgress } = await import('./my-progress');
        return { Component: MyProgress };
    },
};
