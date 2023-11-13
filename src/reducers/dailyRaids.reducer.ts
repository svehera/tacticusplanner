import { IDailyRaids, SetStateAction } from '../models/interfaces';

export type DailyRaidsAction =
    | {
          type: 'AddCompletedBattle';
          battle: string;
      }
    | {
          type: 'ResetCompletedBattles';
      }
    | {
          type: 'ResetCompletedBattlesDaily';
      }
    | SetStateAction<IDailyRaids>;

export const dailyRaidsReducer = (state: IDailyRaids, action: DailyRaidsAction): IDailyRaids => {
    switch (action.type) {
        case 'Set': {
            return action.value;
        }
        case 'AddCompletedBattle': {
            return {
                ...state,
                completedBattles: [...state.completedBattles, action.battle],
            };
        }
        case 'ResetCompletedBattles': {
            return { ...state, completedBattles: [] };
        }
        case 'ResetCompletedBattlesDaily': {
            return { ...state, completedBattles: [], lastRefreshDateUTC: new Date().toUTCString() };
        }
        default: {
            throw new Error();
        }
    }
};
