import { WarOffense2State } from '@/fsd/1-pages/plan-war-offense2/models';

import { SetStateAction } from '../models/interfaces';

export type WarOffense2Action = SetStateAction<WarOffense2State>;

export const warOffense2Reducer = (_state: WarOffense2State, action: WarOffense2Action) => {
    switch (action.type) {
        case 'Set': {
            return action.value;
        }
        default: {
            throw new Error();
        }
    }
};
