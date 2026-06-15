import { RouteObject } from 'react-router-dom';

export const guildWarZonesLazyRoute: RouteObject = {
    path: 'plan/guildWar/zones',
    handle: {
        section: 'Plan',
        title: 'Guild War',
        subtitle: 'Zones',
        description: "Map out your guild's full zone layout for the ongoing war.",
    },
    async lazy() {
        const { GuildWarZones } = await import('./guild-war-zones');
        return { Component: GuildWarZones };
    },
};
