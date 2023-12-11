import { cloneDeep, groupBy, map, orderBy, sortBy, sum, sumBy, uniq } from 'lodash';

import unitsData from '../assets/UnitData.json';
import dirtyDozen from '../assets/DirtyDozen.json';

import whatsNew from '../assets/WhatsNew.json';
import contributors from '../assets/contributors/thankYou.json';
import contentCreators from '../assets/contributors/contentCreators.json';

import campaignConfigs from '../assets/campaignConfigs.json';
import battleData from '../assets/battleData.json';
import recipeData from '../assets/recipeData.json';
import rankUpData from '../assets/rankUpData.json';

import shadowsun from '../assets/legendary-events/Shadowsun.json';
import aunshi from '../assets/legendary-events/Aunshi.json';
import ragnar from '../assets/legendary-events/Ragnar.json';
import vitruvius from '../assets/legendary-events/Vitruvius.json';

import {
    ICampaignBattle,
    ICampaignBattleComposed,
    ICampaignConfigs,
    ICampaignsData,
    ICampaignsProgress,
    ICharacterRankRange,
    ICharLegendaryEvents,
    IContentCreator,
    IContributor,
    IDailyRaid,
    IDirtyDozenChar,
    IDropRate,
    IEstimatedRanks,
    IEstimatedRanksSettings,
    IMaterialEstimated2,
    IMaterialFull,
    IMaterialRaid,
    IMaterialRecipeIngredientFull,
    IRankUpData,
    IRecipeData,
    IRecipeDataFull,
    IUnitData,
    IWhatsNew,
    UnitDataRaw,
} from '../models/interfaces';
import { CampaignType, Faction, Rank, RarityString } from '../models/enums';
import { rarityStringToNumber, rarityToStars } from '../models/constants';
import { getEnumValues, rankToString } from '../shared-logic/functions';

export class StaticDataService {
    static readonly dirtyDozenData: IDirtyDozenChar[] = dirtyDozen;
    static readonly whatsNew: IWhatsNew = whatsNew;
    static readonly campaignConfigs: ICampaignConfigs = campaignConfigs;
    static readonly battleData: ICampaignsData = battleData;
    static readonly recipeData: IRecipeData = recipeData;
    static readonly rankUpData: IRankUpData = rankUpData;
    static readonly contributors: IContributor[] = contributors;
    static readonly contentCreators: IContentCreator[] = contentCreators;
    static readonly campaignsComposed: Record<string, ICampaignBattleComposed> = this.getCampaignComposed();

    static readonly unitsData: IUnitData[] = (unitsData as UnitDataRaw[]).map(this.convertUnitData);
    static readonly campaignsGrouped: Record<string, ICampaignBattleComposed[]> = this.getCampaignGrouped();
    static readonly recipeDataFull: IRecipeDataFull = this.convertRecipeData();

    static readonly legendaryEvents = [
        {
            id: vitruvius.id,
            name: vitruvius.name,
            stage: vitruvius.eventStage,
            nextEventDate: vitruvius.nextEventDate,
            mobileRoute: '/mobile/plan/le/vitruvius',
            icon: 'vitruvius.png',
        },
        {
            id: ragnar.id,
            name: ragnar.name,
            stage: ragnar.eventStage,
            nextEventDate: ragnar.nextEventDate,
            mobileRoute: '/mobile/plan/le/ragnar',
            icon: 'Ragnar.png',
        },
        {
            id: aunshi.id,
            name: aunshi.name,
            stage: aunshi.eventStage,
            nextEventDate: aunshi.nextEventDate,
            mobileRoute: '/mobile/plan/le/aunshi',
            icon: 'Aun-shi.png',
        },
        {
            id: shadowsun.id,
            name: shadowsun.name,
            stage: shadowsun.eventStage,
            nextEventDate: shadowsun.nextEventDate,
            mobileRoute: '/mobile/plan/le/shadowsun',
            icon: 'ShadowSun.png',
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
                energyPerItem: parseFloat(energyPerItem.toFixed(2)),
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
        const upgradeLocations = this.getUpgradesLocations();

        const getRecipe = (
            material: string,
            count: number,
            allMaterials: IMaterialRecipeIngredientFull[]
        ): IMaterialRecipeIngredientFull => {
            const upgrade = this.recipeData[material];
            const locations = upgradeLocations[material] ?? [];

            if (!upgrade || !upgrade.recipe?.length) {
                const item: IMaterialRecipeIngredientFull = {
                    id: material,
                    label: upgrade?.label ?? upgrade?.material,
                    count,
                    rarity: rarityStringToNumber[upgrade?.rarity as RarityString],
                    stat: upgrade?.stat ?? '',
                    locations: locations,
                    craftable: upgrade?.craftable,
                    locationsComposed: locations.map(x => this.campaignsComposed[x]),
                    iconPath: upgrade?.icon ?? '',
                    characters: [],
                    priority: 0,
                };
                allMaterials.push(item);
                return item;
            } else {
                return {
                    id: material,
                    label: upgrade.label ?? upgrade.material,
                    count,
                    stat: upgrade.stat,
                    craftable: upgrade.craftable,
                    locations: locations,
                    locationsComposed: locations.map(x => this.campaignsComposed[x]),
                    rarity: rarityStringToNumber[upgrade.rarity as RarityString],
                    recipe: upgrade.recipe.map(item => getRecipe(item.material, count * item.count, allMaterials)),
                    iconPath: upgrade.icon ?? '',
                    characters: [],
                    priority: 0,
                };
            }
        };

        for (const upgradeName of upgrades) {
            const upgrade = this.recipeData[upgradeName];
            if (!upgrade.craftable) {
                result[upgradeName] = {
                    id: upgrade.material,
                    label: upgrade.label ?? upgrade.material,
                    stat: upgrade.stat,
                    rarity: rarityStringToNumber[upgrade.rarity as RarityString],
                    craftable: upgrade.craftable,
                    allMaterials: [getRecipe(upgrade.material, 1, [])],
                    iconPath: upgrade.icon ?? '',
                };
            } else {
                const allMaterials: IMaterialRecipeIngredientFull[] = [];
                result[upgradeName] = {
                    id: upgrade.material,
                    label: upgrade.label ?? upgrade.material,
                    stat: upgrade.stat,
                    rarity: rarityStringToNumber[upgrade.rarity as RarityString],
                    craftable: upgrade.craftable,
                    recipe: upgrade.recipe?.map(item => getRecipe(item.material, item.count, allMaterials)),
                    iconPath: upgrade.icon ?? '',
                };

                const groupedData = groupBy(allMaterials, 'material');

                result[upgradeName].allMaterials = map(groupedData, (items, material) => ({
                    id: material,
                    count: sumBy(items, 'count'),
                    quantity: 0,
                    countLeft: 0,
                    label: items[0].label,
                    craftable: items[0].craftable,
                    rarity: items[0].rarity,
                    stat: items[0].stat,
                    locations: items[0].locations,
                    locationsComposed: items[0].locationsComposed,
                    iconPath: items[0].iconPath ?? '',
                    characters: [],
                    priority: 0,
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
            case Faction.AdeptusMechanicus:
                return '#DD7E6B';
            default:
                return '#ffffff';
        }
    }

    static getRankUpgradeEstimatedDays(
        settings: IEstimatedRanksSettings,
        ...characters: Array<ICharacterRankRange>
    ): IEstimatedRanks {
        const upgrades = this.getUpgrades(...characters);

        const materials = this.getAllMaterials(settings, upgrades);

        const raids = this.generateDailyRaidsList(
            settings,
            materials.filter(x => x.id !== 'Gold')
        );

        const energySpent = sum(settings.completedLocations.flatMap(x => x.locations).map(x => x.energySpent));
        const totalEnergy = sum(raids.map(day => settings.dailyEnergy - day.energyLeft)) - energySpent;

        return {
            raids,
            upgrades,
            materials,
            totalEnergy,
        };
    }

    public static getUpgrades(...characters: Array<ICharacterRankRange>): IMaterialFull[] {
        const rankEntries: number[] = getEnumValues(Rank).filter(x => x > 0);
        const result: IMaterialFull[] = [];
        let priority = 0;
        for (const character of characters) {
            priority++;
            const characterUpgrades = StaticDataService.rankUpData[character.id];
            if (!characterUpgrades) {
                continue;
            }
            const ranksRange = rankEntries.filter(r => r >= character.rankStart && r < character.rankEnd);

            const rankUpgrades = ranksRange
                .flatMap((rank, index) => {
                    const result = characterUpgrades[rankToString(rank)] ?? [];
                    return index === 0 ? result.filter(x => !character.appliedUpgrades.includes(x)) : result;
                })
                .filter(x => !!x);

            if (!rankUpgrades.length) {
                continue;
            }

            const upgrades: IMaterialFull[] = rankUpgrades.map(upgrade => {
                const recipe = StaticDataService.recipeDataFull[upgrade];
                if (!recipe) {
                    // console.error('Recipe for ' + upgrade + ' is not found');

                    return {
                        rarity: 0,
                        craftable: false,
                        iconPath: upgrade,
                        stat: 'Unknown',
                        id: upgrade,
                        label: upgrade,
                        character: character.id,
                        priority,
                        recipe: [],
                        allMaterials: [],
                    };
                }
                return {
                    ...cloneDeep(recipe),
                    priority,
                    character: character.id,
                };
            });

            result.push(...upgrades);
        }

        return result;
    }

    public static getAllMaterials(settings: IEstimatedRanksSettings, upgrades: IMaterialFull[]): IMaterialEstimated2[] {
        if (settings.preferences?.farmByPriorityOrder) {
            const materials: IMaterialRecipeIngredientFull[] = [];
            const upgradesByCharacter = groupBy(upgrades, 'character');
            for (const character in upgradesByCharacter) {
                const characterMaterials = this.groupBaseMaterials(upgradesByCharacter[character]);
                materials.push(...characterMaterials);
            }
            const copiedUpgrades = { ...settings.upgrades };
            const result = materials
                .map(x =>
                    this.calculateMaterialData(
                        settings.campaignsProgress,
                        x,
                        this.selectBestLocations(settings, x.locationsComposed ?? []),
                        copiedUpgrades,
                        true
                    )
                )
                .filter(x => !!x) as IMaterialEstimated2[];

            return orderBy(
                result,
                ['priority', 'daysOfBattles', 'totalEnergy', 'rarity', 'count'],
                ['asc', 'desc', 'desc', 'desc', 'desc']
            );
        } else {
            const result = this.groupBaseMaterials(upgrades)
                .map(x =>
                    this.calculateMaterialData(
                        settings.campaignsProgress,
                        x,
                        this.selectBestLocations(settings, x.locationsComposed ?? []),
                        settings.upgrades
                    )
                )
                .filter(x => !!x) as IMaterialEstimated2[];

            return orderBy(
                result,
                ['daysOfBattles', 'totalEnergy', 'rarity', 'count'],
                ['desc', 'desc', 'desc', 'desc']
            );
        }
    }

    public static groupBaseMaterials(upgrades: IMaterialFull[], keepGold = false) {
        const groupedData = groupBy(
            upgrades.flatMap(x => {
                const result = x.allMaterials ?? [];
                if (x.character) {
                    result.forEach(material => {
                        material.priority = x.priority ?? 0;
                        material.characters = [...material.characters, x.character!];
                    });
                }
                return result;
            }),
            'material'
        );

        const result: IMaterialRecipeIngredientFull[] = map(groupedData, (items, material) => {
            return {
                id: material,
                count: sumBy(items, 'count'),
                label: items[0].label,
                rarity: items[0].rarity,
                iconPath: items[0].iconPath,
                stat: items[0].stat,
                craftable: items[0].craftable,
                locations: items[0].locations,
                priority: items[0].priority,
                characters: uniq(items.flatMap(item => item.characters)),
                locationsComposed: items[0].locations?.map(location => StaticDataService.campaignsComposed[location]),
            };
        });
        return keepGold ? result : result.filter(x => x.id !== 'Gold');
    }

    private static generateDailyRaidsList(
        settings: IEstimatedRanksSettings,
        allMaterials: IMaterialEstimated2[]
    ): IDailyRaid[] {
        const resultDays: IDailyRaid[] = [];

        const totalEnergy = sum(allMaterials.map(x => x.totalEnergy));
        let currEnergy = 0;
        const completedLocations = settings.completedLocations.flatMap(x => x.locations);
        let iteration = 0;

        while (currEnergy < totalEnergy) {
            const dayNumber = resultDays.length + 1;
            const isToday = dayNumber === 1;
            const day: IDailyRaid = {
                energyLeft: settings.dailyEnergy,
                raids: [],
            };
            let energyLeft = isToday
                ? settings.dailyEnergy - sum(completedLocations.map(x => x.energySpent))
                : settings.dailyEnergy;

            for (const material of allMaterials) {
                const locationsMinEnergyConst = Math.min(...material.locations.map(x => x.energyCost));
                if (material.totalEnergy < locationsMinEnergyConst) {
                    currEnergy += material.totalEnergy;
                    material.totalEnergy = 0;
                    continue;
                }

                const materialRaids: IMaterialRaid = {
                    materialId: material.id,
                    materialLabel: material.label,
                    materialIconPath: material.iconPath,
                    totalCount: material.count,
                    locations: [],
                    characters: material.characters,
                };

                for (const location of material.locations) {
                    const locationDailyEnergy = location.energyCost * location.dailyBattleCount;
                    const completedLocation =
                        isToday &&
                        completedLocations.find(
                            completedLocation => completedLocation.id === location.campaign + location.nodeNumber
                        );
                    if (completedLocation) {
                        materialRaids.locations.push(completedLocation);
                        continue;
                    }

                    if (material.totalEnergy > locationDailyEnergy) {
                        if (energyLeft > locationDailyEnergy) {
                            energyLeft -= locationDailyEnergy;
                            currEnergy += locationDailyEnergy;
                            material.totalEnergy -= locationDailyEnergy;

                            materialRaids.locations.push({
                                id: location.campaign + location.nodeNumber,
                                campaign: location.campaign,
                                battleNumber: location.nodeNumber,
                                raidsCount: location.dailyBattleCount,
                                farmedItems: locationDailyEnergy / location.energyPerItem,
                                energySpent: locationDailyEnergy,
                            });
                        }
                    } else if (energyLeft > material.totalEnergy) {
                        const numberOfBattles = Math.floor(material.totalEnergy / location.energyCost);
                        const maxNumberOfBattles =
                            numberOfBattles > location.dailyBattleCount ? location.dailyBattleCount : numberOfBattles;

                        if (numberOfBattles <= 0) {
                            continue;
                        }
                        const energySpent = maxNumberOfBattles * location.energyCost;

                        energyLeft -= energySpent;
                        currEnergy += energySpent;
                        material.totalEnergy -= energySpent;

                        materialRaids.locations.push({
                            id: location.campaign + location.nodeNumber,
                            campaign: location.campaign,
                            battleNumber: location.nodeNumber,
                            raidsCount: maxNumberOfBattles,
                            farmedItems: energySpent / location.energyPerItem,
                            energySpent: energySpent,
                        });
                    } else if (energyLeft > location.energyCost) {
                        const numberOfBattles = Math.floor(energyLeft / location.energyCost);
                        const maxNumberOfBattles =
                            numberOfBattles > location.dailyBattleCount ? location.dailyBattleCount : numberOfBattles;

                        if (numberOfBattles <= 0) {
                            continue;
                        }

                        const energySpent = maxNumberOfBattles * location.energyCost;

                        energyLeft -= energySpent;
                        currEnergy += energySpent;
                        material.totalEnergy -= energySpent;

                        materialRaids.locations.push({
                            id: location.campaign + location.nodeNumber,
                            campaign: location.campaign,
                            battleNumber: location.nodeNumber,
                            raidsCount: maxNumberOfBattles,
                            farmedItems: energySpent / location.energyPerItem,
                            energySpent: energySpent,
                        });
                    }
                }

                if (materialRaids.locations.length) {
                    day.raids.push(materialRaids);
                }
            }
            if (isToday) {
                const completedMaterials = settings.completedLocations.filter(
                    x => !day.raids.some(material => material.materialId === x.materialId)
                );
                day.raids.push(...completedMaterials);
            }

            day.energyLeft = energyLeft;
            if (day.raids.length) {
                resultDays.push(day);
            }

            iteration++;
            if (iteration > 1000) {
                console.error('Infinite loop', resultDays);
                break;
            }
        }

        return resultDays;
    }

    private static calculateMaterialData(
        campaignsProgress: ICampaignsProgress,
        material: IMaterialRecipeIngredientFull,
        bestLocations: ICampaignBattleComposed[],
        ownedUpgrades: Record<string, number>,
        updateInventory = false
    ): IMaterialEstimated2 | null {
        const lockedLocations = (material.locationsComposed ?? []).filter(location => {
            const campaignProgress = campaignsProgress[location.campaign as keyof ICampaignsProgress];
            return location.nodeNumber > campaignProgress;
        });
        const selectedLocations = bestLocations?.length ? bestLocations : material.locationsComposed ?? [];

        const ownedCount = ownedUpgrades[material.id] ?? 0;
        const leftCount = ownedCount > material.count ? 0 : material.count - ownedCount;
        if (updateInventory) {
            const updatedCount = ownedCount - material.count;
            ownedUpgrades[material.id] = updatedCount > 0 ? updatedCount : 0;
        }

        let expectedEnergy = 0;
        let numberOfBattles = 0;
        let farmedItems = 0;
        let daysOfBattles = 0;

        while (farmedItems < leftCount) {
            let leftToFarm = leftCount - farmedItems;
            for (const loc of selectedLocations) {
                const dailyEnergy = loc.dailyBattleCount * loc.energyCost;
                const dailyFarmedItems = dailyEnergy / loc.energyPerItem;
                if (leftToFarm >= dailyFarmedItems) {
                    leftToFarm -= dailyFarmedItems;
                    expectedEnergy += dailyEnergy;
                    farmedItems += dailyFarmedItems;
                    numberOfBattles += loc.dailyBattleCount;
                } else {
                    const energyLeftToFarm = leftToFarm * loc.energyPerItem;
                    const battlesLeftToFarm = Math.ceil(energyLeftToFarm / loc.energyCost);
                    farmedItems += leftToFarm;
                    expectedEnergy += battlesLeftToFarm * loc.energyCost;
                    numberOfBattles += battlesLeftToFarm;
                    break;
                }
            }
            daysOfBattles++;
            if (daysOfBattles > 1000) {
                console.error('Infinite loop', material, bestLocations);
                break;
            }
        }

        const dailyEnergy = sum(selectedLocations.map(x => x.dailyBattleCount * x.energyCost));
        const dailyBattles = sum(selectedLocations.map(x => x.dailyBattleCount));
        const locations = selectedLocations.map(x => x.campaign + ' ' + x.nodeNumber).join(', ');
        const missingLocationsString = !bestLocations.length
            ? material.locationsComposed
                  ?.filter(x => {
                      return !bestLocations.some(y => x.campaign === y.campaign && x.nodeNumber === y.nodeNumber);
                  })
                  .map(x => x.campaign + ' ' + x.nodeNumber)
                  .join(', ') ?? ''
            : lockedLocations.map(x => x.campaign + ' ' + x.nodeNumber).join(', ');

        return {
            expectedEnergy,
            numberOfBattles,
            totalEnergy: expectedEnergy,
            dailyEnergy,
            daysOfBattles,
            dailyBattles,
            id: material.id,
            label: material.label,
            locations: selectedLocations,
            locationsString: locations,
            missingLocationsString,
            count: material.count,
            rarity: material.rarity,
            quantity: ownedCount,
            countLeft: leftCount,
            iconPath: material.iconPath,
            characters: material.characters,
            priority: material.priority,
        };
    }

    private static selectBestLocations(
        settings: IEstimatedRanksSettings,
        locationsComposed: ICampaignBattleComposed[]
    ): ICampaignBattleComposed[] {
        const unlockedLocations = locationsComposed.filter(location => {
            const campaignProgress = settings.campaignsProgress[location.campaign as keyof ICampaignsProgress];
            return location.nodeNumber <= campaignProgress;
        });

        const minEnergy = Math.min(...unlockedLocations.map(x => x.energyPerItem));
        const maxEnergy = Math.max(...unlockedLocations.map(x => x.energyPerItem));

        let filteredLocations: ICampaignBattleComposed[] = unlockedLocations;

        if (settings.preferences) {
            const { useLeastEfficientNodes, useMoreEfficientNodes, useMostEfficientNodes } = settings.preferences;
            filteredLocations = unlockedLocations.filter(location => {
                if (!useMostEfficientNodes && !useMoreEfficientNodes && !useLeastEfficientNodes) {
                    return true;
                }

                if (useMostEfficientNodes && location.energyPerItem === minEnergy) {
                    return true;
                }

                if (useLeastEfficientNodes && location.energyPerItem === maxEnergy) {
                    return true;
                }

                return (
                    useMoreEfficientNodes && location.energyPerItem > minEnergy && location.energyPerItem < maxEnergy
                );
            });

            if (!filteredLocations.length && unlockedLocations.length) {
                filteredLocations = [unlockedLocations[0]];
            }
        }

        return orderBy(filteredLocations, ['energyPerItem', 'expectedGold'], ['asc', 'desc']);
    }
}
