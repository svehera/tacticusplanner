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
        default: {
            // @ts-expect-error This should not be reachable but we want to capture as much info as possible if it does
            throw new Error(`Invalid action type received: ${action.type}`);
        }
    }
};
