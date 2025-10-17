import { CharactersOrderBy } from '../../../../fsd/4-entities/character/characters-order-by.enum';

export const isFactionsView = (orderBy: CharactersOrderBy): boolean => {
    return [CharactersOrderBy.Faction, CharactersOrderBy.FactionValue, CharactersOrderBy.FactionPower].includes(
        orderBy
    );
};
