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
    | {
          type: 'UpdateDailyRaids';
          goalId: string;
          value: boolean;
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
            delete goal.targetRank;
            break;
        }
    }
    if (!goal.notes) {
        delete goal.notes;
    }

    if (!goal.currentRank) {
        delete goal.currentRank;
    }

    if (!goal.currentRarity) {
        delete goal.currentRarity;
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
            return state.filter(x => x.id !== action.goalId).map((x, index) => ({ ...x, priority: index + 1 }));
        }
        case 'Update': {
            const updatedGoal = action.goal;
            deleteRedundantData(updatedGoal);

            const updatedGoalIndex = state.findIndex(x => x.id === updatedGoal.id);
            if (updatedGoalIndex < 0) {
                return state;
            }
            const currentGoal = state[updatedGoalIndex];
            if (currentGoal.priority === updatedGoal.priority) {
                currentGoal.notes = updatedGoal.notes;
                currentGoal.targetRank = updatedGoal.targetRank;
                currentGoal.targetRarity = updatedGoal.targetRarity;
                currentGoal.shardsPerDayOrToken = updatedGoal.shardsPerDayOrToken;
                currentGoal.energyPerDay = updatedGoal.energyPerDay;
                currentGoal.rankPoint5 = updatedGoal.rankPoint5;
            } else {
                state.splice(updatedGoalIndex, 1);
                state.splice(updatedGoal.priority - 1, 0, updatedGoal);
            }

            return state.map((x, index) => ({ ...x, priority: index + 1 }));
        }
        case 'UpdateDailyRaids': {
            const { goalId, value } = action;

            const updatedGoalIndex = state.findIndex(x => x.id === goalId);
            if (updatedGoalIndex < 0) {
                return state;
            }
            const currentGoal = state[updatedGoalIndex];
            currentGoal.dailyRaids = value;

            return [...state];
        }
        default: {
            throw new Error();
        }
    }
};
