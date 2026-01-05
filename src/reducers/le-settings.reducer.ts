import { ILegendaryEventSettings, SetStateAction } from '../models/interfaces';

export type LeSettingsAction =
    | {
          type: 'Set';
          value: ILegendaryEventSettings;
      }
    | SetStateAction<ILegendaryEventSettings>;

export const leSettingsReducer = (
    state: ILegendaryEventSettings,
    action: LeSettingsAction
): ILegendaryEventSettings => {
    switch (action.type) {
        case 'Set': {
            return state;
        }
        default: {
            throw new Error();
        }
    }
};
