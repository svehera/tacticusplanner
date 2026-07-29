import { describe, expect, it } from 'vitest';

import { moveGoalInOrder } from './reorder';

// The global goal order, interleaving two accordion sections the way the goals page does — the
// arrows move a goal one step in THIS list, so a move can cross a section boundary.
const ORDER = ['ascend-1', 'upgrade-2', 'upgrade-3', 'ascend-4'];

describe('moveGoalInOrder', () => {
    describe('moving up', () => {
        it('swaps the goal with the one above it', () => {
            expect(moveGoalInOrder(ORDER, 'upgrade-3', -1)).toEqual(['ascend-1', 'upgrade-3', 'upgrade-2', 'ascend-4']);
        });

        it('moves a goal past a neighbour from another section', () => {
            // upgrade-2 is first in its own section but second globally, so it can still move up.
            expect(moveGoalInOrder(ORDER, 'upgrade-2', -1)).toEqual(['upgrade-2', 'ascend-1', 'upgrade-3', 'ascend-4']);
        });

        it('returns undefined only for the globally first goal', () => {
            expect(moveGoalInOrder(ORDER, 'ascend-1', -1)).toBeUndefined();
        });
    });

    describe('moving down', () => {
        it('swaps the goal with the one below it', () => {
            expect(moveGoalInOrder(ORDER, 'upgrade-2', 1)).toEqual(['ascend-1', 'upgrade-3', 'upgrade-2', 'ascend-4']);
        });

        it('returns undefined only for the globally last goal', () => {
            expect(moveGoalInOrder(ORDER, 'ascend-4', 1)).toBeUndefined();
        });
    });

    describe('edge cases', () => {
        it('returns undefined when the goal is not in the list', () => {
            expect(moveGoalInOrder(ORDER, 'not-here', 1)).toBeUndefined();
        });

        it('returns undefined for a single-goal list in either direction', () => {
            expect(moveGoalInOrder(['only'], 'only', -1)).toBeUndefined();
            expect(moveGoalInOrder(['only'], 'only', 1)).toBeUndefined();
        });

        it('returns undefined when a multi-step move would overshoot the end', () => {
            expect(moveGoalInOrder(ORDER, 'upgrade-3', 2)).toBeUndefined();
        });

        it('supports multi-step moves that stay in range', () => {
            expect(moveGoalInOrder(ORDER, 'ascend-1', 3)).toEqual(['upgrade-2', 'upgrade-3', 'ascend-4', 'ascend-1']);
        });

        it('does not mutate the list', () => {
            const order = ['a', 'b', 'c'];
            moveGoalInOrder(order, 'a', 1);
            expect(order).toEqual(['a', 'b', 'c']);
        });
    });
});
