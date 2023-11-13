import { ICharacter2, SetStateAction } from '../models/interfaces';
import { Rank, Rarity } from '../models/enums';

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
                existingChar.rarity = updatedCharacter.rarity;
                existingChar.bias = updatedCharacter.bias;
                existingChar.upgrades = updatedCharacter.upgrades;
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
