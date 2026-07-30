import { describe, expect, it } from 'vitest';

import { defaultData } from '@/models/constants';
import { PersonalGoalType } from '@/models/enums';
import { GlobalState } from '@/models/global-state';
import { IGlobalState, IPersonalData2, IPersonalGoal } from '@/models/interfaces';
import { goalsReducer } from '@/reducers/goals.reducer';

const createGoal = (id: string, priority: number): IPersonalGoal => ({
    id,
    character: `char-${id}`,
    type: PersonalGoalType.UpgradeRank,
    priority,
    dailyRaids: true,
});

const orderOf = (goals: IPersonalGoal[]) => goals.map(goal => goal.id);

describe('GlobalState goals persistence', () => {
    it('keeps a reorder across save/load', () => {
        const baseState = new GlobalState(defaultData);
        const goals = [createGoal('a', 1), createGoal('b', 2), createGoal('c', 3)];

        const reordered = goalsReducer(goals, { type: 'Reorder', orderedIds: ['c', 'a', 'b'] });
        expect(orderOf(reordered)).toEqual(['c', 'a', 'b']);

        const stateToSave: IGlobalState = { ...baseState, goals: reordered };
        const stored = GlobalState.toStore(stateToSave);
        const restored = new GlobalState(stored);

        expect(orderOf(restored.goals)).toEqual(['c', 'a', 'b']);
        expect(restored.goals.map(goal => goal.priority)).toEqual([1, 2, 3]);
    });

    it('derives priority from array order, ignoring stored priority values', () => {
        // Ordering lives in the array, not the field — a payload whose priorities disagree with its
        // order (older data, or a caller that only rewrote the numbers) resolves to the array order.
        const stored: IPersonalData2 = {
            ...defaultData,
            goals: [createGoal('a', 30), createGoal('b', 10), createGoal('c', 20)],
        };

        const restored = new GlobalState(stored);

        expect(orderOf(restored.goals)).toEqual(['a', 'b', 'c']);
        expect(restored.goals.map(goal => goal.priority)).toEqual([1, 2, 3]);
    });
});
