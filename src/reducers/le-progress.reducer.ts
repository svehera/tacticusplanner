import { ILegendaryEventProgressState, LegendaryEventData, SetStateAction } from '../models/interfaces';
import { LegendaryEventEnum } from '../models/enums';

export type LeProgressAction =
    | {
          type: 'Update';
          eventId: LegendaryEventEnum;
          value: ILegendaryEventProgressState;
      }
    | SetStateAction<LegendaryEventData<ILegendaryEventProgressState>>;

export const leProgressReducer = (
    state: LegendaryEventData<ILegendaryEventProgressState>,
    action: LeProgressAction
): LegendaryEventData<ILegendaryEventProgressState> => {
    switch (action.type) {
        case 'Set': {
            return action.value;
        }
        case 'Update': {
            return { ...state, [action.eventId]: action.value };
        }
        default: {
            throw new Error();
        }
    }
};
