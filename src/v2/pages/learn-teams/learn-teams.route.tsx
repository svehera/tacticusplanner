import { RouteObject } from 'react-router-dom';

export const learnTeamsLazyRoute: RouteObject = {
    path: 'learn/teams',
    async lazy() {
        const { LearnTeams } = await import('./learn-teams');
        return { Component: LearnTeams };
    },
};
