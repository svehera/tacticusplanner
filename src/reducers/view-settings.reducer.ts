import { IViewPreferences, SetStateAction } from '../models/interfaces';

export type ViewPreferencesAction =
    | {
          type: 'Update';
          setting: keyof IViewPreferences;
          value: boolean | number;
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
            throw new Error();
        }
    }
};
