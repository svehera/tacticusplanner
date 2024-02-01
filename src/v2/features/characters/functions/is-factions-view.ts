import { CharactersOrderBy } from '../enums/characters-order-by';

export const isFactionsView = (orderBy: CharactersOrderBy): boolean => {
    return [CharactersOrderBy.Faction, CharactersOrderBy.FactionPower].includes(orderBy);
};
