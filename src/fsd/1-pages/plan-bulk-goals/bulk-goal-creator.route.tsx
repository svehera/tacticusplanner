import { RouteObject } from 'react-router-dom';

export const bulkGoalCreatorRoute: RouteObject = {
    path: 'plan/bulkGoals',
    handle: {
        section: 'Plan',
        title: 'Bulk Goals',
        description: 'Create upgrade goals for multiple characters at once from a single form.',
    },
    async lazy() {
        const { BulkGoalCreator } = await import('./bulk-goal-creator');
        return { Component: BulkGoalCreator };
    },
};
