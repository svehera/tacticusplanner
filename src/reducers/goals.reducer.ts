import { CharacterRaidGoalSelect } from '@/fsd/3-features/goals/goals.models';
import { GoalsService } from '@/fsd/3-features/goals/goals.service';

import { IPersonalGoal, SetStateAction } from '../models/interfaces';

export type GoalsAction =
    | {
          type: 'Update';
          goal: CharacterRaidGoalSelect;
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
            const newState = [...state].sort((a, b) => a.priority - b.priority);

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
            if (state.find(x => x.id === action.goal.id)) {
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
            const existingGoalIndex = state.findIndex(x => x.id === updatedGoal.goalId);

            if (existingGoalIndex < 0) return state;
            const existingGoal = state[existingGoalIndex];

            const newGoalData = GoalsService.convertToGenericGoal(updatedGoal);
            if (!newGoalData) return state;

            // 1. Remove the goal from its current position
            const filteredState = state.filter(x => x.id !== updatedGoal.goalId);

            // 2. Insert the updated goal into the EXACT requested slot (Priority - 1)
            // We use Math.min/max to ensure we stay within array bounds
            const targetIndex = Math.max(0, Math.min(updatedGoal.priority - 1, filteredState.length));

            filteredState.splice(targetIndex, 0, {
                ...existingGoal,
                ...newGoalData,
                id: updatedGoal.goalId,
            });

            // 3. Re-index 1..N based on the new physical order
            return filteredState.map((g, index) => ({ ...g, priority: index + 1 }));
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
