import { cloneDeep, groupBy, map, orderBy, sortBy, sum, sumBy, uniq } from 'lodash';

import unitsData from '../assets/UnitData.json';

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
import kharn from '../assets/legendary-events/Kharn.json';
import mephiston from '../assets/legendary-events/Mephiston.json';

import {
    ICampaignBattle,
    ICampaignBattleComposed,
    ICampaignConfigs,
    ICampaignsData,
    ICampaignsProgress,
    ICharLegendaryEvents,
    IContentCreator,
    IContributor,
    IEstimatedRanksSettings,
    IMaterialEstimated2,
    IMaterialFull,
    IMaterialRecipeIngredientFull,
    IRankUpData,
    IRecipeData,
    IRecipeDataFull,
    IUnitData,
    IWhatsNew,
    UnitDataRaw,
} from '../models/interfaces';
import { Faction, Rank, Rarity, RarityString } from '../models/enums';
import { rarityStringToNumber, rarityToStars } from '../models/constants';
import { getEnumValues, rankToString } from '../shared-logic/functions';
import { CampaignsService } from 'src/v2/features/goals/campaigns.service';
import { IRankLookup } from 'src/v2/features/goals/goals.models';
import { UnitType } from 'src/v2/features/characters/units.enums';

export class StaticDataService {
    static readonly whatsNew: IWhatsNew = whatsNew;
    static readonly campaignConfigs: ICampaignConfigs = campaignConfigs;
    static readonly battleData: ICampaignsData = battleData;
    static readonly recipeData: IRecipeData = recipeData;
    static readonly rankUpData: IRankUpData = rankUpData;
    static readonly contributors: IContributor[] = contributors;
    static readonly contentCreators: IContentCreator[] = contentCreators;

    private static readonly ImperialFactions: Faction[] = [
        Faction.Ultramarines,
        Faction.Astra_militarum,
        Faction.Black_Templars,
        Faction.ADEPTA_SORORITAS,
        Faction.AdeptusMechanicus,
        Faction.Space_Wolves,
        Faction.Dark_Angels,
    ];

    private static readonly ChaosFactions: Faction[] = [
        Faction.Black_Legion,
        Faction.Death_Guard,
        Faction.Thousand_Sons,
        Faction.WorldEaters,
    ];

    static readonly campaignsComposed: Record<string, ICampaignBattleComposed> = CampaignsService.campaignsComposed;

    static readonly unitsData: IUnitData[] = (unitsData as UnitDataRaw[])
        .map(this.convertUnitData)
        .filter(x => !['Lucien', 'Titus'].includes(x.name));
    static readonly campaignsGrouped: Record<string, ICampaignBattleComposed[]> = this.getCampaignGrouped();
    static readonly recipeDataFull: IRecipeDataFull = this.convertRecipeData();

    static getItemLocations = (itemId: string): ICampaignBattleComposed[] => {
        const possibleLocations: ICampaignBattleComposed[] = [];
        const characterShardsData = StaticDataService.recipeDataFull[itemId];
        if (characterShardsData) {
            const fullData = characterShardsData.allMaterials && characterShardsData.allMaterials[0];
            if (fullData) {
                possibleLocations.push(...(fullData.locationsComposed ?? []));
            }
        }

        return possibleLocations;
    };

    static readonly legendaryEvents = [
        {
            id: mephiston.id,
            name: mephiston.name,
            stage: mephiston.eventStage,
            nextEventDate: mephiston.nextEventDate,
            mobileRoute: '/mobile/plan/le/mephiston',
            icon: 'unset.png',
        },
        {
            id: kharn.id,
            name: kharn.name,
            stage: kharn.eventStage,
            nextEventDate: kharn.nextEventDate,
            mobileRoute: '/mobile/plan/le/kharn',
            icon: 'kharn.png',
        },
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
            id: shadowsun.id,
            name: shadowsun.name,
            stage: shadowsun.eventStage,
            nextEventDate: shadowsun.nextEventDate,
            mobileRoute: '/mobile/plan/le/shadowsun',
            icon: 'ShadowSun.png',
        },
        {
            id: aunshi.id,
            name: aunshi.name,
            stage: aunshi.eventStage,
            nextEventDate: aunshi.nextEventDate,
            mobileRoute: '/mobile/plan/le/aunshi',
            icon: 'Aun-shi.png',
        },
    ];

    static getCampaignGrouped(): Record<string, ICampaignBattleComposed[]> {
        const allBattles = sortBy(Object.values(this.campaignsComposed), 'nodeNumber');
        return groupBy(allBattles, 'campaign');
    }

    static isValidaUpgrade(upgrade: string): boolean {
        return Object.hasOwn(recipeData, upgrade);
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
            materialId: string,
            count: number,
            allMaterials: IMaterialRecipeIngredientFull[]
        ): IMaterialRecipeIngredientFull => {
            const upgrade = this.recipeData[materialId];
            const locations = upgradeLocations[materialId] ?? [];

            if (!upgrade || !upgrade.recipe?.length) {
                const item: IMaterialRecipeIngredientFull = {
                    id: materialId,
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
                    id: materialId,
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

                const groupedData = groupBy(allMaterials, 'id');

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
            id: rawData.Name,
            shortName: rawData['Short Name'],
            unitType: UnitType.character,
            alliance: rawData.Alliance,
            faction: rawData.Faction,
            factionIcon: StaticDataService.getFactionIcon(rawData.Faction),
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
            releaseRarity: rawData.ReleaseRarity,
            releaseDate: rawData.releaseDate,
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

    static getFactionIcon(faction: Faction): string {
        switch (faction) {
            case Faction.Ultramarines:
                return 'Ultramarines';
            case Faction.Black_Legion:
                return 'Black_Legion';
            case Faction.Orks:
                return 'Orks';
            case Faction.ADEPTA_SORORITAS:
                return 'ADEPTA_SORORITAS';
            case Faction.Necrons:
                return 'Necrons';
            case Faction.Astra_militarum:
                return 'Astra_militarum';
            case Faction.Death_Guard:
                return 'Death_Guard';
            case Faction.Black_Templars:
                return 'Black_Templars';
            case Faction.Aeldari:
                return 'Aeldari';
            case Faction.Space_Wolves:
                return 'Space_Wolves';
            case Faction.T_Au:
                return 'T_Au';
            case Faction.Dark_Angels:
                return 'Dark_Angels';
            case Faction.Thousand_Sons:
                return 'Thousand_Sons';
            case Faction.Tyranids:
                return 'Tyranids';
            case Faction.AdeptusMechanicus:
                return 'AdeptusMechanicus';
            case Faction.WorldEaters:
                return 'worldeaters';
            default:
                return 'ffffff';
        }
    }

    static getFactionPray(faction: Faction): string {
        switch (faction) {
            case Faction.Ultramarines:
            case Faction.ADEPTA_SORORITAS:
            case Faction.Astra_militarum:
            case Faction.Black_Templars:
            case Faction.Space_Wolves:
            case Faction.Dark_Angels:
                return 'Pray for the God-Emperor of Mankind';
            case Faction.AdeptusMechanicus:
                return 'Pray for the Machine God';
            case Faction.Black_Legion:
                return 'Follow the Chaos Undivided';
            case Faction.Orks:
                return 'Believe in the Waaagh!';
            case Faction.Necrons:
                return "Serve the C'tan";
            case Faction.Death_Guard:
                return 'Pray for the Plague God';
            case Faction.Aeldari:
                return 'Follow various Paths';
            case Faction.T_Au:
                return 'Pray for Greater Good';
            case Faction.Thousand_Sons:
                return 'Follow the Architect of Fate';
            case Faction.Tyranids:
                return 'Bring more biomass';
            case Faction.WorldEaters:
                return 'More Blood for the Blood God!';
            default:
                return '';
        }
    }

    public static getUpgrades(...characters: Array<IRankLookup>): IMaterialFull[] {
        const rankEntries: number[] = getEnumValues(Rank).filter(x => x > 0);
        const result: IMaterialFull[] = [];
        let priority = 0;
        for (const character of characters) {
            priority++;
            const characterUpgrades = StaticDataService.rankUpData[character.unitName];
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

            // eslint-disable-next-line no-constant-condition
            if (character.rankPoint5) {
                const lastRankUpgrades = characterUpgrades[rankToString(character.rankEnd)];
                if (lastRankUpgrades) {
                    const rankPoint5Upgrades = lastRankUpgrades.filter((_, index) => (index + 1) % 2 !== 0);
                    if (character.rankStart === character.rankEnd) {
                        rankUpgrades.push(...rankPoint5Upgrades.filter(x => !character.appliedUpgrades.includes(x)));
                    } else {
                        rankUpgrades.push(...rankPoint5Upgrades);
                    }
                }
            }

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
                        character: character.unitName,
                        priority,
                        recipe: [],
                        allMaterials: [],
                    };
                }
                const allMaterials = character.upgradesRarity.length
                    ? recipe.allMaterials?.filter(material => character.upgradesRarity.includes(material.rarity))
                    : recipe.allMaterials;

                for (const allMaterial of allMaterials ?? []) {
                    allMaterial.characters = [];
                }

                return {
                    ...cloneDeep(recipe),
                    allMaterials,
                    priority,
                    character: character.unitName,
                };
            });

            result.push(...upgrades);
        }

        return result;
    }

    public static getAllMaterials(settings: IEstimatedRanksSettings, upgrades: IMaterialFull[]): IMaterialEstimated2[] {
        const result = this.groupBaseMaterials(upgrades)
            .map(x =>
                this.calculateMaterialData(
                    settings.campaignsProgress,
                    x,
                    this.selectBestLocations(settings, x.locationsComposed ?? [], x.rarity),
                    settings.upgrades,
                    {}
                )
            )
            .filter(x => !!x) as IMaterialEstimated2[];

        return orderBy(result, ['daysOfBattles', 'totalEnergy', 'rarity', 'count'], ['desc', 'desc', 'desc', 'desc']);
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
            'id'
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

    private static calculateMaterialData(
        campaignsProgress: ICampaignsProgress,
        material: IMaterialRecipeIngredientFull,
        bestLocations: ICampaignBattleComposed[],
        ownedUpgrades: Record<string, number>,
        craftedBasedUpgrades: Record<string, number>,
        updateInventory = false
    ): IMaterialEstimated2 | null {
        const lockedLocations = (material.locationsComposed ?? []).filter(location => {
            const campaignProgress = campaignsProgress[location.campaign as keyof ICampaignsProgress];
            return location.nodeNumber > campaignProgress;
        });
        const unlockedLocations = (material.locationsComposed ?? []).filter(location => {
            const campaignProgress = campaignsProgress[location.campaign as keyof ICampaignsProgress];
            return location.nodeNumber <= campaignProgress;
        });
        const selectedLocations = bestLocations?.length ? bestLocations : material.locationsComposed ?? [];

        const ownedCount = ownedUpgrades[material.id] ?? 0;
        const craftedCount = craftedBasedUpgrades[material.id] ?? 0;
        const neededCount = material.count - craftedCount;
        material.count = neededCount > 0 ? neededCount : 0;
        const leftCount = ownedCount >= material.count ? 0 : material.count - ownedCount;
        if (updateInventory) {
            const updatedCount = ownedCount - material.count;
            ownedUpgrades[material.id] = updatedCount > 0 ? updatedCount : 0;
            const updatedCrafted = neededCount > 0 ? 0 : Math.abs(neededCount);
            craftedBasedUpgrades[material.id] = updatedCrafted;
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
            unlockedLocations: unlockedLocations.map(x => x.id),
            possibleLocations: material.locationsComposed ?? [],
            locationsString: locations,
            missingLocationsString,
            isBlocked: locations === missingLocationsString,
            count: material.count,
            craftedCount: craftedCount,
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
        locationsComposed: ICampaignBattleComposed[],
        materialRarity: Rarity
    ): ICampaignBattleComposed[] {
        const unlockedLocations = locationsComposed
            .filter(location => {
                const campaignProgress = settings.campaignsProgress[location.campaign as keyof ICampaignsProgress];
                return location.nodeNumber <= campaignProgress;
            })
            .filter(location => {
                if (!settings.filters) {
                    return true;
                }
                const {
                    alliesFactions,
                    alliesAlliance,
                    enemiesAlliance,
                    enemiesFactions,
                    campaignTypes,
                    upgradesRarity,
                    slotsCount,
                } = settings.filters;

                if (slotsCount && slotsCount.length) {
                    if (!slotsCount.includes(location.slots ?? 5)) {
                        return false;
                    }
                }

                if (upgradesRarity.length) {
                    if (!upgradesRarity.includes(materialRarity)) {
                        return false;
                    }
                }

                if (campaignTypes.length) {
                    if (!campaignTypes.includes(location.campaignType)) {
                        return false;
                    }
                }

                if (alliesAlliance.length) {
                    if (!alliesAlliance.includes(location.alliesAlliance)) {
                        return false;
                    }
                }

                if (alliesFactions.length) {
                    if (!location.alliesFactions.some(faction => alliesFactions.includes(faction))) {
                        return false;
                    }
                }

                if (enemiesAlliance.length) {
                    if (!location.enemiesAlliances.some(alliance => enemiesAlliance.includes(alliance))) {
                        return false;
                    }
                }

                if (enemiesFactions.length) {
                    if (!location.enemiesFactions.some(faction => enemiesFactions.includes(faction))) {
                        return false;
                    }
                }

                return true;
            });

        return orderBy(unlockedLocations, ['energyPerItem', 'expectedGold'], ['asc', 'desc']);
    }
}
