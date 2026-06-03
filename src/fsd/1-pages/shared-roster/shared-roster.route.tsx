import { RouteObject } from 'react-router-dom';

export const sharedRosterRoute: RouteObject = {
    path: 'sharedRoster',
    handle: { title: 'Shared Roster', description: "View a read-only snapshot of another player's shared roster." },
    async lazy() {
        const { SharedRoster } = await import('./shared-roster');
        return { Component: SharedRoster };
    },
};
