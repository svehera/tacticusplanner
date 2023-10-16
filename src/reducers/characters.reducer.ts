import { ICharacter2, SetStateAction } from '../models/interfaces';

export type CharactersAction =
    | {
          type: 'Update';
          character: ICharacter2;
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
                existingChar.unlocked = updatedCharacter.unlocked;
                existingChar.rank = updatedCharacter.rank;
                existingChar.rarity = updatedCharacter.rarity;
                existingChar.bias = updatedCharacter.bias;
            }
            return [...state];
        }
        default: {
            throw new Error();
        }
    }
};
