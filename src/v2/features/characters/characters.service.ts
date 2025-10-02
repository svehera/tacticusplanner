﻿import { groupBy, orderBy, sum } from 'lodash';

import { charsUnlockShards } from 'src/models/constants';
import { IPersonalCharacterData2 } from 'src/models/interfaces';
import factionsData from 'src/v2/data/factions.json';

import { Rank, Rarity, UnitType } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { IMow, IMow2 } from '@/fsd/4-entities/mow';
import { IUnit } from '@/fsd/4-entities/unit';
import { isCharacter, isMow, isUnlocked } from '@/fsd/4-entities/unit/units.functions';
import { IMaterialFull, UpgradesService } from '@/fsd/4-entities/upgrade';

import { rarityCaps } from 'src/v2/features/characters/characters.contants';

import { CharactersFilterBy } from '../../../fsd/4-entities/character/characters-filter-by.enum';
import { CharactersOrderBy } from '../../../fsd/4-entities/character/characters-order-by.enum';
import { CharactersPowerService } from '../../../fsd/4-entities/unit/characters-power.service';
import { CharactersValueService } from '../../../fsd/4-entities/unit/characters-value.service';

import { IFaction } from './characters.models';
import { filterChaos } from './functions/filter-by-chaos';
import { filterImperial } from './functions/filter-by-imperial';
import { filterXenos } from './functions/filter-by-xenos';
import { needToAscendCharacter } from './functions/need-to-ascend';
import { needToLevelCharacter } from './functions/need-to-level';

export class CharactersService {
    static filterUnits(characters: IUnit[], filterBy: CharactersFilterBy, nameFilter: string | null): IUnit[] {
        const filteredCharactersByName = nameFilter
            ? characters.filter(
                  x =>
                      x.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
                      ('shortName' in x && x.shortName?.toLowerCase().includes(nameFilter.toLowerCase()))
              )
            : characters;

        switch (filterBy) {
            case CharactersFilterBy.NeedToAscend:
                return filteredCharactersByName.filter(needToAscendCharacter);
            case CharactersFilterBy.NeedToLevel:
                return filteredCharactersByName.filter(needToLevelCharacter);
            case CharactersFilterBy.CanUpgrade:
                return filteredCharactersByName.filter(
                    char =>
                        isCharacter(char) &&
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
            case CharactersFilterBy.MoW:
                return filteredCharactersByName.filter(isMow);
            case CharactersFilterBy.None:
            default:
                return filteredCharactersByName;
        }
    }

    private static getFaction(unit: IUnit): string {
        if ('faction' in unit) return unit.faction;
        return unit.factionId;
    }

    private static haveSameFaction(unit1: IUnit, unit2: IUnit): boolean {
        return this.getFaction(unit1) === this.getFaction(unit2);
    }

    static orderUnits(units: IUnit[], charactersOrderBy: CharactersOrderBy): IUnit[] {
        switch (charactersOrderBy) {
            case CharactersOrderBy.CharacterValue:
                return orderBy(
                    units.map(x => ({ ...x, characterValue: CharactersValueService.getCharacterValue(x) })),
                    ['characterValue'],
                    ['desc']
                );
            case CharactersOrderBy.CharacterPower:
                return orderBy(
                    units.map(x => ({ ...x, characterPower: CharactersPowerService.getCharacterPower(x) })),
                    ['characterPower'],
                    ['desc']
                );
            case CharactersOrderBy.AbilitiesLevel:
                return orderBy(
                    units.map(x => ({
                        ...x,
                        abilitiesLevel: this.getAbilitiesLevel(x),
                    })),
                    ['abilitiesLevel'],
                    ['desc']
                );
            case CharactersOrderBy.Rank:
                return orderBy(units, unit => (isMow(unit) ? Rank.Locked : unit.rank), ['desc']);
            case CharactersOrderBy.Rarity:
                return orderBy(units, ['rarity', 'stars'], ['desc', 'desc']);
            case CharactersOrderBy.Shards:
                return orderBy(units, ['shards', 'rarity', 'stars'], ['desc', 'desc', 'desc']);
            case CharactersOrderBy.UnlockPercentage:
                return orderBy(
                    units,
                    unit => {
                        if (unit.numberOfUnlocked) {
                            return unit.numberOfUnlocked;
                        } else {
                            return !isUnlocked(unit)
                                ? Math.ceil((unit.shards / charsUnlockShards[unit.rarity]) * 100)
                                : units.filter(x => this.haveSameFaction(x, unit) && isUnlocked(x)).length;
                        }
                    },
                    ['asc']
                );
            default:
                return units;
        }
    }

    private static getAbilitiesLevel(unit: IUnit): number {
        if (isCharacter(unit)) {
            return unit.activeAbilityLevel + unit.passiveAbilityLevel;
        } else {
            return unit.primaryAbilityLevel + unit.secondaryAbilityLevel;
        }
    }

    static orderByFaction(
        units: IUnit[],
        charactersOrderBy: CharactersOrderBy,
        includeBsValue = true,
        includePower = true
    ): IFaction[] {
        const factionCharacters = groupBy(units, 'faction');

        // Derive relevant faction data in one pass
        const result: IFaction[] = factionsData.reduce((acc: IFaction[], faction) => {
            const characters = factionCharacters[faction.snowprintId];
            if (!characters) return acc;

            let bsValue = 0,
                power = 0,
                unlockedCharacters = 0;
            characters.forEach(char => {
                if (includeBsValue || charactersOrderBy === CharactersOrderBy.FactionValue) {
                    bsValue += CharactersValueService.getCharacterValue(char);
                }
                if (includePower || charactersOrderBy === CharactersOrderBy.FactionPower) {
                    power += CharactersPowerService.getCharacterPower(char);
                }
                if (isUnlocked(char)) unlockedCharacters++;
            });

            acc.push({
                ...faction,
                units: characters,
                bsValue,
                power,
                unlockedCharacters,
            });
            return acc;
        }, []);

        // Determine sort key based on the order parameter
        let orderByKey: keyof IFaction;
        switch (charactersOrderBy) {
            case CharactersOrderBy.FactionValue:
                orderByKey = 'bsValue';
                break;
            case CharactersOrderBy.FactionPower:
                orderByKey = 'power';
                break;
            case CharactersOrderBy.Faction:
                orderByKey = 'unlockedCharacters';
                break;
            default:
                return result;
        }

        // Sort using native sort
        return result.sort((a, b) => b[orderByKey] - a[orderByKey]);
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

    static capMowAtRarity(mow: IMow2, rarity: Rarity): IMow2 {
        const capped = rarityCaps[rarity];

        return {
            ...mow,
            rarity: Math.min(mow.rarity, capped.rarity),
            stars: Math.min(mow.stars, capped.stars),
            primaryAbilityLevel: Math.min(mow.primaryAbilityLevel, capped.abilitiesLevel),
            secondaryAbilityLevel: Math.min(mow.secondaryAbilityLevel, capped.abilitiesLevel),
        };
    }

    static calculateCharacterPotential(character: IPersonalCharacterData2, rarityCap: Rarity): number {
        const capped = rarityCaps[rarityCap];

        const cappedPower = CharactersPowerService.getCharacterPower({
            unitType: UnitType.character,
            rank: capped.rank,
            stars: capped.stars,
            rarity: rarityCap,
            upgrades: [],
            activeAbilityLevel: capped.abilitiesLevel,
            passiveAbilityLevel: capped.abilitiesLevel,
        } as unknown as ICharacter2);

        const characterPower = CharactersPowerService.getCharacterPower({
            unitType: UnitType.character,
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
        // TODO(mythic): is rank right? what is this for?
        const mythicPool = availableCharacters.filter(
            x => x.rarity === Rarity.Mythic && x.rank >= Rank.Diamond1
        ).length;
        const legendaryPool = availableCharacters.filter(
            x => x.rarity === Rarity.Legendary && x.rank >= Rank.Gold1
        ).length;
        const epicPool = availableCharacters.filter(x => x.rarity >= Rarity.Epic && x.rank >= Rank.Gold1).length;
        const rarePool = availableCharacters.filter(x => x.rarity >= Rarity.Rare && x.rank >= Rank.Silver1).length;
        const uncommonPool = availableCharacters.filter(
            x => x.rarity >= Rarity.Uncommon && x.rank >= Rank.Bronze1
        ).length;

        return {
            [Rarity.Mythic]: mythicPool,
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
