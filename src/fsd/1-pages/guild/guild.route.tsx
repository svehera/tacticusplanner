import { RouteObject } from 'react-router-dom';

export const guildLazyRoute: RouteObject = {
    path: 'input/guild',
    async lazy() {
        const { Guild } = await import('./guild');
        return { Component: Guild };
    },
};
