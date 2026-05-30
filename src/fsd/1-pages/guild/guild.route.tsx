import { RouteObject } from 'react-router-dom';

export const guildLazyRoute: RouteObject = {
    path: 'input/guild',
    handle: {
        section: 'My Game',
        title: 'Guild',
        description: 'Enter your guild details to unlock guild-based planning features.',
    },
    async lazy() {
        const { Guild } = await import('./guild');
        return { Component: Guild };
    },
};
