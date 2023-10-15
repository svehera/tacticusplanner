import { IAutoTeamsPreferences, SetStateAction } from '../models/interfaces';

export type AutoTeamsPreferencesAction =
    | {
          type: 'Update';
          setting: keyof IAutoTeamsPreferences;
          value: boolean;
      }
    | SetStateAction<IAutoTeamsPreferences>;

export const autoTeamsPreferencesReducer = (state: IAutoTeamsPreferences, action: AutoTeamsPreferencesAction) => {
    switch (action.type) {
        case 'Set': {
            return action.value;
        }
        case 'Update': {
            return { ...state, [action.setting]: action.value };
        }
        default: {
            throw new Error();
        }
    }
};
