import { RouteObject } from 'react-router-dom';

export const bulkGoalCreatorRoute: RouteObject = {
    path: 'plan/bulkGoals',
    async lazy() {
        const { BulkGoalCreator } = await import('./bulk-goal-creator');
        return { Component: BulkGoalCreator };
    },
};
