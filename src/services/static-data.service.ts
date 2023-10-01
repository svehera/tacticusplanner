import { uniq } from 'lodash';

import unitsData from '../assets/UnitData.json';
import dirtyDozen from '../assets/DirtyDozen.json';

import { ICharLegendaryEvents, IDirtyDozenChar, IUnitData, UnitDataRaw } from '../models/interfaces';
import { Faction } from '../models/enums';
import { rarityStringToNumber, rarityToStars } from '../models/constants';

export class StaticDataService {

    static readonly unitsData: IUnitData[] = (unitsData as UnitDataRaw[]).map(this.convertUnitData);
    static readonly dirtyDozenData: IDirtyDozenChar[] = dirtyDozen;

    static convertUnitData(rawData: UnitDataRaw): IUnitData {
        const unitData: IUnitData = {
            alliance: rawData.Alliance,
            faction: rawData.Faction,
            factionColor: StaticDataService.getFactionColor(rawData.Faction),
            name: rawData.Name,
            numberAdded: rawData.Number,
            health: rawData.Health,
            damage: rawData.Damage,
            armour: rawData.Armour,
            rarity: rarityStringToNumber[rawData['Initial rarity']],
            rarityStars: rarityToStars[rarityStringToNumber[rawData['Initial rarity']]],
            equipment1: rawData.Equipment1,
            equipment2: rawData.Equipment2,
            equipment3: rawData.Equipment3,
            meleeHits: rawData['Melee Hits'],
            rangeHits: rawData['Ranged Hits'],
            rangeDistance: rawData.Distance,
            movement: rawData.Movement,
            forcedSummons: rawData.ForcedSummons,
            requiredInCampaign: rawData.RequiredInCampaign,
            legendaryEvents: {} as ICharLegendaryEvents,
            traits: rawData.Traits,
            icon: rawData.Icon,
            damageTypes: {
                all: [rawData['Melee Damage']],
                melee: rawData['Melee Damage'],
            }
        };

        if (rawData['Ranged Damage']) {
            unitData.damageTypes.all.push(rawData['Ranged Damage']);
            unitData.damageTypes.range = rawData['Ranged Damage'];
        }
        if (rawData['Active Ability']) {
            unitData.damageTypes.all.push(rawData['Active Ability']);
            unitData.damageTypes.activeAbility = rawData['Active Ability'];
        }
        if (rawData['Passive Ability']) {
            unitData.damageTypes.all.push(rawData['Passive Ability']);
            unitData.damageTypes.passiveAbility = rawData['Passive Ability'];
        }
        unitData.damageTypes.all = uniq(unitData.damageTypes.all);

        return unitData;
    }

    static getFactionColor(faction: Faction): string {
        switch (faction) {
        case Faction.Ultramarines:
            return '#C9DAF8';
        case Faction.Black_Legion:
            return '#DD7E6B';
        case Faction.Orks:
            return '#FFE599';
        case Faction.ADEPTA_SORORITAS:
            return '#F4CCCC';
        case Faction.Necrons:
            return '#B6D7A8';
        case Faction.Astra_militarum:
            return '#D9EAD3';
        case Faction.Death_Guard:
            return '#93C47D';
        case Faction.Black_Templars:
            return '#D9D9D9';
        case Faction.Aeldari:
            return '#A2C4C9';
        case Faction.Space_Wolves:
            return '#A4C2F4';
        case Faction.T_Au:
            return '#FCE5CD';
        case Faction.Dark_Angels:
            return '#93C47D';
        case Faction.Thousand_Sons:
            return '#A4C2F4';
        case Faction.Tyranids:
            return 'violet';
        default:
            return '#ffffff';
        }
    }
}
