import { RouteObject } from 'react-router-dom';

export const guildApiLazyRoute: RouteObject = {
    path: 'learn/guild',
    handle: {
        section: 'Library',
        title: 'Guild API',
        description: 'Connect to the Tacticus API to sync live guild and player data.',
    },
    async lazy() {
        const { GuildApi } = await import('./guild-api');
        return { Component: GuildApi };
    },
};
