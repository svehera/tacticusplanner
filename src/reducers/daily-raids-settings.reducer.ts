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

export const dailyRaidsPreferencesReducer = (state: IDailyRaidsPreferences, action: DailyRaidsPreferencesAction) => {
    switch (action.type) {
        case 'Set': {
            return action.value;
        }
        case 'Update': {
            return { ...state, [action.setting]: action.value };
        }
        case 'UpdateEnergy': {
            return { ...state, dailyEnergy: action.value };
        }
        default: {
            throw new Error();
        }
    }
};
