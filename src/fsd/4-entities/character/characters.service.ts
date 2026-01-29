import { uniq } from 'lodash';

import {
    UnitType,
    RarityMapper,
    RarityString,
    Alliance,
    Faction,
    Equipment,
    Trait,
    DamageType,
    Rarity,
} from '@/fsd/5-shared/model';

// eslint-disable-next-line boundaries/element-types
import { ILegendaryEventStatic, LegendaryEventEnum, LegendaryEventService } from '@/fsd/4-entities/lre';

import { charactersData } from './data';
import { UnitDataRaw, ICharacterData, ICharLegendaryEvents, ILreCharacterStaticData, ICharacter2 } from './model';

const equipmentTypeMapping = {
    Crit: Equipment.Crit,
    Block: Equipment.Block,
    'Crit Booster': Equipment.CritBooster,
    'Block Booster': Equipment.BlockBooster,
    Defensive: Equipment.Defensive,
    Defense: Equipment.Defensive,
} as const;

export class CharactersService {
    static readonly charactersData: ICharacterData[] = charactersData.map(this.convertUnitData);

    static readonly lreCharacters: ICharacterData[] = LegendaryEventService.getLegendaryEvents()
        .map(lre => {
            const character = this.charactersData.find(unit => unit.snowprintId === lre.unitSnowprintId);
            if (character) return { ...character, lre: this.toILreCharacterStaticData(lre) };
            return character;
        })
        .filter(Boolean) as ICharacterData[];

    static readonly activeLres = this.lreCharacters.filter(x => !x.lre?.finished);
    static readonly inactiveLres = this.lreCharacters.filter(x => !!x.lre?.finished);

    public static getInitialRarity(snowprintId: string): Rarity | undefined {
        const character = this.charactersData.find(unit => unit.snowprintId === snowprintId);
        return character?.initialRarity;
    }

    static readonly activeLre: ICharacterData = (() => {
        return this.charactersData.find(unit => unit.snowprintId === LegendaryEventService.getActiveLreUnitId())!;
    })();

    public static getLreCharacter(id: LegendaryEventEnum): ICharacterData | undefined {
        return this.lreCharacters.find(unit => {
            const event = LegendaryEventService.getEventByCharacterSnowprintId(unit.snowprintId!);
            return event?.id === id;
        });
    }

    /**
     * @param id The unit ID of the character or MoW.
     * @returns An ICharacterData representation, or null.
     */
    public static getUnit(id: string): ICharacterData | undefined {
        return this.charactersData.find(
            x => x.id === id || x.snowprintId === id || x.fullName === id || x.shortName === id
        );
    }

    /**
     * Snowprint's internal assets refer to damage type as damage profile, and
     * they use a different string. This converts from their string to our enum.
     * @param rawData The raw data from Snowprint.
     * @returns The converted DamageType.
     */
    private static convertSnowprintDamageProfile(rawData: string): DamageType {
        const ret: DamageType = DamageType[rawData as keyof typeof DamageType] || DamageType.Physical;
        if (rawData === 'DirectDamage') return DamageType.Direct;
        if (rawData === 'Gauss') return DamageType.Molecular;
        if (ret == DamageType.Physical && rawData !== 'Physical') {
            console.warn(`Unknown damage profile: ${rawData}`);
        }
        return ret;
    }

    private static convertUnitData(rawData: UnitDataRaw): ICharacterData {
        const unitData: ICharacterData = {
            id: rawData.Name,
            snowprintId: rawData.id,
            shortName: rawData['Short Name'],
            fullName: rawData['Full Name'],
            unitType: UnitType.character,
            alliance: rawData.Alliance as Alliance,
            faction: rawData.Faction as Faction,
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
        };

        if (rawData['Ranged Damage']) {
            unitData.damageTypes.all.push(CharactersService.convertSnowprintDamageProfile(rawData['Ranged Damage']));
            unitData.damageTypes.range = CharactersService.convertSnowprintDamageProfile(rawData['Ranged Damage']);
        }
        if (rawData['Active Ability']) {
            rawData['Active Ability'].forEach(x => {
                const damageType = CharactersService.convertSnowprintDamageProfile(x);
                unitData.damageTypes.all.push(damageType);
                unitData.damageTypes.activeAbility.push(damageType);
            });
        }
        if (rawData['Passive Ability']) {
            rawData['Passive Ability'].forEach(x => {
                const damageType = CharactersService.convertSnowprintDamageProfile(x);
                unitData.damageTypes.all.push(damageType);
                unitData.damageTypes.passiveAbility.push(damageType);
            });
        }
        unitData.damageTypes.all = uniq(unitData.damageTypes.all);

        const isReleased = unitData.releaseDate
            ? CharactersService.isAtLeast3DaysBefore(new Date(unitData.releaseDate))
            : true;

        unitData.icon = isReleased ? unitData.icon : 'comingSoon.webp';

        return unitData;
    }

    public static parseEquipmentType(equip: string): Equipment | undefined {
        // ToDo: consider using `Zod.enum` for this kind of parsing/validation
        // Ref: https://zod.dev/api#enum
        const equipmentType = equipmentTypeMapping[equip as keyof typeof equipmentTypeMapping];
        if (!equipmentType) return undefined;
        return equipmentType;
    }

    static canonicalName(identifier: string): string {
        const unit = this.getUnit(identifier);
        if (unit) return unit.snowprintId!;
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
        const ret = CharactersService.charactersData.find(
            x => x.snowprintId! == CharactersService.canonicalName(identifier)
        );
        return ret!;
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
                    console.error('Could not resolve character ', x.snowprintId ?? x.name);
                    return undefined;
                }
                return { ...x, ...staticChar };
            })
            .filter(x => x !== undefined) as ICharacter2[];
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
}
