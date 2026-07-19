import { IGoalEstimate } from './goals.models';

/**
 * A goal is "reached" when it is complete and not blocked. Single source of truth shared by the
 * goal card status pill, the table status column, completed markers, and row styling.
 */
export const isGoalReached = (estimate?: Pick<IGoalEstimate, 'completed' | 'blocked'>): boolean =>
    !!estimate?.completed && !estimate.blocked;
