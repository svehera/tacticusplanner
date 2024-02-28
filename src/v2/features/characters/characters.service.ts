import { groupBy, orderBy, sum } from 'lodash';

import { ICharacter2 } from 'src/models/interfaces';
import { Rank } from 'src/models/enums';
import { CharactersFilterBy } from './enums/characters-filter-by';
import { needToAscendCharacter } from './functions/need-to-ascend';
import { needToLevelCharacter } from './functions/need-to-level';
import { filterChaos } from './functions/filter-by-chaos';
import { filterImperial } from './functions/filter-by-imperial';
import { filterXenos } from './functions/filter-by-xenos';
import { CharactersOrderBy } from './enums/characters-order-by';
import { IFaction } from './characters.models';

import factionsData from 'src/v2/data/factions.json';
import { CharactersPowerService } from './characters-power.service';
import { CharactersValueService } from './characters-value.service';

export class CharactersService {
    static filterCharacters(
        characters: ICharacter2[],
        filterBy: CharactersFilterBy,
        nameFilter: string | null
    ): ICharacter2[] {
        const filteredCharactersByName = nameFilter
            ? characters.filter(x => x.name.toLowerCase().includes(nameFilter.toLowerCase()))
            : characters;

        switch (filterBy) {
            case CharactersFilterBy.NeedToAscend:
                return filteredCharactersByName.filter(needToAscendCharacter);
            case CharactersFilterBy.NeedToLevel:
                return filteredCharactersByName.filter(needToLevelCharacter);
            case CharactersFilterBy.CanUpgrade:
                return filteredCharactersByName.filter(
                    char =>
                        char.rank !== Rank.Locked &&
                        char.rank !== Rank.Diamond2 &&
                        !needToLevelCharacter(char) &&
                        !needToAscendCharacter(char)
                );
            case CharactersFilterBy.Chaos:
                return filteredCharactersByName.filter(filterChaos);
            case CharactersFilterBy.Imperial:
                return filteredCharactersByName.filter(filterImperial);
            case CharactersFilterBy.Xenos:
                return filteredCharactersByName.filter(filterXenos);
            case CharactersFilterBy.None:
            default:
                return filteredCharactersByName;
        }
    }

    static orderCharacters(characters: ICharacter2[], charactersOrderBy: CharactersOrderBy): ICharacter2[] {
        switch (charactersOrderBy) {
            case CharactersOrderBy.CharacterValue:
                return orderBy(
                    characters.map(x => ({ ...x, characterValue: CharactersValueService.getCharacterValue(x) })),
                    ['characterValue'],
                    ['desc']
                );
            case CharactersOrderBy.CharacterPower:
                return orderBy(
                    characters.map(x => ({ ...x, characterPower: CharactersPowerService.getCharacterPower(x) })),
                    ['characterPower'],
                    ['desc']
                );
            case CharactersOrderBy.AbilitiesLevel:
                return orderBy(
                    characters.map(x => ({
                        ...x,
                        abilitiesLevel: x.activeAbilityLevel + x.passiveAbilityLevel,
                    })),
                    ['abilitiesLevel'],
                    ['desc']
                );
            case CharactersOrderBy.Rank:
                return orderBy(characters, ['rank'], ['desc']);
            case CharactersOrderBy.Rarity:
                return orderBy(characters, ['rarity'], ['desc']);
            case CharactersOrderBy.UnlockPercentage:
                return orderBy(characters, ['numberOfUnlocked'], ['asc']);
            default:
                return [];
        }
    }

    static orderByFaction(characters: ICharacter2[], charactersOrderBy: CharactersOrderBy): IFaction[] {
        const factionCharacters = groupBy(characters, 'faction');
        const result: IFaction[] = factionsData
            .filter(faction => factionCharacters[faction.name])
            .map(faction => {
                const characters = factionCharacters[faction.name];
                return {
                    ...faction,
                    characters,
                    bsValue: sum(characters.map(CharactersValueService.getCharacterValue)),
                    power: sum(characters.map(CharactersPowerService.getCharacterPower)),
                    unlockedCharacters: characters.filter(x => x.rank > Rank.Locked).length,
                };
            });
        let orderByKey: keyof IFaction;
        switch (charactersOrderBy) {
            case CharactersOrderBy.FactionValue: {
                orderByKey = 'bsValue';
                return orderBy(result, [orderByKey], ['desc']);
            }
            case CharactersOrderBy.FactionPower: {
                orderByKey = 'power';
                return orderBy(result, [orderByKey], ['desc']);
            }
            case CharactersOrderBy.Faction: {
                orderByKey = 'unlockedCharacters';
                return orderBy(result, [orderByKey], ['desc']);
            }
            default:
                return result;
        }
    }
}
