import { normalizeGoalOrder } from '@/fsd/4-entities/goal';

import { TypedGoalSelect } from '@/fsd/3-features/goals/goals.models';
import { GoalsService } from '@/fsd/3-features/goals/goals.service';

import { IPersonalGoal, SetStateAction } from '../models/interfaces';

export type GoalsAction =
    | {
          type: 'Update';
          goal: TypedGoalSelect;
      }
    | {
          /** The reordered goals in their new order. Goals not listed keep their array slots. */
          type: 'Reorder';
          orderedIds: string[];
      }
    | {
          type: 'Add';
          goal: IPersonalGoal;
      }
    | {
          type: 'Delete';
          goalId: string;
      }
    | {
          type: 'DeleteAll';
      }
    | {
          type: 'UpdateDailyRaids';
          value: Array<{ goalId: string; include: boolean }>;
      }
    | SetStateAction<IPersonalGoal[]>;

export const goalsReducer = (state: IPersonalGoal[], action: GoalsAction) => {
    switch (action.type) {
        case 'Set': {
            return normalizeGoalOrder(action.value);
        }
        case 'Reorder': {
            // Rewrites the listed goals into the slots they already occupy, so everything else keeps
            // its position and no assumption is made about the array being priority-sorted.
            const idSet = new Set(action.orderedIds);
            const slots: number[] = [];
            for (const [index, goal] of state.entries()) {
                if (idSet.has(goal.id)) slots.push(index);
            }
            // Unknown or duplicated ids would drop goals — refuse the whole operation instead.
            if (slots.length !== action.orderedIds.length) {
                return state;
            }

            const byId = new Map(state.map(goal => [goal.id, goal]));
            const newState = [...state];
            for (const [position, slot] of slots.entries()) {
                newState[slot] = byId.get(action.orderedIds[position])!;
            }
            return normalizeGoalOrder(newState);
        }
        case 'Add': {
            if (state.some(x => x.id === action.goal.id)) {
                return state;
            }
            // Create a new array instead of mutating the existing state with splice
            const newState = [...state];
            const targetIndex = Math.max(0, Math.min(action.goal.priority - 1, newState.length));
            newState.splice(targetIndex, 0, action.goal);

            return normalizeGoalOrder(newState);
        }
        case 'Delete': {
            const deletedId = action.goalId;
            const remaining = state
                .filter(x => x.id !== deletedId)
                .map(x =>
                    x.preFarmGoalIds ? { ...x, preFarmGoalIds: x.preFarmGoalIds.filter(id => id !== deletedId) } : x
                );
            return normalizeGoalOrder(remaining);
        }
        case 'DeleteAll': {
            return [];
        }
        case 'Update': {
            const updatedGoal = action.goal;
            const existingGoal = state.find(x => x.id === updatedGoal.goalId);

            if (!existingGoal) {
                return state;
            }

            const newGoalData = GoalsService.convertToGenericGoal(updatedGoal);
            if (!newGoalData) {
                return state;
            }

            const goalWithUpdates = {
                ...existingGoal,
                ...newGoalData,
                id: updatedGoal.goalId,
            };

            const otherGoals = state.filter(x => x.id !== updatedGoal.goalId);

            const targetIndex = Math.max(0, Math.min(updatedGoal.priority - 1, otherGoals.length));

            const finalGoals = [...otherGoals.slice(0, targetIndex), goalWithUpdates, ...otherGoals.slice(targetIndex)];

            return normalizeGoalOrder(finalGoals);
        }
        case 'UpdateDailyRaids': {
            const { value } = action;

            return state.map(currentGoal => {
                const newGoal = value.find(x => x.goalId === currentGoal.id);
                if (newGoal) {
                    return { ...currentGoal, dailyRaids: newGoal.include };
                }

                return currentGoal;
            });
        }
        default: {
            // @ts-expect-error TS says this should never be reached but we want the error if it does
            throw new Error(`Unexpected action.type received in reducer: ${action.type}`);
        }
    }
};
