import { moveItem } from '@/fsd/5-shared/lib';

/**
 * Computes the new order when one goal moves by `delta` positions (negative is up). Used by the
 * priority arrows against the *global* order, so a move can cross an accordion section boundary.
 *
 * Returns `undefined` when the move is not possible — unknown goal, or past either end — so callers
 * can skip dispatching a no-op reorder.
 */
export const moveGoalInOrder = (orderedIds: readonly string[], goalId: string, delta: number): string[] | undefined => {
    const from = orderedIds.indexOf(goalId);
    if (from === -1) return;

    const to = from + delta;
    if (to < 0 || to >= orderedIds.length) return;

    return moveItem(orderedIds, from, to);
};
