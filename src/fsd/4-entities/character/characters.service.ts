import { uniq } from 'lodash';

import { arrayToKeyedObject } from '@/fsd/5-shared/lib';
import {
    UnitType,
    RarityMapper,
    RarityString,
    Alliance,
    Trait,
    DamageType,
    Rarity,
    Rank,
    RarityStars,
    getTraitStringFromLabel,
} from '@/fsd/5-shared/model';

// eslint-disable-next-line boundaries/element-types
import { ILegendaryEventStatic, LegendaryEventEnum, LegendaryEventService } from '@/fsd/4-entities/lre';

import { CharacterBias } from './bias.enum';
import { charactersData } from './data';
import { UnitDataRaw, ICharacterData, ICharLegendaryEvents, ILreCharacterStaticData, ICharacter2 } from './model';

/**
 * Roster-filter fields shared between every screen that lets a user narrow down a character
 * list by combat properties (e.g. `/learn/characters` and the team builder's unit filter).
 */
export interface IRosterFilterCriteria {
    attackType?: string; // '', 'melee', 'range'
    minHits?: number | '';
    maxHits?: number | '';
    movement?: number | '';
    minRange?: number | '';
    maxRange?: number | '';
    damageTypes?: DamageType[];
    /** `Trait` LABEL values, e.g. `Trait.LivingMetal === 'Living Metal'`. */
    traits?: Trait[];
    alliance?: Alliance[];
}

export class CharactersService {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    static readonly charactersData: ICharacterData[] = charactersData.map(character => this.convertUnitData(character));
    static readonly charactersBySnowprintId: Record<string, ICharacterData> = Object.fromEntries(
        this.charactersData.map(char => [char.snowprintId, char])
    );
    static readonly charactersById = arrayToKeyedObject(this.charactersData, 'id');
    static readonly charactersByShortName: Record<string, ICharacterData> = Object.fromEntries(
        this.charactersData.map(char => [char.shortName.toLowerCase(), char])
    );
    static readonly charactersByFullName: Record<string, ICharacterData> = Object.fromEntries(
        this.charactersData.map(char => [char.fullName.toLowerCase(), char])
    );

    static readonly lreCharacters: ICharacterData[] = LegendaryEventService.getLegendaryEvents()
        .map(lre => {
            const character = this.charactersBySnowprintId[lre.unitSnowprintId];
            if (character) return { ...character, lre: this.toILreCharacterStaticData(lre) };
            return character;
        })
        .filter(Boolean) as ICharacterData[];

    // eslint-disable-next-line unicorn/consistent-function-scoping -- don't extract static methods
    static readonly activeLres = this.lreCharacters.filter(x => !x.lre?.finished);
    // eslint-disable-next-line unicorn/consistent-function-scoping -- don't extract static methods
    static readonly inactiveLres = this.lreCharacters.filter(x => !!x.lre?.finished);

    public static getInitialRarity(snowprintId: string): Rarity | undefined {
        const character = this.charactersData.find(unit => unit.snowprintId === snowprintId);
        return character?.initialRarity;
    }

    // eslint-disable-next-line unicorn/consistent-function-scoping -- don't extract static methods
    static readonly activeLre: ICharacterData = (() => {
        return this.charactersData.find(unit => unit.snowprintId === LegendaryEventService.getActiveLreUnitId())!;
    })();

    public static getLreCharacter(id: LegendaryEventEnum): ICharacterData | undefined {
        return this.lreCharacters.find(unit => {
            const event = LegendaryEventService.getEventByCharacterSnowprintId(unit.snowprintId);
            return event?.id === id;
        });
    }

    /**
     * @param id The unit ID of the character.
     * @returns An ICharacterData representation, or undefined.
     */
    public static getUnit(id: string): ICharacterData | undefined {
        return (
            this.charactersBySnowprintId[id] ||
            this.charactersById[id] ||
            this.charactersByShortName[id.toLowerCase()] ||
            this.charactersByFullName[id.toLowerCase()]
        );
    }

    /**
     * Snowprint's internal assets refer to damage type as damage profile, and
     * they use a different string. This converts from their string to our enum.
     * @param rawData The raw data from Snowprint.
     * @returns The converted DamageType.
     */
    private static convertSnowprintDamageProfile(rawData: string): DamageType {
        const returnValue: DamageType = DamageType[rawData as keyof typeof DamageType] || DamageType.Physical;
        if (rawData === 'DirectDamage') return DamageType.Direct;
        if (rawData === 'Gauss') return DamageType.Molecular;
        if (returnValue == DamageType.Physical && rawData !== 'Physical') {
            console.warn(`Unknown damage profile: ${rawData}`);
        }
        return returnValue;
    }

    private static convertUnitData(rawData: UnitDataRaw): ICharacterData {
        const unitData: ICharacterData = {
            id: rawData.Name,
            snowprintId: rawData.id,
            shortName: rawData['Short Name'],
            fullName: rawData['Full Name'],
            unitType: UnitType.character,
            alliance: rawData.Alliance as Alliance,
            faction: rawData.Faction,
            name: rawData.Name,
            numberAdded: rawData.Number,
            health: rawData.Health,
            damage: rawData.Damage,
            armour: rawData.Armour,
            initialRarity: RarityMapper.stringToNumber[rawData['Initial rarity'] as RarityString],
            rarityStars: RarityMapper.toStars[RarityMapper.stringToNumber[rawData['Initial rarity'] as RarityString]],
            equipment1: rawData.Equipment1,
            equipment2: rawData.Equipment2,
            equipment3: rawData.Equipment3,
            meleeHits: rawData['Melee Hits'],
            rangeHits: rawData['Ranged Hits'],
            rangeDistance: rawData.Distance,
            movement: rawData.Movement,
            forcedSummons: rawData.ForcedSummons ?? false,
            requiredInCampaign: rawData.RequiredInCampaign ?? false,
            campaignsRequiredIn: rawData.CampaignsRequiredIn,
            legendaryEvents: {} as ICharLegendaryEvents,
            traits: rawData.Traits as Trait[],
            icon: rawData.Icon,
            roundIcon: rawData.RoundIcon,
            damageTypes: {
                all: [CharactersService.convertSnowprintDamageProfile(rawData['Melee Damage'])],
                melee: CharactersService.convertSnowprintDamageProfile(rawData['Melee Damage']),
                activeAbility: [],
                passiveAbility: [],
            },
            releaseRarity: rawData.ReleaseRarity,
            releaseDate: rawData.releaseDate,
            lre: rawData.lre,
            activeAbilityName: rawData['Active Ability Names'][0] || '',
            passiveAbilityName: rawData['Passive Ability Names'][0] || '',
        };

        if (rawData['Ranged Damage']) {
            unitData.damageTypes.all.push(CharactersService.convertSnowprintDamageProfile(rawData['Ranged Damage']));
            unitData.damageTypes.range = CharactersService.convertSnowprintDamageProfile(rawData['Ranged Damage']);
        }
        if (rawData['Active Ability']) {
            for (const x of rawData['Active Ability']) {
                const damageType = CharactersService.convertSnowprintDamageProfile(x);
                unitData.damageTypes.all.push(damageType);
                unitData.damageTypes.activeAbility.push(damageType);
            }
        }
        if (rawData['Passive Ability']) {
            for (const x of rawData['Passive Ability']) {
                const damageType = CharactersService.convertSnowprintDamageProfile(x);
                unitData.damageTypes.all.push(damageType);
                unitData.damageTypes.passiveAbility.push(damageType);
            }
        }
        unitData.damageTypes.all = uniq(unitData.damageTypes.all);

        const isReleased = unitData.releaseDate
            ? CharactersService.isAtLeast3DaysBefore(new Date(unitData.releaseDate))
            : true;

        unitData.icon = isReleased ? unitData.icon : 'comingSoon.webp';

        return unitData;
    }

    static canonicalName(identifier: string): string {
        const unit = this.getUnit(identifier);
        if (unit) return unit.snowprintId;
        if (identifier === "Sho'Syl") return 'tauMarksman';
        if (identifier === "Re'Vas") return 'tauCrisis';
        if (identifier === 'PoM') return 'tyranParasite';
        if (identifier === 'Abaddon The Despoiler') return 'blackAbaddon';
        if (identifier === 'Winged Tyrant Prime') return 'tyranWingedPrime';
        if (identifier === "Tan Gi'Da") return 'admecMarshall';
        if (identifier === 'Nauseous Rotbone') return 'deathRotbone';
        if (identifier === 'Sy-Gex') return 'admecDestroyer';
        if (identifier === 'Patermine') return 'genesPatriarch';
        return this.getUnit(identifier)?.snowprintId || identifier;
    }

    public static resolveCharacter(identifier: string): ICharacterData {
        const returnValue = CharactersService.charactersData.find(
            x => x.snowprintId == CharactersService.canonicalName(identifier)
        );
        return returnValue!;
    }

    /**
     * Takes characters stored in the users account and resolves them to the (potentially) new
     * character data we have from data mines. Characters that we cannot resolve are logged to
     * the developer console and then removed.
     */
    public static resolveStoredCharacters(charactersFromStorage: ICharacter2[]): ICharacter2[] {
        return charactersFromStorage
            .filter(x => this.resolveCharacter(x.snowprintId ?? x.name) !== undefined)
            .map(x => {
                const staticChar = this.resolveCharacter(x.snowprintId ?? x.name);
                if (staticChar === undefined) {
                    console.error('Could not resolve character', x.snowprintId ?? x.name);
                    return;
                }
                return { ...x, ...staticChar };
            })
            .filter(x => x !== undefined) as ICharacter2[];
    }

    /**
     * @returns Every character in the game as `ICharacter2`. Characters not present in
     * `charactersFromStorage` are added as locked placeholders (initial rarity, no stars, no
     * shards) — mirrors `MowsService.resolveAllFromStorage`.
     */
    public static resolveAllCharacters(charactersFromStorage: ICharacter2[]): ICharacter2[] {
        const resolved = this.resolveStoredCharacters(charactersFromStorage);
        const resolvedSnowprintIds = new Set(resolved.map(c => c.snowprintId));

        const lockedPlaceholders: ICharacter2[] = [];
        for (const staticChar of this.charactersData) {
            if (resolvedSnowprintIds.has(staticChar.snowprintId)) continue;
            lockedPlaceholders.push({
                ...staticChar,
                rank: Rank.Locked,
                rarity: staticChar.initialRarity,
                stars: RarityStars.None,
                level: 1,
                xp: 0,
                bias: CharacterBias.None,
                upgrades: [],
                activeAbilityLevel: 1,
                passiveAbilityLevel: 1,
                shards: 0,
                mythicShards: 0,
                equipment: [],
            } as ICharacter2);
        }

        return [...resolved, ...lockedPlaceholders];
    }

    static isAtLeast3DaysBefore(releaseDate: Date): boolean {
        const today = new Date();

        // Calculate the difference in time
        const timeDifference = releaseDate.getTime() - today.getTime();

        // Convert time difference from milliseconds to days
        const dayDifference = timeDifference / (1000 * 3600 * 24);

        // Check if the day difference is less than or equal to 2
        return dayDifference <= 3;
    }

    static toILreCharacterStaticData({
        id,
        eventStage,
        finished,
        nextEventDateUtc,
    }: ILegendaryEventStatic): ILreCharacterStaticData {
        return {
            id: id as LegendaryEventEnum,
            eventStage,
            finished,
            nextEventDate: nextEventDateUtc
                ? new Date(nextEventDateUtc).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      timeZone: 'UTC',
                  })
                : 'TBA',
            nextEventDateUtc,
        };
    }

    /**
     * Takes a character id and character object, and returns true if the id matches the object.
     *
     * The app has multiple "id" concepts for looking up characters, and different parts of the app
     * have used different concepts in the past.
     *
     * This function helps consolidate those concepts.
     */
    public static matchesAnyCharacterId(id: string, character: ICharacter2): boolean {
        const lowered = id.toLowerCase();

        return (
            id === character.snowprintId ||
            lowered === character.id.toLowerCase() ||
            lowered === character.name.toLowerCase() ||
            lowered === character.shortName.toLowerCase() ||
            lowered === character.fullName.toLowerCase()
        );
    }

    /**
     * Checks every roster-filter dimension in {@link IRosterFilterCriteria} against a single
     * character. Shared by every screen that filters a character list by combat properties.
     */
    public static passesRosterFilter(character: ICharacter2, criteria: IRosterFilterCriteria): boolean {
        return (
            this.passesAttackTypeFilter(character, criteria.attackType) &&
            this.passesHitsFilter(character, criteria.minHits, criteria.maxHits, criteria.attackType) &&
            this.passesMovementFilter(character, criteria.movement) &&
            this.passesRangeFilter(character, criteria.minRange, criteria.maxRange) &&
            this.passesDamageTypesFilter(character, criteria.damageTypes) &&
            this.passesTraitsFilter(character, criteria.traits) &&
            this.passesAllianceFilter(character.alliance, criteria.alliance)
        );
    }

    /** Standalone (not folded into `passesRosterFilter`) because MoWs need alliance filtering without the character-only dimensions. */
    public static passesAllianceFilter(unitAlliance: Alliance | string, alliances?: Alliance[]): boolean {
        if (!alliances || alliances.length === 0) return true;
        return alliances.includes(unitAlliance as Alliance);
    }

    /**
     * Filters by trait label. `Mechanical` is special-cased to also match characters tagged
     * `LivingMetal`, since some "mechanical" units are stored under that key instead.
     */
    public static passesTraitsFilter(character: ICharacter2, traits?: Trait[]): boolean {
        if (!traits || traits.length === 0) return true;

        const characterTraitKeys = (character.traits ?? []) as unknown as string[];
        return traits.every(label => {
            const key = getTraitStringFromLabel(label);
            if (!key) return false;
            if (key !== 'Mechanical') return characterTraitKeys.includes(key);
            return characterTraitKeys.includes('Mechanical') || characterTraitKeys.includes('LivingMetal');
        });
    }

    private static passesAttackTypeFilter(character: ICharacter2, attackType?: string): boolean {
        if (attackType === 'melee') return !character.rangeHits;
        if (attackType === 'range') return !!character.rangeHits;
        return true;
    }

    /**
     * A hybrid unit carries both `meleeHits` and `rangeHits` — which one is "the" hit count
     * depends on which attack type is selected, so match against both when neither is picked.
     */
    private static passesHitsFilter(
        character: ICharacter2,
        minHits?: number | '',
        maxHits?: number | '',
        attackType?: string
    ): boolean {
        if (!minHits && !maxHits) return true;

        const inRange = (hits: number) => (!minHits || hits >= minHits) && (!maxHits || hits <= maxHits);

        if (attackType === 'melee') return inRange(character.meleeHits);
        if (attackType === 'range') return character.rangeHits != undefined && inRange(character.rangeHits);

        return inRange(character.meleeHits) || (character.rangeHits != undefined && inRange(character.rangeHits));
    }

    private static passesMovementFilter(character: ICharacter2, movement?: number | ''): boolean {
        if (!movement) return true;
        return character.movement === movement;
    }

    /** Characters with no ranged attack (no `rangeDistance`) never match once either bound is set. */
    private static passesRangeFilter(character: ICharacter2, minRange?: number | '', maxRange?: number | ''): boolean {
        if (!minRange && !maxRange) return true;
        if (!character.rangeDistance) return false;
        if (minRange && character.rangeDistance < minRange) return false;
        if (maxRange && character.rangeDistance > maxRange) return false;
        return true;
    }

    private static passesDamageTypesFilter(character: ICharacter2, damageTypes?: DamageType[]): boolean {
        if (!damageTypes || damageTypes.length === 0) return true;
        return damageTypes.every(type => character.damageTypes.all.includes(type));
    }

    public static getHitsOptions(characters: ICharacter2[]): number[] {
        return uniq(
            characters.flatMap(x => [x.meleeHits, x.rangeHits]).filter((hits): hits is number => hits != undefined)
        ).toSorted((a, b) => a - b);
    }

    public static getMovementOptions(characters: ICharacter2[]): number[] {
        return uniq(characters.map(x => x.movement)).toSorted((a, b) => a - b);
    }

    public static getRangeOptions(characters: ICharacter2[]): number[] {
        return uniq(characters.filter(x => !!x.rangeDistance).map(x => x.rangeDistance ?? 1)).toSorted((a, b) => a - b);
    }

    public static getDamageTypesOptions(characters: ICharacter2[]): DamageType[] {
        return uniq(characters.flatMap(x => x.damageTypes.all));
    }

    /** Returns the `Trait` labels present on the roster (not the raw storage keys). */
    public static getTraitsOptions(characters: ICharacter2[]): Trait[] {
        const activeTraitKeys = new Set<string>();
        for (const c of characters) {
            if (c.traits) for (const t of c.traits) activeTraitKeys.add(t as unknown as string);
        }

        return Object.values(Trait).filter(label => {
            const key = getTraitStringFromLabel(label);
            return !!key && activeTraitKeys.has(key);
        });
    }
}
