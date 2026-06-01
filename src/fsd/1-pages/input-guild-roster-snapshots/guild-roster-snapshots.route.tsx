import { RouteObject } from 'react-router-dom';

export const guildRosterSnapshotsLazyRoute: RouteObject = {
    path: 'input/guild-roster-snapshots',
    async lazy() {
        const { GuildRosterSnapshots } = await import('./guild-roster-snapshots');
        return { Component: GuildRosterSnapshots };
    },
};
