import { RouteObject } from 'react-router-dom';

export const rosterSnapshotsLazyRoute: RouteObject = {
    path: 'input/roster-snapshots',
    handle: {
        section: 'My Game',
        title: 'Roster Snapshots',
        description: 'Compare snapshots of your roster over time to track progression.',
    },
    async lazy() {
        const { RosterSnapshots } = await import('./roster-snapshots');
        return { Component: RosterSnapshots };
    },
};
