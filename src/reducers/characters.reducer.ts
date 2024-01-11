import { ICharacter2, SetStateAction } from '../models/interfaces';
import { Rank, Rarity } from '../models/enums';
import { rankToLevel, rankToRarity, rarityToStars } from '../models/constants';

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
          type: 'UpdateShards';
          character: string;
          value: number;
      }
    | SetStateAction<ICharacter2[]>;

export const charactersReducer = (state: ICharacter2[], action: CharactersAction) => {
    switch (action.type) {
        case 'Set': {
            return action.value;
        }
        case 'Update': {
            const updatedCharacter = action.character;
            const existingChar = state.find(char => char.name === updatedCharacter.name);

            if (existingChar) {
                existingChar.rank = updatedCharacter.rank;
                const rankRarity = rankToRarity[existingChar.rank];
                existingChar.rarity = updatedCharacter.rarity <= rankRarity ? rankRarity : updatedCharacter.rarity;
                existingChar.bias = updatedCharacter.bias;
                existingChar.upgrades = updatedCharacter.upgrades;
                const rarityStars = rarityToStars[existingChar.rarity];
                existingChar.stars = updatedCharacter.stars <= rarityStars ? rarityStars : updatedCharacter.stars;

                existingChar.xp = updatedCharacter.xp;
                existingChar.shards = updatedCharacter.shards;
                existingChar.activeAbilityLevel =
                    updatedCharacter.activeAbilityLevel < 0
                        ? 0
                        : updatedCharacter.activeAbilityLevel > 50
                        ? 50
                        : updatedCharacter.activeAbilityLevel;
                existingChar.passiveAbilityLevel =
                    updatedCharacter.passiveAbilityLevel < 0
                        ? 0
                        : updatedCharacter.passiveAbilityLevel > 50
                        ? 50
                        : updatedCharacter.passiveAbilityLevel;

                const updatedLevel =
                    updatedCharacter.level < 0 ? 0 : updatedCharacter.level > 50 ? 50 : updatedCharacter.level;
                const rankLevel = rankToLevel[(existingChar.rank - 1) as Rank];
                existingChar.level = Math.max(
                    updatedLevel,
                    rankLevel,
                    existingChar.activeAbilityLevel,
                    existingChar.passiveAbilityLevel
                );
            }
            return [...state];
        }
        case 'UpdateRank': {
            const existingChar = state.find(char => char.name === action.character);

            if (existingChar) {
                existingChar.rank = action.value;
            }
            return [...state];
        }
        case 'UpdateRarity': {
            const existingChar = state.find(char => char.name === action.character);

            if (existingChar) {
                existingChar.rarity = action.value;
            }
            return [...state];
        }
        case 'UpdateShards': {
            const existingChar = state.find(char => char.name === action.character);

            if (existingChar) {
                existingChar.shards = action.value;
            }
            return [...state];
        }
        case 'UpdateUpgrades': {
            const existingChar = state.find(char => char.name === action.character);

            if (existingChar) {
                existingChar.upgrades = action.value;
            }
            return [...state];
        }
        default: {
            throw new Error();
        }
    }
};
