import { IGoalEstimate } from './goals.models';

/**
 * Days until the goal is fully done — materials AND XP, whichever finishes later (0 if already done).
 * Single source of truth so the card header, card bodies, and the table's "Done By" agree.
 */
export const getDoneByDays = (estimate: Pick<IGoalEstimate, 'daysLeft' | 'xpDaysLeft'>): number =>
    Math.max(estimate.daysLeft, estimate.xpDaysLeft ?? 0, 0);
