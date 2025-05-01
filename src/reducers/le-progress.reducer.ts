import { ILreProgressDto } from 'src/models/dto.interfaces';

import { LegendaryEventEnum } from '../models/enums';
import { LegendaryEventData, SetStateAction } from '../models/interfaces';

export type LeProgressAction =
    | {
          type: 'Update';
          eventId: LegendaryEventEnum;
          value: ILreProgressDto;
      }
    | SetStateAction<LegendaryEventData<ILreProgressDto>>;

export const leProgressReducer = (
    state: LegendaryEventData<ILreProgressDto>,
    action: LeProgressAction
): LegendaryEventData<ILreProgressDto> => {
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
