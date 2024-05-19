import { IDailyRaids, IDailyRaidsFilters, SetStateAction } from '../models/interfaces';
import { defaultData } from '../models/constants';
import { IItemRaidLocation } from 'src/v2/features/goals/goals.models';

export type DailyRaidsAction =
    | {
          type: 'AddCompletedBattle';
          location: IItemRaidLocation;
      }
    | {
          type: 'ResetCompletedBattles';
      }
    | {
          type: 'ResetCompletedBattlesDaily';
      }
    | {
          type: 'UpdateFilters';
          value: IDailyRaidsFilters;
      }
    | SetStateAction<IDailyRaids>;

export const dailyRaidsReducer = (state: IDailyRaids, action: DailyRaidsAction): IDailyRaids => {
    switch (action.type) {
        case 'Set': {
            return action.value ?? defaultData.dailyRaids;
        }
        case 'AddCompletedBattle': {
            return {
                ...state,
                raidedLocations: [...state.raidedLocations, action.location],
            };
        }
        case 'ResetCompletedBattles': {
            return { ...state, raidedLocations: [] };
        }
        case 'ResetCompletedBattlesDaily': {
            return {
                ...state,
                raidedLocations: [],
                lastRefreshDateUTC: new Date().toUTCString(),
            };
        }
        case 'UpdateFilters': {
            const { value } = action;
            return {
                ...state,
                filters: value,
            };
        }
        default: {
            throw new Error();
        }
    }
};
