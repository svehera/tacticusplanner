import { SetStateAction } from '@/models/interfaces';

import { XpIncomeState } from '@/fsd/1-pages/input-xp-income';

import { defaultData } from '../models/constants';

export type XpIncomeAction =
    | SetStateAction<XpIncomeState>
    | {
          type: 'SaveXpIncomeState';
          value: XpIncomeState;
      };

export const xpIncomeActionReducer = (state: XpIncomeState, action: XpIncomeAction): XpIncomeState => {
    switch (action.type) {
        case 'Set': {
            return action.value ?? defaultData.xpIncome;
        }

        case 'SaveXpIncomeState': {
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
