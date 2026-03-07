import { IViewPreferences, SetStateAction } from '../models/interfaces';

export type ViewPreferencesAction =
    | {
          type: 'Update';
          setting: keyof IViewPreferences;
          value: boolean | number | string | string[];
      }
    | SetStateAction<IViewPreferences>;

export const viewPreferencesReducer = (state: IViewPreferences, action: ViewPreferencesAction) => {
    switch (action.type) {
        case 'Set': {
            return action.value;
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
