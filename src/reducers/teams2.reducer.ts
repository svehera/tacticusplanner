import { ITeam2 } from '@/fsd/1-pages/plan-teams2/models';

import { SetStateAction } from '../models/interfaces';

export type Teams2Action = SetStateAction<ITeam2[]>;

export const teams2Reducer = (_state: ITeam2[], action: Teams2Action) => {
    switch (action.type) {
        case 'Set': {
            return action.value;
        }
        default: {
            throw new Error();
        }
    }
};
