import { CharacterRaidGoalSelect } from '@/fsd/3-features/goals/goals.models';
import { GoalsService } from '@/fsd/3-features/goals/goals.service';

import { IPersonalGoal, SetStateAction } from '../models/interfaces';

export type GoalsAction =
    | {
          type: 'Update';
          goal: CharacterRaidGoalSelect;
      }
    | {
          type: 'Swap'; // New action type
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

            const idxA = newState.findIndex(x => x.id === goalId);
            const idxB = newState.findIndex(x => x.id === neighborId);

            if (idxA !== -1 && idxB !== -1) {
                // Swap them in the array
                [newState[idxA], newState[idxB]] = [newState[idxB], newState[idxA]];

                // Re-index priorities 1..N
                return newState.map((g, i) => ({ ...g, priority: i + 1 }));
            }
            return state;
        }
        case 'Add': {
            if (state.find(x => x.id === action.goal.id)) {
                return state;
            }
            state.splice(action.goal.priority - 1, 0, action.goal);
            state.forEach((x, index) => {
                x.priority = index + 1;
            });
            return [...state];
        }
        case 'Delete': {
            return state.filter(x => x.id !== action.goalId).map((x, index) => ({ ...x, priority: index + 1 }));
        }
        case 'DeleteAll': {
            return [];
        }
        case 'Update': {
            const updatedGoal = action.goal;
            const newGoal = GoalsService.convertToGenericGoal(updatedGoal);
            const updatedGoalIndex = state.findIndex(x => x.id === updatedGoal.goalId);

            if (updatedGoalIndex < 0 || !newGoal) {
                return state;
            }

            state.splice(updatedGoalIndex, 1);
            state.splice(updatedGoal.priority - 1, 0, newGoal);

            return state.map((x, index) => ({ ...x, priority: index + 1 }));
        }
        case 'UpdateDailyRaids': {
            const { value } = action;

            return state.map(currGoal => {
                const newGoal = value.find(x => x.goalId === currGoal.id);
                if (newGoal) {
                    return { ...currGoal, dailyRaids: newGoal.include };
                }

                return currGoal;
            });
        }
        default: {
            throw new Error();
        }
    }
};
