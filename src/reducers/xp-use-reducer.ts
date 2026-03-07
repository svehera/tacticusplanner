import { SetStateAction } from '@/models/interfaces';

import { XpUseState } from '@/fsd/1-pages/input-resources/models';

import { defaultData } from '../models/constants';

export type XpUseAction =
    | SetStateAction<XpUseState>
    | {
          type: 'SaveXpUseState';
          value: XpUseState;
      };

export const xpUseActionReducer = (state: XpUseState, action: XpUseAction): XpUseState => {
    switch (action.type) {
        case 'Set': {
            return action.value ?? defaultData.xpUse;
        }

        case 'SaveXpUseState': {
            return {
                ...state,
                ...action.value,
            };
        }

        default: {
            // @ts-expect-error - TS thinks this is impossible but let's get runtime information in case it does happen
            throw new Error(`Invalid action type: ${action.type}`);
        }
    }
};
