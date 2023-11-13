import { IAutoTeamsPreferences, SetStateAction } from '../models/interfaces';
import { defaultData } from '../models/constants';

export type AutoTeamsPreferencesAction =
    | {
          type: 'Update';
          setting: keyof IAutoTeamsPreferences;
          value: boolean;
      }
    | SetStateAction<IAutoTeamsPreferences>;

export const autoTeamsPreferencesReducer = (
    state: IAutoTeamsPreferences,
    action: AutoTeamsPreferencesAction
): IAutoTeamsPreferences => {
    switch (action.type) {
        case 'Set': {
            return action.value ?? defaultData.autoTeamsPreferences;
        }
        case 'Update': {
            return { ...state, [action.setting]: action.value };
        }
        default: {
            throw new Error();
        }
    }
};
