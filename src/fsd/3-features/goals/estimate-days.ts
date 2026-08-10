import { IGoalEstimate } from './goals.models';

/**
 * Days until the goal is fully done — materials AND XP, whichever finishes later (0 if already done).
 * Single source of truth so the card header, card bodies, and the table's "Done By" agree.
 */
export const getDoneByDays = (estimate: Pick<IGoalEstimate, 'daysLeft' | 'xpDaysLeft'>): number =>
    Math.max(estimate.daysLeft, estimate.xpDaysLeft ?? 0, 0);

type XpBookCounts = Pick<IGoalEstimate, 'xpBooksApplied' | 'xpBooksRequired'>;

/**
 * Whether the goal needs XP books. Single implementation of the condition: XpBooksRow narrows with
 * it, the card bodies and table use it to decide whether to render the row's separator.
 */
export const hasXpBooks = (
    estimate: XpBookCounts | undefined
): estimate is XpBookCounts & { xpBooksApplied: number; xpBooksRequired: number } =>
    estimate?.xpBooksApplied !== undefined && estimate.xpBooksRequired !== undefined && estimate.xpBooksRequired > 0;
