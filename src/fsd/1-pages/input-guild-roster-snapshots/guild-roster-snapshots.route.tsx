import { RouteObject } from 'react-router-dom';

export const guildRosterSnapshotsLazyRoute: RouteObject = {
    path: 'input/guild-roster-snapshots',
    handle: {
        section: 'My Game',
        title: 'Guild Roster Snapshots',
        description: 'Guild leaders: pull live roster snapshots for all members via the Tacticus API.',
    },
    async lazy() {
        const { GuildRosterSnapshots } = await import('./guild-roster-snapshots');
        return { Component: GuildRosterSnapshots };
    },
};
