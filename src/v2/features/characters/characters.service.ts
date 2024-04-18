import { groupBy, orderBy, sum } from 'lodash';

import { ICharacter2, IPersonalCharacterData2 } from 'src/models/interfaces';
import { Rank, Rarity } from 'src/models/enums';
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
import { rarityCaps } from 'src/v2/features/characters/characters.contants';

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
                        char.rank !== Rank.Diamond3 &&
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

    static capCharacterAtRarity(character: ICharacter2, rarity: Rarity): ICharacter2 {
        const capped = rarityCaps[rarity];

        return {
            ...character,
            rarity: Math.min(character.rarity, capped.rarity),
            rank: Math.min(character.rank, capped.rank),
            stars: Math.min(character.stars, capped.stars),
            level: Math.min(character.level, capped.abilitiesLevel),
            activeAbilityLevel: Math.min(character.activeAbilityLevel, capped.abilitiesLevel),
            passiveAbilityLevel: Math.min(character.passiveAbilityLevel, capped.abilitiesLevel),
        };
    }

    // static calculateCharacterPotential(character: ICharacter2, rarityCap: Rarity): number {
    //     const capped = rarityCaps[rarityCap];
    //     // Calculate potential based on properties
    //     const rarityPotential = (character.rarity / capped.rarity) * 100;
    //     const rankPotential = (character.rank / capped.rank) * 100;
    //     const starsPotential = (character.stars / capped.stars) * 100;
    //     const activeAbilityPotential = (character.activeAbilityLevel / capped.abilitiesLevel) * 100;
    //     const passiveAbilityPotential = (character.passiveAbilityLevel / capped.abilitiesLevel) * 100;
    //
    //     // Calculate average potential
    //     const averagePotential =
    //         (rarityPotential + rankPotential + starsPotential + activeAbilityPotential + passiveAbilityPotential) / 5;
    //
    //     return Math.round(averagePotential); // Round potential to the nearest whole number
    // }

    static calculateCharacterPotential(character: IPersonalCharacterData2, rarityCap: Rarity): number {
        const capped = rarityCaps[rarityCap];

        const cappedPower = CharactersPowerService.getCharacterPower({
            rank: capped.rank,
            stars: capped.stars,
            rarity: rarityCap,
            upgrades: [],
            activeAbilityLevel: capped.abilitiesLevel,
            passiveAbilityLevel: capped.abilitiesLevel,
        } as unknown as ICharacter2);

        const characterPower = CharactersPowerService.getCharacterPower({
            rank: character.rank,
            stars: character.stars,
            rarity: rarityCap,
            upgrades: [],
            activeAbilityLevel: character.activeAbilityLevel,
            passiveAbilityLevel: character.passiveAbilityLevel,
        } as unknown as ICharacter2);

        return characterPower > cappedPower ? 100 : Math.round((characterPower / cappedPower) * 100); // Round potential to the nearest whole number
    }

    public static groupByRarityPools(availableCharacters: IPersonalCharacterData2[]): Record<Rarity, number> {
        const legendaryPool = availableCharacters.filter(
            x => x.rarity === Rarity.Legendary && x.rank >= Rank.Gold1
        ).length;
        const epicPool = availableCharacters.filter(x => x.rarity >= Rarity.Epic && x.rank >= Rank.Gold1).length;
        const rarePool = availableCharacters.filter(x => x.rarity >= Rarity.Rare && x.rank >= Rank.Silver1).length;
        const uncommonPool = availableCharacters.filter(
            x => x.rarity >= Rarity.Uncommon && x.rank >= Rank.Bronze1
        ).length;

        return {
            [Rarity.Legendary]: legendaryPool,
            [Rarity.Epic]: epicPool,
            [Rarity.Rare]: rarePool,
            [Rarity.Uncommon]: uncommonPool,
            [Rarity.Common]: 0,
        };
    }

    public static getRosterPotential(
        availableCharacters: IPersonalCharacterData2[],
        rarityCaps: Record<Rarity, number>
    ): number {
        const uncommonCharactersCount = rarityCaps[Rarity.Uncommon];
        const rareCharactersCount = rarityCaps[Rarity.Rare];
        const epicCharactersCount = rarityCaps[Rarity.Epic];
        const legendaryCharactersCount = rarityCaps[Rarity.Legendary];

        let total = 0;
        let raritiesCount = 0;
        const usedCharacters: string[] = [];

        if (legendaryCharactersCount > 0) {
            total += this.getRosterRarityPotential(
                usedCharacters,
                availableCharacters,
                Rarity.Legendary,
                legendaryCharactersCount
            );
            raritiesCount++;
        }

        if (epicCharactersCount > 0) {
            total += this.getRosterRarityPotential(
                usedCharacters,
                availableCharacters.filter(x => !usedCharacters.includes(x.name)),
                Rarity.Epic,
                epicCharactersCount
            );
            raritiesCount++;
        }

        if (rareCharactersCount > 0) {
            total += this.getRosterRarityPotential(
                usedCharacters,
                availableCharacters.filter(x => !usedCharacters.includes(x.name)),
                Rarity.Rare,
                rareCharactersCount
            );
            raritiesCount++;
        }

        if (uncommonCharactersCount > 0) {
            total += this.getRosterRarityPotential(
                usedCharacters,
                availableCharacters.filter(x => !usedCharacters.includes(x.name)),
                Rarity.Uncommon,
                uncommonCharactersCount
            );
            raritiesCount++;
        }

        return Math.round(total / raritiesCount);
    }

    private static getRosterRarityPotential(
        usedCharacters: string[],
        availableCharacters: IPersonalCharacterData2[],
        rarityCap: Rarity,
        charactersCount: number
    ): number {
        const charactersByPotential = orderBy(
            availableCharacters.map(x => ({
                ...x,
                potential: this.calculateCharacterPotential(x, rarityCap),
            })),
            ['potential'],
            ['desc']
        ).slice(0, charactersCount * 5);

        usedCharacters.push(...charactersByPotential.map(x => x.name));
        const charactersByPotentialValue = charactersByPotential.map(x => x.potential);

        return (sum(charactersByPotentialValue) / (charactersCount * 5 * 100)) * 100;
    }
}
