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
            // @ts-expect-error This should not be reachable but we want to capture as much info as possible if it does
            throw new Error(`Invalid action type received: ${action.type}`);
        }
    }
};
