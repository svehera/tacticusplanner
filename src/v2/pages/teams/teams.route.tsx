import { RouteObject } from 'react-router-dom';

export const teamsDesktopLazyRoute: RouteObject = {
    path: 'plan/teams',
    async lazy() {
        const { Teams } = await import('./teams.desktop');
        return { Component: Teams };
    },
};
