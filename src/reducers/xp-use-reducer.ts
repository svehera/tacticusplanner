import { SetStateAction } from '@/models/interfaces';

import { XpUseState } from '@/fsd/1-pages/input-resources/models';

import { defaultData } from '../models/constants';

export type XpUseAction =
    | SetStateAction<XpUseState>
    | { type: 'Set'; value: XpUseState }
    | {
          type: 'SaveXpUseState';
          value: XpUseState;
      };

export const xpUseActionReducer = (state: XpUseState, action: XpUseAction): XpUseState => {
    switch (action.type) {
        case 'Set': {
            return action.value ?? defaultData.xpUseState;
        }

        case 'SaveXpUseState': {
            return {
                ...state,
                ...action.value,
            };
        }

        default: {
            throw new Error();
        }
    }
};
