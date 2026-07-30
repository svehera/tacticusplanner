import { describe, expect, it } from 'vitest';

import { PersonalGoalType } from '@/models/enums';
import { IPersonalGoal } from '@/models/interfaces';
import { goalsReducer } from '@/reducers/goals.reducer';

const createGoal = (id: string, priority: number, overrides: Partial<IPersonalGoal> = {}): IPersonalGoal => ({
    id,
    character: `char-${id}`,
    type: PersonalGoalType.UpgradeRank,
    priority,
    dailyRaids: true,
    ...overrides,
});

/** Three "upgrade" goals interleaved with two "shard" goals, mimicking the goals page's sections. */
const createInterleavedState = (): IPersonalGoal[] => [
    createGoal('upgrade-a', 1),
    createGoal('shard-a', 2, { type: PersonalGoalType.Ascend }),
    createGoal('upgrade-b', 3),
    createGoal('shard-b', 4, { type: PersonalGoalType.Ascend }),
    createGoal('upgrade-c', 5),
];

const orderOf = (goals: IPersonalGoal[]) => goals.map(goal => goal.id);

describe('goalsReducer Reorder', () => {
    it('reorders one section without disturbing goals outside it', () => {
        const next = goalsReducer(createInterleavedState(), {
            type: 'Reorder',
            orderedIds: ['upgrade-c', 'upgrade-a', 'upgrade-b'],
        });

        // The section's goals are rewritten into the slots they already occupied (0, 2, 4), so the
        // shard goals keep their exact array positions.
        expect(orderOf(next)).toEqual(['upgrade-c', 'shard-a', 'upgrade-a', 'shard-b', 'upgrade-b']);
    });

    it('re-indexes priority to match array position', () => {
        const next = goalsReducer(createInterleavedState(), {
            type: 'Reorder',
            orderedIds: ['upgrade-c', 'upgrade-a', 'upgrade-b'],
        });

        expect(next.map(goal => goal.priority)).toEqual([1, 2, 3, 4, 5]);
    });

    it('is a no-op when an id is not in state', () => {
        const state = createInterleavedState();

        const next = goalsReducer(state, {
            type: 'Reorder',
            orderedIds: ['upgrade-c', 'upgrade-a', 'does-not-exist'],
        });

        expect(next).toBe(state);
    });

    it('is a no-op when ids are duplicated', () => {
        const state = createInterleavedState();

        const next = goalsReducer(state, {
            type: 'Reorder',
            orderedIds: ['upgrade-a', 'upgrade-a', 'upgrade-b'],
        });

        expect(next).toBe(state);
    });
});

describe('goalsReducer Set', () => {
    it('normalizes priority to array order', () => {
        // A caller that rewrote priority numbers without reordering the array — the exact shape that
        // silently lost drag-reorders, since only array order survives a save/load round trip.
        const misaligned = [createGoal('a', 3), createGoal('b', 1), createGoal('c', 2)];

        const next = goalsReducer([], { type: 'Set', value: misaligned });

        expect(orderOf(next)).toEqual(['a', 'b', 'c']);
        expect(next.map(goal => goal.priority)).toEqual([1, 2, 3]);
    });
});

describe('goalsReducer Delete', () => {
    it('re-indexes and strips the deleted id from other goals preFarmGoalIds', () => {
        const state = [createGoal('a', 1), createGoal('b', 2, { preFarmGoalIds: ['a', 'c'] }), createGoal('c', 3)];

        const next = goalsReducer(state, { type: 'Delete', goalId: 'a' });

        expect(orderOf(next)).toEqual(['b', 'c']);
        expect(next.map(goal => goal.priority)).toEqual([1, 2]);
        expect(next[0].preFarmGoalIds).toEqual(['c']);
    });
});
