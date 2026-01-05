import { ILegendaryEventSettings, SetStateAction } from '../models/interfaces';

export type LeSettingsAction =
    | {
          type: 'Set';
          value: ILegendaryEventSettings;
      }
    | SetStateAction<ILegendaryEventSettings>;

export const leSettingsReducer = (_: ILegendaryEventSettings, action: LeSettingsAction): ILegendaryEventSettings => {
    switch (action.type) {
        case 'Set': {
            return action.value;
        }
        default: {
            throw new Error();
        }
    }
};
