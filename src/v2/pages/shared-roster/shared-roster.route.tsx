import { RouteObject } from 'react-router-dom';

export const sharedRosterRoute: RouteObject = {
    path: 'sharedRoster',
    async lazy() {
        const { SharedRoster } = await import('./shared-roster');
        return { Component: SharedRoster };
    },
};
