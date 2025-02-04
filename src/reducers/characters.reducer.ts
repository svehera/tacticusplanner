import { ICharacter2, SetStateAction } from '../models/interfaces';
import { CharacterBias, Rank, Rarity } from '../models/enums';
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
          characters: ICharacter2[];
      }
    | SetStateAction<ICharacter2[]>;

export const charactersReducer = (state: ICharacter2[], action: CharactersAction): ICharacter2[] => {
    switch (action.type) {
        case 'Set': {
            return action.value;
        }
        case 'Update': {
            const updatedCharacter = action.character;
            const existingCharIndex = state.findIndex(char => char.name === updatedCharacter.name);
            const existingChar = state[existingCharIndex];

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
                state[existingCharIndex] = { ...existingChar };
            }
            return [...state];
        }
        case 'SyncWithTacticus': {
            for (const updatedCharacter of action.characters) {
                const existingChar = state.find(
                    char =>
                        char.name.toLowerCase() === updatedCharacter.name.toLowerCase() ||
                        char.shortName.toLowerCase() === updatedCharacter.name.toLowerCase()
                );

                if (existingChar) {
                    existingChar.rarity = updatedCharacter.rarity;
                    existingChar.stars = updatedCharacter.stars;
                    existingChar.rank = updatedCharacter.rank;
                    existingChar.xp = updatedCharacter.xp;
                    existingChar.shards = updatedCharacter.shards;
                    existingChar.activeAbilityLevel = updatedCharacter.activeAbilityLevel;
                    existingChar.passiveAbilityLevel = updatedCharacter.passiveAbilityLevel;
                    existingChar.level = updatedCharacter.level;
                }
            }
            return [...state];
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
            const existingChar = state.find(char => char.name === action.character);

            if (existingChar) {
                const rankLevel = rankToLevel[(action.value - 1) as Rank];
                existingChar.rank = action.value;
                existingChar.level = Math.max(existingChar.level, rankLevel);
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
        case 'UpdateStars': {
            const existingChar = state.find(char => char.name === action.character);

            if (existingChar) {
                existingChar.stars = action.value;
            }
            return [...state];
        }
        case 'IncrementShards': {
            const existingChar = state.find(char => char.name === action.character);

            if (existingChar) {
                existingChar.shards += action.value;
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
