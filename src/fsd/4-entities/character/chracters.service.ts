import { orderBy, uniq } from 'lodash';

import {
    UnitType,
    RarityMapper,
    RarityString,
    Alliance,
    Faction,
    Equipment,
    Trait,
    DamageType,
} from '@/fsd/5-shared/model';

import { charactersData } from './data';
import { UnitDataRaw, ICharacterData, ICharLegendaryEvents } from './model';

export class CharactersService {
    static readonly charactersData: ICharacterData[] = charactersData.map(this.convertUnitData);

    static readonly lreCharacters: ICharacterData[] = orderBy(
        this.charactersData.filter(unit => !!unit.lre),
        ['lre.finished', x => new Date(x.lre?.nextEventDateUtc ?? '').getTime()],
        ['asc', 'asc']
    );

    static readonly activeLres = this.lreCharacters.filter(x => !x.lre?.finished);
    static readonly inactiveLres = this.lreCharacters.filter(x => !!x.lre?.finished);

    static readonly activeLre: ICharacterData = (() => {
        const now = new Date();
        const eightDays = 8;
        const currentLreDate = new Date(this.lreCharacters[0]!.lre!.nextEventDateUtc!);
        currentLreDate.setDate(currentLreDate.getDate() + eightDays);

        if (now < currentLreDate) {
            return this.lreCharacters[0];
        } else {
            return (
                this.lreCharacters.find(x => {
                    const eventDate = new Date(x.lre?.nextEventDateUtc ?? '');
                    return eventDate > now;
                }) ?? this.lreCharacters[0]
            );
        }
    })();

    /**
     * @param id The unit ID of the character or MoW.
     * @returns An ICharacterData representation, or null.
     */
    public static getUnit(id: string): ICharacterData | undefined {
        return this.charactersData.find(x => x.id === id);
    }

    private static convertUnitData(rawData: UnitDataRaw): ICharacterData {
        const unitData: ICharacterData = {
            id: rawData.Name,
            tacticusId: rawData.tacticusId,
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
            equipment1: CharactersService.parseEquipmentType(rawData.Equipment1),
            equipment2: CharactersService.parseEquipmentType(rawData.Equipment2),
            equipment3: CharactersService.parseEquipmentType(rawData.Equipment3),
            meleeHits: rawData['Melee Hits'],
            rangeHits: rawData['Ranged Hits'],
            rangeDistance: rawData.Distance,
            movement: rawData.Movement,
            forcedSummons: rawData.ForcedSummons,
            requiredInCampaign: rawData.RequiredInCampaign,
            campaignsRequiredIn: rawData.CampaignsRequiredIn,
            legendaryEvents: {} as ICharLegendaryEvents,
            traits: rawData.Traits as Trait[],
            icon: rawData.Icon,
            damageTypes: {
                all: [rawData['Melee Damage'] as DamageType],
                melee: rawData['Melee Damage'] as DamageType,
            },
            releaseRarity: rawData.ReleaseRarity,
            releaseDate: rawData.releaseDate,
            lre: rawData.lre,
        };

        if (rawData['Ranged Damage']) {
            unitData.damageTypes.all.push(rawData['Ranged Damage'] as DamageType);
            unitData.damageTypes.range = rawData['Ranged Damage'] as DamageType;
        }
        if (rawData['Active Ability']) {
            unitData.damageTypes.all.push(rawData['Active Ability'] as DamageType);
            unitData.damageTypes.activeAbility = rawData['Active Ability'] as DamageType;
        }
        if (rawData['Passive Ability']) {
            unitData.damageTypes.all.push(rawData['Passive Ability'] as DamageType);
            unitData.damageTypes.passiveAbility = rawData['Passive Ability'] as DamageType;
        }
        unitData.damageTypes.all = uniq(unitData.damageTypes.all);

        const isReleased = unitData.releaseDate
            ? CharactersService.isAtLeast3DaysBefore(new Date(unitData.releaseDate))
            : true;

        unitData.icon = isReleased ? unitData.icon : 'comingSoon.webp';

        return unitData;
    }

    public static parseEquipmentType(equip: string): Equipment {
        const e = equip === 'Defense' ? 'Defensive' : equip;
        return e as Equipment;
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
}
