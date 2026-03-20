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
            // @ts-expect-error TS says this should never be reached but we want the error if it does
            throw new Error(`Unexpected action.type received in reducer: ${action.value}`);
        }
    }
};
