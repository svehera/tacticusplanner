import { TypedGoalSelect } from '@/fsd/3-features/goals/goals.models';
import { GoalsService } from '@/fsd/3-features/goals/goals.service';

import { IPersonalGoal, SetStateAction } from '../models/interfaces';

export type GoalsAction =
    | {
          type: 'Update';
          goal: TypedGoalSelect;
      }
    | {
          type: 'Swap';
          goalId: string;
          neighborId: string;
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
            return action.value;
        }
        case 'Swap': {
            const { goalId, neighborId } = action;
            const newState = state.toSorted((a, b) => a.priority - b.priority);

            const indexA = newState.findIndex(x => x.id === goalId);
            const indexB = newState.findIndex(x => x.id === neighborId);

            if (indexA !== -1 && indexB !== -1) {
                // Swap them in the array
                [newState[indexA], newState[indexB]] = [newState[indexB], newState[indexA]];

                // Re-index priorities 1..N
                return newState.map((g, index) => ({ ...g, priority: index + 1 }));
            }
            return state;
        }
        case 'Add': {
            if (state.some(x => x.id === action.goal.id)) {
                return state;
            }
            // Create a new array instead of mutating the existing state with splice
            const newState = [...state];
            const targetIndex = Math.max(0, Math.min(action.goal.priority - 1, newState.length));
            newState.splice(targetIndex, 0, action.goal);

            // Return a new array with re-indexed priorities to ensure reactivity
            return newState.map((x, index) => ({
                ...x,
                priority: index + 1,
            }));
        }
        case 'Delete': {
            return state.filter(x => x.id !== action.goalId).map((x, index) => ({ ...x, priority: index + 1 }));
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

            return finalGoals.map((g, index) => ({ ...g, priority: index + 1 }));
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
