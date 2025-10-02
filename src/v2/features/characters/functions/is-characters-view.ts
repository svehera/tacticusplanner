import { CharactersOrderBy } from '../../../../fsd/4-entities/character/characters-order-by.enum';

export const isCharactersView = (orderBy: CharactersOrderBy): boolean => {
    return [
        CharactersOrderBy.CharacterValue,
        CharactersOrderBy.CharacterPower,
        CharactersOrderBy.Rank,
        CharactersOrderBy.Rarity,
        CharactersOrderBy.Shards,
        CharactersOrderBy.AbilitiesLevel,
        CharactersOrderBy.UnlockPercentage,
    ].includes(orderBy);
};
