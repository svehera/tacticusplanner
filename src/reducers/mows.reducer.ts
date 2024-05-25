import { SetStateAction } from '../models/interfaces';
import { IMow, IMowDb } from 'src/v2/features/characters/characters.models';

export type MowsAction =
    | {
          type: 'Update';
          mow: IMowDb;
      }
    | {
          type: 'UpdateAbilities';
          mowId: string;
          abilities: [primary: number, secondary: number];
      }
    | SetStateAction<IMow[]>;

export const mowsReducer = (state: IMow[], action: MowsAction) => {
    switch (action.type) {
        case 'Set': {
            return action.value;
        }
        case 'Update': {
            const { mow } = action;
            const existingMowIndex = state.findIndex(x => x.id === mow.id);
            const existingMow = state[existingMowIndex];

            if (!existingMow) {
                return state;
            }

            state[existingMowIndex] = {
                ...existingMow,
                ...mow,
            };

            return [...state];
        }
        case 'UpdateAbilities': {
            const { mowId, abilities } = action;
            const existingMowIndex = state.findIndex(x => x.id === mowId);
            const existingMow = state[existingMowIndex];

            if (!existingMow) {
                return state;
            }

            state[existingMowIndex] = {
                ...existingMow,
                primaryAbilityLevel: abilities[0],
                secondaryAbilityLevel: abilities[1],
            };

            return [...state];
        }
        default: {
            throw new Error();
        }
    }
};
