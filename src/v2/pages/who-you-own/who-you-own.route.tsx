import { RouteObject } from 'react-router-dom';

export const wyoLazyRoute: RouteObject = {
    path: 'input/wyo',
    async lazy() {
        const { WhoYouOwn } = await import('./who-you-own');
        return { Component: WhoYouOwn };
    },
};
