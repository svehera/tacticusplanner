import { RouteObject } from 'react-router-dom';

export const guildWarZonesLazyRoute: RouteObject = {
    path: 'plan/guildWar/zones',
    async lazy() {
        const { GuildWarZones } = await import('./guild-war-zones');
        return { Component: GuildWarZones };
    },
};
