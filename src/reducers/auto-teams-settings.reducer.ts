import { defaultData } from '../models/constants';
import { IAutoTeamsPreferences, SetStateAction } from '../models/interfaces';

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
            // @ts-expect-error - TS thinks this is impossible but let's get runtime information in case it does happen
            throw new Error(`Invalid action type: ${action.type}`);
        }
    }
};
