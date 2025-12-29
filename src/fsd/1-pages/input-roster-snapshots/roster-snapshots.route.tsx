import { RouteObject } from 'react-router-dom';

export const rosterSnapshotsLazyRoute: RouteObject = {
    path: 'input/rostersnapshots',
    async lazy() {
        const { RosterSnapshots } = await import('./roster-snapshots');
        return { Component: RosterSnapshots };
    },
};
