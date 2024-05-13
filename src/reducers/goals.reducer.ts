import { IPersonalGoal, SetStateAction } from '../models/interfaces';
import { CharacterRaidGoalSelect } from 'src/v2/features/goals/goals.models';
import { GoalsService } from 'src/v2/features/goals/goals.service';

export type GoalsAction =
    | {
          type: 'Update';
          goal: CharacterRaidGoalSelect;
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
          type: 'UpdateDailyRaids';
          value: Array<{ goalId: string; include: boolean }>;
      }
    | SetStateAction<IPersonalGoal[]>;

export const goalsReducer = (state: IPersonalGoal[], action: GoalsAction) => {
    switch (action.type) {
        case 'Set': {
            return action.value;
        }
        case 'Add': {
            if (state.find(x => x.id === action.goal.id)) {
                return state;
            }
            state.splice(action.goal.priority - 1, 0, action.goal);
            return [...state];
        }
        case 'Delete': {
            return state.filter(x => x.id !== action.goalId).map((x, index) => ({ ...x, priority: index + 1 }));
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
