import { ISelectedTeamsOrdering, SetStateAction } from '../models/interfaces';

export type SelectedTeamsOrderingAction =
    | {
          type: 'UpdateOrder';
          value: 'name' | 'rank' | 'rarity';
      }
    | {
          type: 'UpdateDirection';
          value: 'asc' | 'desc';
      }
    | SetStateAction<ISelectedTeamsOrdering>;

export const selectedTeamsOrderReducer = (state: ISelectedTeamsOrdering, action: SelectedTeamsOrderingAction) => {
    switch (action.type) {
        case 'Set': {
            return action.value;
        }
        case 'UpdateOrder': {
            state.orderBy = action.value;
            return { ...state };
        }
        case 'UpdateDirection': {
            state.direction = action.value;
            return { ...state };
        }
        default: {
            throw new Error();
        }
    }
};
