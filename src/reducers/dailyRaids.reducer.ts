import { IDailyRaids, IDailyRaidsFilters, IMaterialRaid, IRaidLocation, SetStateAction } from '../models/interfaces';
import { defaultData } from '../models/constants';

export type DailyRaidsAction =
    | {
          type: 'AddCompletedBattle';
          location: IRaidLocation;
          material: IMaterialRaid;
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
            const existingMaterialIndex = state.completedLocations.findIndex(
                x => x.materialId === action.material.materialId
            );
            if (existingMaterialIndex >= 0) {
                const existingMaterial = state.completedLocations[existingMaterialIndex];
                if (existingMaterial.locations.some(x => x.id === action.location.id)) {
                    return state;
                }

                state.completedLocations[existingMaterialIndex] = {
                    ...existingMaterial,
                    locations: [...existingMaterial.locations, action.location],
                };
                return {
                    ...state,
                    completedLocations: [...state.completedLocations],
                };
            }
            action.material.locations = [action.location];
            return {
                ...state,
                completedLocations: [...state.completedLocations, action.material],
            };
        }
        case 'ResetCompletedBattles': {
            return { ...state, completedLocations: [] };
        }
        case 'ResetCompletedBattlesDaily': {
            return {
                ...state,
                completedLocations: [],
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
