import { RouteObject } from 'react-router-dom';

export const wyoLazyRoute: RouteObject = {
    path: 'input/wyo',
    handle: {
        section: 'My Game',
        title: 'Who You Own',
        description: 'Track which characters you own along with their rank, stars, and ability levels.',
    },
    async lazy() {
        const { WhoYouOwn } = await import('./who-you-own');
        return { Component: WhoYouOwn };
    },
};
