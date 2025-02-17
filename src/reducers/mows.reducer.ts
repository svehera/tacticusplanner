import { SetStateAction } from '../models/interfaces';
import { IMow, IMowDb } from 'src/v2/features/characters/characters.models';
import { rarityToStars } from 'src/models/constants';
import { TacticusUnit } from 'src/v2/features/tacticus-integration/tacticus-integration.models';
import { TacticusIntegrationService } from 'src/v2/features/tacticus-integration/tacticus-integration.service';

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
    | {
          type: 'SyncWithTacticus';
          units: TacticusUnit[];
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
            const rarityStars = rarityToStars[mow.rarity];

            state[existingMowIndex] = {
                ...existingMow,
                ...mow,
                stars: mow.stars <= rarityStars ? rarityStars : mow.stars,
            };

            return [...state];
        }
        case 'SyncWithTacticus': {
            const { units } = action;

            for (const tacticusUnit of units) {
                const existingMowIndex = state.findIndex(x => x.tacticusId === tacticusUnit.id);
                const existingMow = state[existingMowIndex];

                if (!existingMow) {
                    continue;
                }
                const [rarity, stars] = TacticusIntegrationService.convertProgressionIndex(
                    tacticusUnit.progressionIndex
                );

                state[existingMowIndex] = {
                    ...existingMow,
                    unlocked: true,
                    rarity,
                    stars,
                    primaryAbilityLevel: tacticusUnit.abilities[0].level,
                    secondaryAbilityLevel: tacticusUnit.abilities[1].level,
                    shards: tacticusUnit.shards,
                };
            }

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
