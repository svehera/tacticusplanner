import { WarDefense2State } from '@/fsd/1-pages/plan-war-defense-2/models';

import { SetStateAction } from '../models/interfaces';

export type WarDefense2Action = SetStateAction<WarDefense2State>;

export const warDefense2Reducer = (_state: WarDefense2State, action: WarDefense2Action) => {
    switch (action.type) {
        case 'Set': {
            return action.value;
        }
        default: {
            throw new Error();
        }
    }
};
