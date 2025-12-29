import { RouteObject } from 'react-router-dom';

export const rosterSnapshotsLazyRoute: RouteObject = {
    path: 'input/roster-snapshots',
    async lazy() {
        const { RosterSnapshots } = await import('./roster-snapshots');
        return { Component: RosterSnapshots };
    },
};
