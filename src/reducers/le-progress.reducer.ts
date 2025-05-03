import { LegendaryEventEnum } from '@/fsd/4-entities/lre';

import { ILreProgressDto } from '@/fsd/3-features/lre-progress';

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
