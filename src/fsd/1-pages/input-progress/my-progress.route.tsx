import { RouteObject } from 'react-router-dom';

export const myProgressLazyRoute: RouteObject = {
    path: 'input/myProgress',
    async lazy() {
        const { MyProgress } = await import('./my-progress');
        return { Component: MyProgress };
    },
};
