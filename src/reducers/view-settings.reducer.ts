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
            // @ts-expect-error This should not be reachable but we want to capture as much info as possible if it does
            throw new Error(`Invalid action type received: ${action.type}`);
        }
    }
};
