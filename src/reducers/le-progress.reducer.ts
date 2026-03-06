import { LegendaryEventEnum } from '@/fsd/4-entities/lre';

import { ILreProgressDto } from '@/fsd/3-features/lre-progress';

import { LegendaryEventData, SetStateAction } from '../models/interfaces';

export type LeProgressAction =
    | {
          type: 'Update';
          eventId: LegendaryEventEnum;
          value: ILreProgressDto;
      }
    | {
          type: 'SyncWithTacticus';
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
        case 'SyncWithTacticus': {
            return { ...state, [action.eventId]: action.value };
        }
        default: {
            // @ts-expect-error - TS thinks this is impossible but let's get runtime information in case it does happen
            throw new Error(`Invalid action type: ${action.type}`);
        }
    }
};
