import { groupBy, map, sortBy, sumBy, uniq } from 'lodash';

import unitsData from '../assets/UnitData.json';
import dirtyDozen from '../assets/DirtyDozen.json';

import whatsNew from '../assets/WhatsNew.json';

import campaignConfigs from '../assets/campaignConfigs.json';
import battleData from '../assets/battleData.json';
import recipeData from '../assets/recipeData.json';
import rankUpData from '../assets/rankUpData.json';

import shadowsun from '../assets/legendary-events/Shadowsun.json';
import aunshi from '../assets/legendary-events/Aunshi.json';
import ragnar from '../assets/legendary-events/Ragnar.json';

import {
    ICampaignBattle,
    ICampaignBattleComposed,
    ICampaignConfigs,
    ICampaignsData,
    ICharLegendaryEvents,
    IDirtyDozenChar,
    IDropRate,
    IMaterialRecipeIngredientFull,
    IRankUpData,
    IRecipeData,
    IRecipeDataFull,
    IUnitData,
    IWhatsNew,
    UnitDataRaw,
} from '../models/interfaces';
import { CampaignType, Faction, RarityString } from '../models/enums';
import { rarityStringToNumber, rarityToStars } from '../models/constants';

export class StaticDataService {
    static readonly dirtyDozenData: IDirtyDozenChar[] = dirtyDozen;
    static readonly whatsNew: IWhatsNew = whatsNew;
    static readonly campaignConfigs: ICampaignConfigs = campaignConfigs;
    static readonly battleData: ICampaignsData = battleData;
    static readonly recipeData: IRecipeData = recipeData;
    static readonly rankUpData: IRankUpData = rankUpData;
    static readonly campaignsComposed: Record<string, ICampaignBattleComposed> = this.getCampaignComposed();

    static readonly unitsData: IUnitData[] = (unitsData as UnitDataRaw[]).map(this.convertUnitData);
    static readonly campaignsGrouped: Record<string, ICampaignBattleComposed[]> = this.getCampaignGrouped();
    static readonly recipeDataFull: IRecipeDataFull = this.convertRecipeData();

    static readonly legendaryEvents = [
        {
            id: shadowsun.id,
            name: shadowsun.name,
            stage: shadowsun.eventStage,
            nextEventDate: shadowsun.nextEventDate,
            mobileRoute: '/mobile/le/shadowsun',
            icon: 'ShadowSun.png',
        },
        {
            id: aunshi.id,
            name: aunshi.name,
            stage: aunshi.eventStage,
            nextEventDate: aunshi.nextEventDate,
            mobileRoute: '/mobile/le/aunshi',
            icon: 'Aun-shi.png',
        },
        {
            id: ragnar.id,
            name: ragnar.name,
            stage: ragnar.eventStage,
            nextEventDate: ragnar.nextEventDate,
            mobileRoute: '/mobile/le/ragnar',
            icon: 'unset.png',
        },
    ];

    static getCampaignGrouped(): Record<string, ICampaignBattleComposed[]> {
        const allBattles = sortBy(Object.values(this.campaignsComposed), 'nodeNumber');
        return groupBy(allBattles, 'campaign');
    }

    static getCampaignComposed(): Record<string, ICampaignBattleComposed> {
        const result: Record<string, ICampaignBattleComposed> = {};
        for (const battleDataKey in this.battleData) {
            const battle = this.battleData[battleDataKey];

            const config = this.campaignConfigs[battle.campaignType as CampaignType];
            const recipe = this.recipeData[battle.reward];
            const dropRateKey: keyof IDropRate = recipe?.rarity.toLowerCase() as keyof IDropRate;

            const dropRate = config.dropRate[dropRateKey];
            const energyPerItem = 1 / (dropRate / config.energyCost);

            result[battleDataKey] = {
                campaign: battle.campaign,
                energyCost: config.energyCost,
                dailyBattleCount: config.dailyBattleCount,
                dropRate,
                energyPerItem,
                nodeNumber: battle.nodeNumber,
                rarity: recipe.rarity,
                reward: battle.reward,
                expectedGold: battle.expectedGold,
            };
        }

        return result;
    }

    static getUpgradesLocations(): Record<string, string[]> {
        const result: Record<string, string[]> = {};
        const battles: ICampaignBattle[] = [];
        for (const battleDataKey in this.battleData) {
            battles.push({ ...this.battleData[battleDataKey], shortName: battleDataKey });
        }

        const groupedData = groupBy(battles, 'reward');

        for (const key in groupedData) {
            const value = groupedData[key].map(x => x.shortName ?? '');
            result[key] = value;
        }

        return result;
    }

    static convertRecipeData(): IRecipeDataFull {
        const result: IRecipeDataFull = {};
        const upgrades = Object.keys(this.recipeData);
        const upgradeLcoaitons = this.getUpgradesLocations();

        const getRecipe = (
            material: string,
            count: number,
            allMaterials: IMaterialRecipeIngredientFull[]
        ): IMaterialRecipeIngredientFull => {
            const upgrade = this.recipeData[material];
            const locations = upgradeLcoaitons[material] ?? [];

            if (!upgrade || !upgrade.recipe?.length) {
                const item: IMaterialRecipeIngredientFull = {
                    material,
                    count,
                    rarity: rarityStringToNumber[upgrade?.rarity as RarityString],
                    stat: upgrade?.stat ?? '',
                    locations: locations,
                };
                allMaterials.push(item);
                return item;
            } else {
                return {
                    material,
                    count,
                    stat: upgrade.stat,
                    locations: locations,
                    rarity: rarityStringToNumber[upgrade.rarity as RarityString],
                    recipe: upgrade.recipe.map(item => getRecipe(item.material, count * item.count, allMaterials)),
                };
            }
        };

        for (const upgradeName of upgrades) {
            const upgrade = this.recipeData[upgradeName];
            if (!upgrade.craftable) {
                result[upgradeName] = {
                    material: upgrade.material,
                    stat: upgrade.stat,
                    rarity: rarityStringToNumber[upgrade.rarity as RarityString],
                    craftable: upgrade.craftable,
                    allMaterials: [getRecipe(upgrade.material, 1, [])],
                };
            } else {
                const allMaterials: IMaterialRecipeIngredientFull[] = [];
                result[upgradeName] = {
                    material: upgrade.material,
                    stat: upgrade.stat,
                    rarity: rarityStringToNumber[upgrade.rarity as RarityString],
                    craftable: upgrade.craftable,
                    recipe: upgrade.recipe?.map(item => getRecipe(item.material, item.count, allMaterials)),
                };

                const groupedData = groupBy(allMaterials, 'material');

                result[upgradeName].allMaterials = map(groupedData, (items, material) => ({
                    material,
                    count: sumBy(items, 'count'),
                    rarity: items[0].rarity,
                    stat: items[0].stat,
                    locations: items[0].locations,
                }));
            }
        }

        return result;
    }

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
            initialRarity: rarityStringToNumber[rawData['Initial rarity']],
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
            },
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
