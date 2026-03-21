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
            // @ts-expect-error TS says this should never be reached but we want the error if it does
            throw new Error(`Unexpected action.type received in reducer: ${action.type}`);
        }
    }
};
