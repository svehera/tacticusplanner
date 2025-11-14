import { TacticusShard, TacticusUnit } from '@/fsd/5-shared/lib/tacticus-api/tacticus-api.models';
import { Rarity, Rank } from '@/fsd/5-shared/model';

import { CharacterBias, CharactersService } from '@/fsd/4-entities/character';
import { EquipmentService } from '@/fsd/4-entities/equipment';

import { CharactersAbilitiesService } from '@/v2/features/characters/characters-abilities.service';
import { TacticusIntegrationService } from 'src/v2/features/tacticus-integration/tacticus-integration.service';

import { rankToLevel, rankToRarity, rarityToStars } from '../models/constants';
import { ICharacter2, IPersonalCharacterDataEquipment, SetStateAction } from '../models/interfaces';

export type CharactersAction =
    | {
          type: 'Update';
          character: ICharacter2;
      }
    | {
          type: 'UpdateRank';
          character: string;
          value: Rank;
      }
    | {
          type: 'UpdateRarity';
          character: string;
          value: Rarity;
      }
    | {
          type: 'UpdateUpgrades';
          character: string;
          value: string[];
      }
    | {
          type: 'UpdateAbilities';
          characterId: string;
          abilities: [primary: number, secondary: number];
      }
    | {
          type: 'UpdateShards';
          character: string;
          value: number;
      }
    | {
          type: 'UpdateStars';
          character: string;
          value: number;
      }
    | {
          type: 'IncrementShards';
          character: string;
          value: number;
      }
    | {
          type: 'UpdateBias';
          recommendedFirst: string[];
          recommendedLast: string[];
      }
    | {
          type: 'SyncWithTacticus';
          units: TacticusUnit[];
          shards: TacticusShard[];
      }
    | SetStateAction<ICharacter2[]>;

export const charactersReducer = (state: ICharacter2[], action: CharactersAction): ICharacter2[] => {
    switch (action.type) {
        case 'Set': {
            return action.value;
        }
        case 'Update': {
            const updatedCharacter = action.character;
            const existingCharIndex = state.findIndex(char => char.snowprintId === updatedCharacter.snowprintId);
            const existingChar = state[existingCharIndex];

            if (existingChar) {
                const rankRarity = rankToRarity[existingChar.rank];
                const rarityStars = rarityToStars[existingChar.rarity];
                const updatedLevel =
                    updatedCharacter.level < 0 ? 0 : updatedCharacter.level > 55 ? 55 : updatedCharacter.level;

                const updatedCharacterData = {
                    ...existingChar,
                    rank: updatedCharacter.rank,
                    rarity: updatedCharacter.rarity <= rankRarity ? rankRarity : updatedCharacter.rarity,
                    bias: updatedCharacter.bias,
                    upgrades: updatedCharacter.upgrades,
                    stars: updatedCharacter.stars <= rarityStars ? rarityStars : updatedCharacter.stars,
                    xp: updatedCharacter.xp,
                    shards: updatedCharacter.shards,
                    equipment: updatedCharacter.equipment,
                    mythicShards: updatedCharacter.mythicShards,
                    activeAbilityLevel: Math.max(
                        0,
                        Math.min(
                            CharactersAbilitiesService.getMaximumAbilityLevel(),
                            updatedCharacter.activeAbilityLevel
                        )
                    ),
                    passiveAbilityLevel: Math.max(
                        0,
                        Math.min(
                            CharactersAbilitiesService.getMaximumAbilityLevel(),
                            updatedCharacter.passiveAbilityLevel
                        )
                    ),
                    level: Math.max(
                        updatedLevel,
                        rankToLevel[existingChar.rank as Rank],
                        updatedCharacter.activeAbilityLevel,
                        updatedCharacter.passiveAbilityLevel
                    ),
                };

                return [
                    ...state.slice(0, existingCharIndex),
                    updatedCharacterData,
                    ...state.slice(existingCharIndex + 1),
                ];
            }

            return state;
        }
        case 'SyncWithTacticus': {
            return [
                ...state.map(char => {
                    const tacticusUnit = action.units.find(
                        unit =>
                            CharactersService.matchesAnyCharacterId(unit.id, char) ||
                            CharactersService.matchesAnyCharacterId(unit.name, char)
                    );

                    const tacticusUnitShards = action.shards.find(
                        inventoryShard =>
                            CharactersService.matchesAnyCharacterId(inventoryShard.id, char) ||
                            CharactersService.matchesAnyCharacterId(inventoryShard.name, char)
                    );

                    if (tacticusUnit) {
                        // If the unit is unlocked, we sync all available attributes
                        const [rarity, stars] = TacticusIntegrationService.convertProgressionIndex(
                            tacticusUnit.progressionIndex
                        );
                        const currentLevelXp = TacticusIntegrationService.convertXp(
                            tacticusUnit.xp,
                            tacticusUnit.xpLevel
                        );

                        const rank: Rank = tacticusUnit.rank + 1;

                        const upgrades: string[] = TacticusIntegrationService.convertUpgrades(
                            char.snowprintId ?? '',
                            char.id,
                            rank,
                            tacticusUnit.upgrades
                        );

                        const shards = !char.lre || char.lre?.finished ? tacticusUnit.shards : char.shards;

                        // Overwrite manually-edited shards with Tacticus API value. This caters for initial rollout for
                        // mythic shards values, so this code can be deployed while allowing users to manually track their
                        // mythic shards values. Once the API includes `mythicShards`, those manual values will be overwritten,
                        // and this code can be simplified to only care about the Tacticus API value.
                        const mythicShards = tacticusUnit.mythicShards ?? char.mythicShards;

                        const equipment: IPersonalCharacterDataEquipment[] = [];
                        tacticusUnit.items.forEach(equip => {
                            const equipmentData = EquipmentService.convertTacticusEquipmentData(equip);
                            if (equipmentData) {
                                equipment.push({ id: equipmentData.id, level: equip.level });
                            }
                        });

                        return {
                            ...char,
                            rarity,
                            stars,
                            upgrades,
                            rank,
                            xp: currentLevelXp,
                            shards,
                            mythicShards,
                            activeAbilityLevel: tacticusUnit.abilities[0].level,
                            passiveAbilityLevel: tacticusUnit.abilities[1].level,
                            level: tacticusUnit.xpLevel,
                            equipment,
                        };
                    } else if (tacticusUnitShards) {
                        // If the unit is locked we only have shards to sync, no other attributes
                        return {
                            ...char,
                            shards: tacticusUnitShards.amount,
                        };
                    }

                    return char;
                }),
            ];
        }
        case 'UpdateAbilities': {
            const { characterId, abilities } = action;
            const existingCharIndex = state.findIndex(x => x.name === characterId);
            const existingChar = state[existingCharIndex];

            if (!existingChar) {
                return state;
            }

            state[existingCharIndex] = {
                ...existingChar,
                level: Math.max(existingChar.level, abilities[0], abilities[1]),
                activeAbilityLevel: abilities[0],
                passiveAbilityLevel: abilities[1],
            };

            return [...state];
        }
        case 'UpdateRank': {
            const existingCharIndex = state.findIndex(char => char.name === action.character);

            if (existingCharIndex !== -1) {
                const rankLevel = rankToLevel[(action.value - 1) as Rank];
                const updatedCharacter = {
                    ...state[existingCharIndex],
                    rank: action.value,
                    level: Math.max(state[existingCharIndex].level, rankLevel),
                };

                return [...state.slice(0, existingCharIndex), updatedCharacter, ...state.slice(existingCharIndex + 1)];
            }
            return state;
        }

        case 'UpdateRarity': {
            const existingCharIndex = state.findIndex(char => char.name === action.character);

            if (existingCharIndex !== -1) {
                const updatedCharacter = {
                    ...state[existingCharIndex],
                    rarity: action.value,
                };

                return [...state.slice(0, existingCharIndex), updatedCharacter, ...state.slice(existingCharIndex + 1)];
            }
            return state;
        }

        case 'UpdateShards': {
            const existingCharIndex = state.findIndex(char => char.name === action.character);

            if (existingCharIndex !== -1) {
                const updatedCharacter = {
                    ...state[existingCharIndex],
                    shards: action.value,
                };

                return [...state.slice(0, existingCharIndex), updatedCharacter, ...state.slice(existingCharIndex + 1)];
            }
            return state;
        }

        case 'UpdateStars': {
            const existingCharIndex = state.findIndex(char => char.name === action.character);

            if (existingCharIndex !== -1) {
                const updatedCharacter = {
                    ...state[existingCharIndex],
                    stars: action.value,
                };

                return [...state.slice(0, existingCharIndex), updatedCharacter, ...state.slice(existingCharIndex + 1)];
            }
            return state;
        }

        case 'IncrementShards': {
            const existingCharIndex = state.findIndex(char => char.snowprintId === action.character);

            if (existingCharIndex !== -1) {
                const updatedCharacter = {
                    ...state[existingCharIndex],
                    shards: state[existingCharIndex].shards + action.value,
                };

                return [...state.slice(0, existingCharIndex), updatedCharacter, ...state.slice(existingCharIndex + 1)];
            }
            return state;
        }

        case 'UpdateUpgrades': {
            const existingCharIndex = state.findIndex(char => char.name === action.character);

            if (existingCharIndex !== -1) {
                const updatedCharacter = {
                    ...state[existingCharIndex],
                    upgrades: action.value,
                };

                return [...state.slice(0, existingCharIndex), updatedCharacter, ...state.slice(existingCharIndex + 1)];
            }
            return state;
        }
        case 'UpdateBias': {
            const { recommendedFirst, recommendedLast } = action;

            return state.map(c => ({
                ...c,
                bias: recommendedFirst.includes(c.name)
                    ? CharacterBias.recommendFirst
                    : recommendedLast.includes(c.name)
                      ? CharacterBias.recommendLast
                      : CharacterBias.None,
            }));
        }
        default: {
            throw new Error();
        }
    }
};
