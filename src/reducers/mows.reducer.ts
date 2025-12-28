import { SetStateAction } from '@/models/interfaces';
import { rarityToStars } from 'src/models/constants';

import { TacticusShard, TacticusUnit } from '@/fsd/5-shared/lib/tacticus-api/tacticus-api.models';
import { Rarity, RarityStars } from '@/fsd/5-shared/model/enums';

import { MowsService } from '@/fsd/4-entities/mow';

import { IMow, IMow2, IMowDb } from '@/v2/features/characters/characters.models';
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
          shards: TacticusShard[];
      }
    | SetStateAction<Array<IMow | IMow2>>;

export const mowsReducer = (state: Array<IMow | IMow2>, action: MowsAction) => {
    const resolvedMows = MowsService.resolveAllFromStorage(state);

    switch (action.type) {
        case 'Set': {
            return action.value;
        }
        case 'Update': {
            const { mow } = action;
            const existingMowIndex = state.findIndex(
                x =>
                    x.id === mow.id ||
                    ('tacticusId' in x && x.tacticusId === mow.id) ||
                    ('snowprintId' in x && x.snowprintId !== undefined && x.snowprintId === mow.id)
            );
            let existingMow = state[existingMowIndex];

            if (!existingMow) {
                state.push({ ...MowsService.resolveToStatic(mow.id), ...mow } as IMow | IMow2);
                existingMow = state[state.length - 1];
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
            const { units, shards } = action;
            const getId = (existingMow: IMow | IMow2) =>
                'tacticusId' in existingMow ? existingMow.tacticusId : existingMow.snowprintId;

            const resolved = resolvedMows.map(existingMow => {
                const tacticusUnit = units.find(u => u.id === getId(existingMow));
                const tacticusShards = shards.find(s => s.id === getId(existingMow));

                if (tacticusUnit) {
                    const [rarity, stars] = TacticusIntegrationService.convertProgressionIndex(
                        tacticusUnit.progressionIndex
                    );

                    return {
                        ...existingMow,
                        unlocked: true,
                        rarity,
                        stars,
                        primaryAbilityLevel: tacticusUnit.abilities[0].level,
                        secondaryAbilityLevel: tacticusUnit.abilities[1].level,
                        shards: tacticusUnit.shards,
                    };
                } else if (tacticusShards) {
                    return {
                        ...existingMow,
                        rarity: Rarity.Common,
                        stars: RarityStars.None,
                        primaryAbilityLevel: 0,
                        secondaryAbilityLevel: 0,
                        shards: tacticusShards.amount,
                    };
                }

                return existingMow;
            });

            return resolved;
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
