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
            // @ts-expect-error This should not be reachable but we want to capture as much info as possible if it does
            throw new Error(`Invalid action type received: ${action.type}`);
        }
    }
};
