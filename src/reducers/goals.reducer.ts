import { IPersonalGoal, SetStateAction } from '../models/interfaces';
import { PersonalGoalType } from '../models/enums';

export type GoalsAction =
    | {
          type: 'Update';
          goal: IPersonalGoal;
      }
    | {
          type: 'Add';
          goal: IPersonalGoal;
      }
    | {
          type: 'Delete';
          goalId: string;
      }
    | SetStateAction<IPersonalGoal[]>;

const deleteRedundantData = (goal: IPersonalGoal) => {
    switch (goal.type) {
        case PersonalGoalType.Unlock: {
            delete goal.targetRank;
            delete goal.targetRarity;
            break;
        }
        case PersonalGoalType.UpgradeRank: {
            delete goal.targetRarity;
            break;
        }
        case PersonalGoalType.Ascend: {
            delete goal.targetRarity;
            break;
        }
    }
    if (!goal.notes) {
        delete goal.notes;
    }
};

export const goalsReducer = (state: IPersonalGoal[], action: GoalsAction) => {
    switch (action.type) {
        case 'Set': {
            return action.value;
        }
        case 'Add': {
            if (state.find(x => x.id === action.goal.id)) {
                return state;
            }
            deleteRedundantData(action.goal);
            state.splice(action.goal.priority - 1, 0, action.goal);
            return [...state];
        }
        case 'Delete': {
            return state.filter(x => x.id !== action.goalId);
        }
        case 'Update': {
            const updatedGoal = action.goal;

            const updatedGoalIndex = state.findIndex(x => x.id === updatedGoal.id);
            if (updatedGoalIndex < 0) {
                return state;
            }
            deleteRedundantData(updatedGoal);
            state.splice(updatedGoalIndex, 1);
            state.splice(updatedGoal.priority - 1, 0, updatedGoal);

            return [...state];
        }
        default: {
            throw new Error();
        }
    }
};
