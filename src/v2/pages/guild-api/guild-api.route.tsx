import { RouteObject } from 'react-router-dom';

export const guildApiLazyRoute: RouteObject = {
    path: 'learn/guild',
    async lazy() {
        const { GuildApi } = await import('./guild-api');
        return { Component: GuildApi };
    },
};
