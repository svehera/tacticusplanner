import { Alliance } from '@/fsd/5-shared/model';

import { defaultData } from '../models/constants';
import { IDailyRaidsPreferences, SetStateAction } from '../models/interfaces';

export type DailyRaidsPreferencesAction =
    | {
          type: 'Update';
          setting: keyof IDailyRaidsPreferences;
          value: boolean;
      }
    | {
          type: 'UpdateEnergy';
          value: number;
      }
    | {
          type: 'UpdateOnslaughtSector';
          alliance: Alliance;
          value: number;
      }
    | SetStateAction<IDailyRaidsPreferences>;

export const dailyRaidsPreferencesReducer = (
    state: IDailyRaidsPreferences,
    action: DailyRaidsPreferencesAction
): IDailyRaidsPreferences => {
    switch (action.type) {
        case 'Set': {
            return action.value ?? defaultData.dailyRaidsPreferences;
        }
        case 'Update': {
            return { ...state, [action.setting]: action.value };
        }
        case 'UpdateEnergy': {
            return { ...state, dailyEnergy: action.value };
        }
        case 'UpdateOnslaughtSector': {
            return {
                ...state,
                onslaughtSectors: {
                    ...(state.onslaughtSectors ?? defaultData.dailyRaidsPreferences.onslaughtSectors!),
                    [action.alliance]: action.value,
                },
            };
        }
        default: {
            // @ts-expect-error TS says this should never be reached but we want the error if it does
            throw new Error(`Unexpected action.type received in reducer: ${action.type}`);
        }
    }
};
