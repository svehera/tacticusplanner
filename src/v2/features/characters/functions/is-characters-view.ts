import { CharactersOrderBy } from '../enums/characters-order-by';

export const isCharactersView = (orderBy: CharactersOrderBy): boolean => {
    return [
        CharactersOrderBy.CharacterPower,
        CharactersOrderBy.Rank,
        CharactersOrderBy.Rarity,
        CharactersOrderBy.AbilitiesLevel,
        CharactersOrderBy.UnlockPercentage,
    ].includes(orderBy);
};
