import {
    IBaseUpgrade,
    IBaseUpgradeData,
    ICharacterUpgradeEstimate,
    ICharacterUpgradeMow,
    ICharacterUpgradeRankEstimate,
    ICharacterUpgradeRankGoal,
    ICombinedUpgrade,
    ICraftedUpgrade,
    ICraftedUpgradeData,
    IEstimatedUpgrades,
    IItemRaidLocation,
    IRankLookup,
    IRecipeExpandedUpgrade,
    IRecipeExpandedUpgradeData,
    IUnitUpgrade,
    IUnitUpgradeRank,
    IUpgradeRaid,
    IUpgradeRecipe,
    IUpgradesRaidsDay,
} from 'src/v2/features/goals/goals.models';
import {
    CampaignsProgressionService,
} from 'src/v2/features/goals/campaigns-progression';
import {
    ICampaignBattle,
    ICampaignBattleComposed,
    ICampaignsData,
    ICampaignsProgress,
    IDailyRaidsFilters,
    IEstimatedRanksSettings,
    IMaterial,
    IMaterialRecipeIngredient,
    IRankUpData,
    IRecipeData,
} from 'src/models/interfaces';
import { rarityStringToNumber } from 'src/models/constants';
import { CampaignType, DailyRaidsStrategy, PersonalGoalType, Rank, Rarity, RarityString } from 'src/models/enums';
import { CampaignsService } from 'src/v2/features/goals/campaigns.service';
import { cloneDeep, groupBy, mean, orderBy, sum, uniq, uniqBy } from 'lodash';

import rankUpData from 'src/assets/rankUpData.json';
import recipeData from 'src/v2/data/recipeData.json';
import battleData from 'src/assets/battleData.json';
import { getEnumValues, rankToString } from 'src/shared-logic/functions';
import { MowLookupService } from 'src/v2/features/lookup/mow-lookup.service';
import _ from 'lodash';

export class UpgradesService {
    static readonly recipeData: IRecipeData = recipeData;
    static readonly rankUpData: IRankUpData = rankUpData;
    static readonly battleData: ICampaignsData = battleData;
    static readonly baseUpgradesData: IBaseUpgradeData = this.composeBaseUpgrades();
    static readonly craftedUpgradesData: ICraftedUpgradeData = this.composeCraftedUpgrades();
    static readonly recipeExandedUpgradeData: IRecipeExpandedUpgradeData = this.expandRecipeData();

    static readonly rankEntries: number[] = getEnumValues(Rank).filter(x => x > 0);
    static getUpgradesEstimatedDays(
        settings: IEstimatedRanksSettings,
        ...goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow>
    ): IEstimatedUpgrades {
        const inventoryUpgrades = cloneDeep(settings.upgrades);

        const unitsUpgrades = this.getUpgrades(inventoryUpgrades, goals, settings);

        const combinedBaseMaterials = this.combineBaseMaterials(unitsUpgrades);
        this.populateLocationsData(combinedBaseMaterials, settings);

        let allMaterials: ICharacterUpgradeEstimate[];
        let byCharactersPriority: ICharacterUpgradeRankEstimate[] = [];

        if (settings.preferences.farmByPriorityOrder) {
            byCharactersPriority = this.getEstimatesByPriority(goals, combinedBaseMaterials, inventoryUpgrades);
            allMaterials = byCharactersPriority.flatMap(x => x.upgrades);
        } else {
            allMaterials = this.getTotalEstimates(combinedBaseMaterials, inventoryUpgrades);

            if (settings.preferences.farmStrategy === DailyRaidsStrategy.leastTime) {
                allMaterials = this.improveEstimates(allMaterials, combinedBaseMaterials, inventoryUpgrades);
            }
        }

        const upgradesRaids = this.generateDailyRaidsList(settings, allMaterials);

        const blockedMaterials = allMaterials.filter(x => x.isBlocked);
        const finishedMaterials = allMaterials.filter(x => x.isFinished);
        const inProgressMaterials = allMaterials.filter(x => !x.isBlocked && !x.isFinished);

        const energyTotal = sum(inProgressMaterials.map(material => material.energyTotal));
        const raidsTotal = sum(upgradesRaids.map(day => day.raidsTotal));
        const freeEnergyDays = upgradesRaids.filter(x => settings.dailyEnergy - x.energyTotal > 60).length;

        const relatedUpgrades = uniq(unitsUpgrades.flatMap(ranksUpgrade => ranksUpgrade.relatedUpgrades));

        return {
            upgradesRaids,
            characters: unitsUpgrades,
            inProgressMaterials,
            blockedMaterials,
            finishedMaterials,
            relatedUpgrades,
            byCharactersPriority,
            daysTotal: upgradesRaids.length,
            energyTotal,
            raidsTotal,
            freeEnergyDays,
        };
    }

    private static generateDailyRaidsList(
        settings: IEstimatedRanksSettings,
        allUpgrades: ICharacterUpgradeEstimate[]
    ): IUpgradesRaidsDay[] {
        if (settings.dailyEnergy <= 10) {
            return [];
        }
        const resultDays: IUpgradesRaidsDay[] = [];

        let iteration = 0;
        let upgradesToFarm = allUpgrades.filter(x => !x.isBlocked && !x.isFinished && x.energyLeft > 0);
        const raidedLocations = settings.completedLocations.filter(x => !x.isShardsLocation).map(x => x.id);
        const raidedUpgrades = allUpgrades.filter(x =>
            x.locations.filter(location => location.isSelected).some(location => raidedLocations.includes(location.id))
        );

        while (upgradesToFarm.length > 0) {
            const isFirstDay = iteration === 0;
            const raids: IUpgradeRaid[] = [];
            let energyLeft = settings.dailyEnergy;

            if (isFirstDay && raidedUpgrades.length) {
                for (const raidedUpgrade of uniqBy(raidedUpgrades, 'id')) {
                    const raidLocations = settings.completedLocations.filter(x =>
                        raidedUpgrade.locations.some(location => location.id === x.id)
                    );
                    raids.push({
                        ...raidedUpgrade,
                        raidLocations,
                    });
                }
                energyLeft -= sum(settings.completedLocations.map(x => x.energySpent));
            }

            for (const material of upgradesToFarm) {
                if (energyLeft < 5) {
                    break;
                }

                const plannedLocations = raids
                    .filter(x => x.id === material.id)
                    .flatMap(x => x.raidLocations)
                    .map(x => x.id);
                const selectedLocations = material.locations.filter(
                    location => location.isSelected && !plannedLocations.includes(location.id)
                );

                const raidLocations: IItemRaidLocation[] = [];

                for (const location of selectedLocations) {
                    const locationDailyEnergy = location.energyCost * location.dailyBattleCount;
                    if (isFirstDay && location.isCompleted) {
                        const completedLocation = settings.completedLocations.find(x => x.id === location.id);
                        if (completedLocation) {
                            raidLocations.push(completedLocation);
                            energyLeft -= completedLocation.energySpent;
                        }
                        continue;
                    }

                    if (material.energyLeft > locationDailyEnergy) {
                        if (energyLeft > locationDailyEnergy) {
                            energyLeft -= locationDailyEnergy;
                            material.energyLeft -= locationDailyEnergy;

                            raidLocations.push({
                                ...location,
                                raidsCount: location.dailyBattleCount,
                                farmedItems: locationDailyEnergy / location.energyPerItem,
                                energySpent: locationDailyEnergy,
                                isShardsLocation: false,
                            });
                            continue;
                        }
                    }

                    if (energyLeft > material.energyLeft) {
                        const numberOfBattles = Math.floor(material.energyLeft / location.energyCost);
                        const maxNumberOfBattles =
                            numberOfBattles > location.dailyBattleCount ? location.dailyBattleCount : numberOfBattles;

                        if (numberOfBattles <= 0) {
                            continue;
                        }
                        const energySpent = maxNumberOfBattles * location.energyCost;

                        energyLeft -= energySpent;
                        material.energyLeft -= energySpent;

                        raidLocations.push({
                            ...location,
                            raidsCount: maxNumberOfBattles,
                            farmedItems: energySpent / location.energyPerItem,
                            energySpent: energySpent,
                            isShardsLocation: false,
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
                        material.energyLeft -= energySpent;

                        raidLocations.push({
                            ...location,
                            raidsCount: maxNumberOfBattles,
                            farmedItems: energySpent / location.energyPerItem,
                            energySpent: energySpent,
                            isShardsLocation: false,
                        });
                    }
                }

                if (raidLocations.length) {
                    raids.push({
                        ...material,
                        raidLocations,
                    });
                }
            }

            if (raids.length) {
                const raidsTotal = sum(raids.flatMap(x => x.raidLocations.map(x => x.raidsCount)));
                const energyTotal = sum(raids.flatMap(x => x.raidLocations.map(x => x.energySpent)));
                resultDays.push({
                    raids: isFirstDay
                        ? orderBy(raids, raid => raid.raidLocations.every(location => location.isCompleted))
                        : raids,
                    raidsTotal,
                    energyTotal,
                });
            }

            iteration++;
            upgradesToFarm = upgradesToFarm.filter(
                x => x.energyLeft > Math.min(...x.locations.filter(c => c.isSelected).map(l => l.energyCost))
            );
            if (iteration > 1000) {
                console.error('Infinite loop', resultDays);
                break;
            }
        }

        return resultDays;
    }

    public static baseUpgradeToString(upgrade: IBaseUpgrade): string {
        var ret: string = "id: " + upgrade.id +
            "\nlabel: " + upgrade.label +
            "\nrarity: " + upgrade.rarity +
            "\niconPath: " + upgrade.iconPath +
            "\ncrafted: " + upgrade.crafted +
            "\nstat: " + upgrade.stat;
        for (const location of upgrade.locations) {
            ret += "\nlocation: " + location.id;
        }
        return ret;
    }
    public static craftedUpgradeToString(upgrade: ICraftedUpgrade): string {
        var ret: string = "id: " + upgrade.id +
            "\nlabel: " + upgrade.label +
            "\nrarity: " + upgrade.rarity +
            "\niconPath: " + upgrade.iconPath +
            "\ncrafted: " + upgrade.crafted +
            "\nstat: " + upgrade.stat;
        for (const material of upgrade.recipe) {
            ret += "\n  " + material.count + "x " + material.id;
        }
        return ret;
    }

    // Given a material and quantity, returns how much energy it would
    // take to farm the material if we choose the cheapest strategy
    // guaranteed to pay. Which basically means as far as nodes go,
    // elite > early > mirror > normal.
    private static getCheapestEnergyToFarm(
        material: string, count: number, farmableLocs: string[]
    ): number {
        if (farmableLocs.length === 0) {
            return -1;
        }
        const campaignNodes = CampaignsService.getCampaignComposed();
        const energyCost = new Map<string, int>([["Elite", 10], ["Early", 5], ["Mirror", 6], ["Normal", 6]]);
        const normalDropRates = new Map<Rarity, number>(
            [[Rarity.Common, 3 / 4.0], [Rarity.Uncommon, 4 / 7.0], [Rarity.Rare, 1 / 5.0], [Rarity.Epic, 1 / 7.0], [Rarity.Legendary, 1 / 12.0]]);
        const mirrorDropRates = new Map<Rarity, number>(
            [[Rarity.Common, 3 / 4.0], [Rarity.Uncommon, 4 / 7.0], [Rarity.Rare, 1 / 5.0], [Rarity.Epic, 1 / 7.0], [Rarity.Legendary, 1 / 12.0]]);
        const eliteDropRates = new Map<string, Map<Rarity, number>>(
            [[Rarity.Common, 3 / 2.0], [Rarity.Uncommon, 1.25], [Rarity.Rare, 13 / 12.0], [Rarity.Epic, 2 / 3.0], [Rarity.Legendary, 1 / 3.0]]);
        const hasElite = farmableLocs.reduce((acc, loc) => acc || campaignNodes[loc].campaignType === CampaignType.Elite, false);
        const hasMirror = farmableLocs.reduce((acc, loc) => acc || campaignNodes[loc].campaignType === CampaignType.Mirror, false);
        const hasEarly = farmableLocs.reduce((acc, loc) => acc || (campaignNodes[loc].campaign === 'Indomitus' && campaignNodes.nodeNumber < 30), false);
        if (hasElite) {
            return 10 * Math.ceil(count / eliteDropRates.get(campaignNodes[farmableLocs[0]].rarityEnum));
        } else if (hasEarly) {
            return 5 * Math.ceil(count / normalDropRates.get(campaignNodes[farmableLocs[0]].rarityEnum));
        } else if (hasMirror) {
            return 6 * Math.ceil(count / mirrorDropRates.get(campaignNodes[farmableLocs[0]].rarityEnum));
        } else {
            return 6 * Math.ceil(count / normalDropRates.get(campaignNodes[farmableLocs[0]].rarityEnum));
        }
    }

    // Holds information about the cheapest path to rank up a unit.
    static CheapestRankUpInfo = class {
        public unitId: string;
        public totalEnergy: number;
        public upgrades: Record<string, number>;
        public unbeatenLocs: string[];
        public constructor(unitId: string, totalEnergy: number, upgrades: Record<string, number>, unbeatenLocs: string[]) {
            this.unitId = unitId;
            this.totalEnergy = totalEnergy;
            this.upgrades = upgrades;
            this.unbeatenLocs = unbeatenLocs;
        }
    };

    // Given the specified campaign progression, determines the cheapest
    // cost to rank up a unit.
    public static getCheapestRankUpCostWithCurrentCampaignProgression(
        goal: ICharacterUpgradeRankGoal | ICharacterUpgradeMow,
        baseMaterials: Record<string, number>,
        settings: IEstimatedRanksSettings
    ): CheapestRankUpInfo {
        const upgradeLocs = this.getUpgradesLocations();
        const campaignNodes = CampaignsService.getCampaignComposed();
        var totalEnergy: number = 0;
        var unbeatenLocs: string[] = [];
        for (const [material, count] of Object.entries(baseMaterials)) {
            var line = "  " + count + "x " + material;
            var farmableLocs: string[] = [];
            for (const index in upgradeLocs[material]) {
                var loc: ICampaignBattleComposed = upgradeLocs[material][index];
                if (settings.campaignsProgress[campaignNodes[loc].campaign] >= campaignNodes[loc].nodeNumber) {
                    farmableLocs.push(loc);
                } else {
                    unbeatenLocs.push(loc);
                }
            }
            if (farmableLocs.length > 0) {
                totalEnergy += this.getCheapestEnergyToFarm(material, count, farmableLocs);
            } else {
                totalEnergy = -1;
                break;
            }
        }
        if (goal.rankEnd !== undefined && totalEnergy >= 0) {
            console.log("Ranking up " + goal.unitName + " from " + goal.rankStart + " to " + goal.rankEnd + " costs " + totalEnergy + " energy using existing inventory.");
        } else if (totalEnergy >= 0) {
            console.log("Upgrading " + goal.unitName + " costs " + totalEnergy + " energy using existing inventory.");
        } else {
            console.log("Ranking up " + goal.unitName + " from " + goal.rankStart + " to " + goal.rankEnd +
                " is currently blocked, because there are unfarmable materials.");
        }
        return new this.CheapestRankUpInfo(goal.unitId, totalEnergy, baseMaterials, unbeatenLocs);
    }

    static CheapestRankUpCost = class {
        public unitId: string;
        public rankUpInfo: CheapestRankUpInfo;
        public upgrades: Record<string, number>;
        public constructor(unitId: string, rankUpInfo: CheapestRankUpInfo, upgrades: Record<string, number>) {
            this.unitId = unitId;
            this.rankUpInfo = rankUpInfo;
            this.upgrades = upgrades;
        }
    }

    public static getUpgrades(
        inventoryUpgrades: Record<string, number>,
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow>,
        settings: IEstimatedRanksSettings
    ): IUnitUpgrade[] {
        var craftedUpgrades = this.composeCraftedUpgrades();
        var totalCost = 0;
        var totalCostWithInventory = 0;
        var result: IUnitUpgrade[] = [];
        for (const goal of goals) {
            const upgradeRanks =
                goal.type === PersonalGoalType.UpgradeRank
                    ? this.getCharacterUpgradeRank(goal)
                    : this.getMowUpgradeRank(goal);
            const baseUpgradesTotal: Record<string, number> = this.getBaseUpgradesTotal(upgradeRanks, inventoryUpgrades);

            if (goal.upgradesRarity.length) {
                // remove upgrades that do not match to selected rarities
                for (const upgradeId in baseUpgradesTotal) {
                    const upgradeData = this.baseUpgradesData[upgradeId];
                    if (upgradeData && !goal.upgradesRarity.includes(upgradeData.rarity)) {
                        delete baseUpgradesTotal[upgradeId];
                    }
                }
            }

            const relatedUpgrades: string[] = upgradeRanks.flatMap(x => {
                const result: string[] = [...x.upgrades];
                const upgrades: Array<IBaseUpgrade | ICraftedUpgrade> = x.upgrades.map(upgrade =>
                    this.getUpgrade(upgrade)
                );
                for (const upgrade of upgrades) {
                    if (upgrade.crafted) {
                        result.push(...upgrade.baseUpgrades.map(x => x.id));
                        result.push(...upgrade.craftedUpgrades.map(x => x.id));
                    }
                }

                return result;
            });

            result.push(
                {
                    goalId: goal.goalId,
                    unitId: goal.unitId,
                    label: goal.unitName,
                    upgradeRanks,
                    baseUpgradesTotal,
                    relatedUpgrades,
                });
        }
        return result;
    }

    private static getTotalEstimates(
        upgrades: Record<string, ICombinedUpgrade>,
        inventoryUpgrades: Record<string, number>
    ): ICharacterUpgradeEstimate[] {
        const result: ICharacterUpgradeEstimate[] = [];

        for (const upgradeId in upgrades) {
            const upgrade = upgrades[upgradeId];
            const requiredCount = upgrade.requiredCount;
            const acquiredCount = inventoryUpgrades[upgradeId] ?? 0;

            const estimate = this.getUpgradeEstimate(upgrade, requiredCount, acquiredCount);

            result.push(estimate);
        }

        return orderBy(result, ['daysTotal', 'energyTotal'], ['desc', 'desc']);
    }

    private static improveEstimates(
        estimates: ICharacterUpgradeEstimate[],
        upgrades: Record<string, ICombinedUpgrade>,
        inventoryUpgrades: Record<string, number>
    ): ICharacterUpgradeEstimate[] {
        const average = Math.ceil(mean(estimates.map(x => x.daysTotal)));
        const correctUpgradesLocations = estimates
            .filter(
                x =>
                    x.daysTotal - average > average &&
                    x.locations.some(location => location.isUnlocked && location.isPassFilter && !location.isSelected)
            )
            .map(x => x.id);

        if (!correctUpgradesLocations.length) {
            return estimates;
        }

        for (const upgradeId of correctUpgradesLocations) {
            const upgrade = upgrades[upgradeId];
            const newLocation = upgrade.locations.find(
                location => location.isUnlocked && location.isPassFilter && !location.isSelected
            );
            if (newLocation) {
                newLocation.isSelected = true;
            }
        }

        const newEstimates = this.getTotalEstimates(upgrades, inventoryUpgrades);
        const result = this.improveEstimates(newEstimates, upgrades, inventoryUpgrades);

        return orderBy(result, ['daysTotal', 'energyTotal'], ['desc', 'desc']);
    }

    private static getUpgradeEstimate(
        upgrade: ICombinedUpgrade,
        requiredCount: number,
        acquiredCount: number
    ): ICharacterUpgradeEstimate {
        const { id, label, rarity, iconPath, locations, relatedCharacters, relatedGoals } = upgrade;

        const selectedLocations = locations.filter(x => x.isSelected);

        const leftCount = Math.max(requiredCount - acquiredCount, 0);

        const estimate: ICharacterUpgradeEstimate = {
            id,
            label,
            rarity,
            iconPath,
            locations,
            acquiredCount,
            requiredCount,
            relatedCharacters,
            relatedGoals,
            daysTotal: 0,
            raidsTotal: 0,
            energyTotal: 0,
            energyLeft: 0,
            isBlocked: !selectedLocations.length && leftCount > 0,
            isFinished: leftCount === 0,
            crafted: false,
            stat: upgrade.stat,
        };

        if (estimate.isFinished || estimate.isBlocked) {
            return estimate;
        }

        let energyTotal = 0;
        let raidsTotal = 0;
        let farmedItems = 0;
        let daysTotal = 0;

        while (farmedItems < leftCount) {
            let leftToFarm = leftCount - farmedItems;
            for (const loc of selectedLocations) {
                const dailyEnergy = loc.dailyBattleCount * loc.energyCost;
                const dailyFarmedItems = dailyEnergy / loc.energyPerItem;
                if (leftToFarm >= dailyFarmedItems) {
                    leftToFarm -= dailyFarmedItems;
                    energyTotal += dailyEnergy;
                    farmedItems += dailyFarmedItems;
                    raidsTotal += loc.dailyBattleCount;
                } else {
                    const energyLeftToFarm = leftToFarm * loc.energyPerItem;
                    const battlesLeftToFarm = Math.ceil(energyLeftToFarm / loc.energyCost);
                    farmedItems += leftToFarm;
                    energyTotal += battlesLeftToFarm * loc.energyCost;
                    raidsTotal += battlesLeftToFarm;
                    break;
                }
            }
            daysTotal++;
            if (daysTotal > 1000) {
                console.error('Infinite loop', id, selectedLocations);
                break;
            }
        }

        estimate.daysTotal = daysTotal;
        estimate.raidsTotal = raidsTotal;
        estimate.energyTotal = energyTotal;
        estimate.energyLeft = energyTotal;

        return estimate;
    }

    private static combineBaseMaterials(charactersUpgrades: IUnitUpgrade[]): Record<string, ICombinedUpgrade> {
        const result: Record<string, ICombinedUpgrade> = {};
        for (const character of charactersUpgrades) {
            for (const upgradeId in character.baseUpgradesTotal) {
                const upgradeCount = character.baseUpgradesTotal[upgradeId];

                const combinedUpgrade: ICombinedUpgrade = result[upgradeId] ?? {
                    ...this.baseUpgradesData[upgradeId],
                    requiredCount: 0,
                    countByGoalId: {},
                    relatedCharacters: [],
                    relatedGoals: [],
                };

                combinedUpgrade.requiredCount += upgradeCount;
                combinedUpgrade.countByGoalId[character.goalId] = upgradeCount;
                if (!combinedUpgrade.relatedCharacters.includes(character.unitId)) {
                    combinedUpgrade.relatedCharacters.push(character.unitId);
                }

                if (!combinedUpgrade.relatedGoals.includes(character.goalId)) {
                    combinedUpgrade.relatedGoals.push(character.goalId);
                }

                result[upgradeId] = combinedUpgrade;
            }
        }

        return result;
    }

    private static populateLocationsData(
        upgrades: Record<string, ICombinedUpgrade>,
        settings: IEstimatedRanksSettings
    ): void {
        const completedLocations = settings.completedLocations.map(location => location.id);
        for (const upgradeId in upgrades) {
            const combinedUpgrade = upgrades[upgradeId];

            for (const location of combinedUpgrade.locations) {
                const campaignProgress = settings.campaignsProgress[location.campaign as keyof ICampaignsProgress];
                location.isUnlocked = location.nodeNumber <= campaignProgress;
                location.isPassFilter =
                    !settings.filters ||
                    CampaignsService.passLocationFilter(location, settings.filters, combinedUpgrade.rarity);
                location.isCompleted = completedLocations.some(locationId => location.id === locationId);
                location.isSelected = location.isUnlocked && location.isPassFilter;
            }
            const minEnergy = Math.min(
                ...combinedUpgrade.locations.filter(x => x.isSelected).map(x => x.energyPerItem)
            );

            if (
                [DailyRaidsStrategy.leastEnergy, DailyRaidsStrategy.leastTime].includes(
                    settings.preferences.farmStrategy
                )
            ) {
                for (const location of combinedUpgrade.locations) {
                    location.isSelected = location.isSelected && location.energyPerItem === minEnergy;
                }
            }

            if (
                settings.preferences.farmStrategy === DailyRaidsStrategy.custom &&
                settings.preferences.customSettings
            ) {
                const locationTypes = [...settings.preferences.customSettings[combinedUpgrade.rarity]];
                const selectedLocations = combinedUpgrade.locations.filter(x => x.isSelected);
                let ignoredLocations = selectedLocations.filter(x => !locationTypes.includes(x.campaignType));
                if (ignoredLocations.length !== selectedLocations.length) {
                    for (const ignoredLocation of ignoredLocations) {
                        ignoredLocation.isSelected = false;
                    }
                } else {
                    if (locationTypes.includes(CampaignType.Elite) && !locationTypes.includes(CampaignType.Mirror)) {
                        locationTypes.push(CampaignType.Mirror);
                        ignoredLocations = selectedLocations.filter(x => !locationTypes.includes(x.campaignType));

                        if (ignoredLocations.length !== selectedLocations.length) {
                            for (const ignoredLocation of ignoredLocations) {
                                ignoredLocation.isSelected = false;
                            }
                        }
                    }
                }
            }

            combinedUpgrade.locations = orderBy(
                combinedUpgrade.locations,
                ['isSelected', 'energyPerItem', 'nodeNumber'],
                ['desc', 'asc', 'desc']
            );
        }
    }

    public static updateInventory(
        inventory: Record<string, number>,
        upgrades: Array<IBaseUpgrade | ICraftedUpgrade>
    ): {
        inventoryUpdate: Record<string, number>;
        inventoryUpgrades: Array<IBaseUpgrade | ICraftedUpgrade>;
    } {
        const inventoryUpdate: Record<string, number> = {};

        const processUpgrade = (upgrade: IBaseUpgrade | ICraftedUpgrade, count: number): void => {
            if (!upgrade.crafted) {
                // Base upgrade, simply decrement
                inventoryUpdate[upgrade.id] = (inventoryUpdate[upgrade.id] ?? 0) + count;
            } else {
                // Crafted upgrade
                const availableCount = inventory[upgrade.id] ?? 0;

                if (availableCount >= count) {
                    // Enough crafted upgrades available in inventory
                    inventoryUpdate[upgrade.id] = (inventoryUpdate[upgrade.id] ?? 0) + count;
                    inventory[upgrade.id] -= count; // Decrement inventory
                } else {
                    // Not enough crafted upgrades, need to process recipe
                    inventoryUpdate[upgrade.id] = (inventoryUpdate[upgrade.id] ?? 0) + availableCount;
                    inventory[upgrade.id] = 0; // Deplete inventory

                    const remainingCount = count - availableCount;
                    for (const recipeItem of (upgrade as ICraftedUpgrade).recipe) {
                        const upgradeData = this.getUpgrade(recipeItem.id);

                        if (!upgradeData) {
                            return;
                        }

                        processUpgrade(upgradeData, recipeItem.count * remainingCount);
                    }
                }
            }
        };

        upgrades.forEach(upgrade => {
            processUpgrade(upgrade, 1);
        });

        // Filter out items with 0 count in the inventoryUpdate
        const filteredInventoryUpdate: Record<string, number> = Object.fromEntries(
            Object.entries(inventoryUpdate).filter(([_, count]) => count > 0)
        );

        return {
            inventoryUpdate: filteredInventoryUpdate,
            inventoryUpgrades: Object.keys(filteredInventoryUpdate).map(upgradeId => this.getUpgrade(upgradeId)),
        };
    }

    public static getUpgrade(upgradeId: string): IBaseUpgrade | ICraftedUpgrade {
        return this.baseUpgradesData[upgradeId] ?? this.craftedUpgradesData[upgradeId];
    }

    /**
     * Applies all existing inventory in `inventoryUpgrades`, then returns the total
     * count, per non-craftable material, required to reach the rank-up goal.
     */
    private static getBaseUpgradesTotal(
        upgradeRanks: IUnitUpgradeRank[],
        inventoryUpgrades: Record<string, number>
    ): Record<string, number> {
        const baseUpgradesTotal: Record<string, number> = {};

        const processCraftedUpgrade = (craftedUpgrades: Record<string, number>, depth = 0): void => {
            const nextLevelCraftedUpgrades: Record<string, number> = {};

            for (const craftedUpgrade in craftedUpgrades) {
                const acquiredCount = inventoryUpgrades[craftedUpgrade];
                const requiredCount = craftedUpgrades[craftedUpgrade];

                if (acquiredCount >= requiredCount) {
                    inventoryUpgrades[craftedUpgrade] = acquiredCount - requiredCount;
                    continue;
                }

                if (acquiredCount > 0 && acquiredCount < requiredCount) {
                    inventoryUpgrades[craftedUpgrade] = 0;
                    craftedUpgrades[craftedUpgrade] = requiredCount - acquiredCount;
                }

                const craftedUpgradeData = this.craftedUpgradesData[craftedUpgrade];
                const craftedUpgradeCount = craftedUpgrades[craftedUpgrade];

                if (craftedUpgradeData) {
                    if (!craftedUpgradeData.craftedUpgrades.length) {
                        for (const baseUpgrade of craftedUpgradeData.baseUpgrades) {
                            baseUpgradesTotal[baseUpgrade.id] =
                                (baseUpgradesTotal[baseUpgrade.id] ?? 0) + baseUpgrade.count * craftedUpgradeCount;
                        }
                    } else {
                        for (const recipeUpgrade of craftedUpgradeData.recipe) {
                            const subCraftedUpgrade = craftedUpgradeData.craftedUpgrades.find(
                                x => x.id === recipeUpgrade.id
                            );
                            const baseUpgrade = craftedUpgradeData.baseUpgrades.find(x => x.id === recipeUpgrade.id);
                            if (subCraftedUpgrade) {
                                nextLevelCraftedUpgrades[recipeUpgrade.id] =
                                    (nextLevelCraftedUpgrades[recipeUpgrade.id] ?? 0) +
                                    recipeUpgrade.count * craftedUpgradeCount;
                            } else if (baseUpgrade) {
                                baseUpgradesTotal[recipeUpgrade.id] =
                                    (baseUpgradesTotal[recipeUpgrade.id] ?? 0) +
                                    recipeUpgrade.count * craftedUpgradeCount;
                            }
                        }
                    }
                }
            }

            if (Object.keys(nextLevelCraftedUpgrades).length > 0) {
                processCraftedUpgrade(nextLevelCraftedUpgrades, depth + 1);
            }
        };

        const topLevelCraftedUpgrades: Record<string, number> = {};

        for (const upgradeRank of upgradeRanks) {
            for (const upgrade of upgradeRank.upgrades) {
                const upgradeData = this.getUpgrade(upgrade);

                if (upgradeData.crafted) {
                    topLevelCraftedUpgrades[upgrade] = (topLevelCraftedUpgrades[upgrade] ?? 0) + 1;
                } else {
                    baseUpgradesTotal[upgrade] = (baseUpgradesTotal[upgrade] ?? 0) + 1;
                }
            }
        }

        processCraftedUpgrade(topLevelCraftedUpgrades);

        return baseUpgradesTotal;
    }

    /**
     * @param rankLookup The start and end rank of the goal, as well as any
     *                   materials that have already been applied.
     * @returns The number of each upgrade material necessary to hit the
     *          upgrade rank.
     */
    public static getCharacterUpgradeRank(rankLookup: IRankLookup): IUnitUpgradeRank[] {
        const characterRankUpData = this.rankUpData[rankLookup.unitName] ?? {};

        const ranksRange = this.rankEntries.filter(r => r >= rankLookup.rankStart && r < rankLookup.rankEnd);
        const upgradeRanks: IUnitUpgradeRank[] = [];

        for (const rank of ranksRange) {
            const upgrades = characterRankUpData[rankToString(rank)] ?? [];
            upgradeRanks.push({
                rankStart: rank,
                rankEnd: rank + 1,
                rankPoint5: false,
                upgrades: upgrades,
            });
        }

        if (rankLookup.rankPoint5) {
            const lastRankUpgrades = characterRankUpData[rankToString(rankLookup.rankEnd)] ?? [];
            // select every even upgrade (top row in game)
            const rankPoint5Upgrades = lastRankUpgrades.filter((_, index) => (index + 1) % 2 !== 0);

            upgradeRanks.push({
                rankStart: rankLookup.rankEnd,
                rankEnd: rankLookup.rankEnd,
                rankPoint5: true,
                upgrades: rankPoint5Upgrades,
            });
        }

        if (rankLookup.appliedUpgrades.length && upgradeRanks.length) {
            const currentRank = upgradeRanks[0];
            currentRank.upgrades = currentRank.upgrades.filter(
                upgrade => upgrade && !rankLookup.appliedUpgrades.includes(upgrade)
            );
        }
        return upgradeRanks;
    }

    /**
     * @param rankLookup The start and end ability level of the goal, as well as any
     *                   materials that have already been applied.
     * @returns The number of each upgrade material necessary to level up the
     *          abilities.
     */
    public static getMowUpgradeRank(rankLookup: ICharacterUpgradeMow): IUnitUpgradeRank[] {
        const primaryUpgrades = MowLookupService.getUpgradesRaw(
            rankLookup.unitId,
            rankLookup.primaryStart,
            rankLookup.primaryEnd,
            'primary'
        );
        const secondaryUpgrades = MowLookupService.getUpgradesRaw(
            rankLookup.unitId,
            rankLookup.secondaryStart,
            rankLookup.secondaryEnd,
            'secondary'
        );

        return [
            {
                rankStart: Rank.Diamond3,
                rankEnd: Rank.Diamond3,
                upgrades: [...primaryUpgrades, ...secondaryUpgrades],
                rankPoint5: false,
            },
        ];
    }

    /**
     * Returns an IBaseUpgradeData that holds non-craftable materials only. The
     * locations are sorted in the order elite < early indom < mirror < normal.
     */
    private static composeBaseUpgrades(): IBaseUpgradeData {
        const result: IBaseUpgradeData = {};
        const upgrades = Object.keys(this.recipeData);
        const upgradeLocationsShort = this.getUpgradesLocations();

        for (const upgradeName of upgrades) {
            const upgrade = this.recipeData[upgradeName];

            // Filter out craftable upgrades, we only return base upgrades from here.
            if (upgrade.craftable) {
                continue;
            }

            // Get all the locations where this particular upgrade can be farmed.
            const locations = upgradeLocationsShort[upgrade.material] ?? [];
            const locationsComposed = orderBy(
                locations.map(location => CampaignsService.campaignsComposed[location]),
                ['dropRate', 'nodeNumber'],
                ['desc', 'desc']
            );

            result[upgradeName] = {
                id: upgrade.material,
                label: upgrade.label ?? upgrade.material,
                rarity: rarityStringToNumber[upgrade.rarity as RarityString],
                locations: locationsComposed,
                iconPath: upgrade.icon!,
                crafted: false,
                stat: upgrade.stat,
            };
        }

        return result;
    }

    /** 
     * Returns an ICraftedUpgradeData that holds craftable materials only. The
     * recipe contained is not expanded. For example, Infernal Armor Trim
     * requires Daemonic Armor Trim, which requires Blasephemous Armor trim.
     * Infernal Armor Trim's recipe only mentions the 2x Daemonic Armor Trim,
     * not the 18x Blasphemous Armor Trim.
     */
    private static composeCraftedUpgrades(): ICraftedUpgradeData {
        const result: ICraftedUpgradeData = {};
        const upgrades = Object.keys(this.recipeData);

        for (const upgradeName of upgrades) {
            const upgrade = this.recipeData[upgradeName];

            if (!upgrade.craftable) {
                continue;
            }

            const id = upgrade.material;

            const recipeDetails = upgrade.recipe?.map(item => this.getRecipe(item)) ?? [];

            result[upgradeName] = {
                id,
                label: upgrade.label ?? id,
                rarity: rarityStringToNumber[upgrade.rarity as RarityString],
                iconPath: upgrade.icon!,
                baseUpgrades: recipeDetails.flatMap(x => x.baseUpgrades),
                craftedUpgrades: recipeDetails.flatMap(x => x.craftedUpgrades),
                recipe:
                    upgrade.recipe?.map(x => ({
                        id: x.material,
                        count: x.count,
                    })) ?? [],
                crafted: true,
                stat: upgrade.stat,
            };
        }

        return result;
    }

    /**
     * Returns the expanded recipes for all materials, keyed by
     * material ID. If a material is uncraftable, it is included,
     * and expandedRecipe is empty.
     */
    private static expandRecipeData(): IRecipeExpandedUpgradeData {
        const result: IRecipeExpandedUpgradeData = {};

        result["Gold"] = {
            id: "Gold",
            label: "Gold",
            rarity: Rarity.Common,
            iconPath: "gold",
            expandedRecipe: {},
            crafted: false,
            stat: "Gold",
        };
        // First fill in all of the base upgrades.
        for (const key in this.baseUpgradesData) {
            const baseUpgrade = this.baseUpgradesData[key];
            result[baseUpgrade.id] = {
                id: baseUpgrade.id,
                label: baseUpgrade.label,
                rarity: baseUpgrade.rarity,
                iconPath: baseUpgrade.iconPath,
                expandedRecipe: {},
                crafted: false,
                stat: baseUpgrade.stat,
            }
        }
        // Now fill in all of the craftable upgrades that only have base upgrade materials.
        for (const key in this.craftedUpgradesData) {
            const craftedUpgrade = this.craftedUpgradesData[key];
            if (craftedUpgrade.craftedUpgrades.length > 0) {
                // We have to use more expansion, which we handle further below.
                continue;
            }
            var expandedRecipe: Record<string, number> = {};
            craftedUpgrade.recipe.forEach(recipeItem => { expandedRecipe[recipeItem.id] = recipeItem.count; });
            result[craftedUpgrade.id] = {
                id: craftedUpgrade.id,
                label: craftedUpgrade.label,
                rarity: craftedUpgrade.rarity,
                iconPath: craftedUpgrade.iconPath,
                expandedRecipe: expandedRecipe,
                crafted: true,
                stat: craftedUpgrade.stat,
            };
        }

        // Finally, perform a BFS to fill in all expansions that
        // have more than one additional layer.
        //
        // As of 2025-01-01, it takes three passes to fully expand all recipe data.
        var passes: number = 0;
        for (var moreToExpand: boolean = true; moreToExpand;) {
            ++passes;
            moreToExpand = false;
            for (const key in this.craftedUpgradesData) {
                if (result.hasOwnProperty(key)) continue;
                const expandedRecipe: IRecipeExpandedUpgrade | null = this.expandRecipe(key, result);
                if (!expandedRecipe) {
                    moreToExpand = true;
                    continue;
                }
                result[key] = expandedRecipe;
                moreToExpand = true;
            }
        }
        return result;
    }

    /**
     * Adds the specified number of instances of the material to the recipe, initializing
     * the entry if necessary.
     * @param expandedRecipe The recipe to which we should add the item.
     * @param recipeItem The material and count to add.
     */
    private static addIngredientsToExpandedRecipe(
        expandedRecipe: IRecipeExpandedUpgrade, recipeItem: IMaterialRecipeIngredient): void {
        if (expandedRecipe.expandedRecipe.hasOwnProperty(recipeItem.id)) {
            expandedRecipe.expandedRecipe[recipeItem.id] += recipeItem.count;
        } else {
            expandedRecipe.expandedRecipe[recipeItem.id] = recipeItem.count;
        }
    }

    /**
     * Tries to expand the recipe for the given upgrade material
     * using the results in expandedRecipeData.
     * @param key The ID of the upgrade material to expand. 
     * @param expandedRecipeData The existing materials we have already expanded.
     * @returns the expanded data, or null if the recipe cannot be expanded
     *          because one or more ingredients have yet to be expanded.
     */
    private static expandRecipe(key: string, expandedRecipeData: IRecipeExpandedUpgradeData): IRecipeExpandedUpgrade | null {
        const upgrade = this.craftedUpgradesData[key];
        if (!upgrade) {
            console.log("null upgrade: '" + key + "'");
            return null;
        }
        var canExpand: boolean = true;
        var expandedRecipe: IRecipeExpandedUpgrade = {
            id: upgrade.id,
            label: upgrade.label,
            rarity: upgrade.rarity,
            iconPath: upgrade.iconPath,
            expandedRecipe: {},
            crafted: true,
            stat: upgrade.stat,
        };
        var moreToExpand = false;
        for (const recipeItem of upgrade.recipe) {
            if (!expandedRecipeData.hasOwnProperty(recipeItem.id)) {
                // We haven't expanded an ingredient yet, so we can't expand this recipe.
                moreToExpand = true;
                break;
            }
            if (!expandedRecipeData[recipeItem.id].crafted) {
                // Simple ingredient, just add it.
                this.addIngredientsToExpandedRecipe(expandedRecipe, { id: recipeItem.id, count: recipeItem.count });
            } else {
                for (const [material, count] of Object.entries(expandedRecipeData[recipeItem.id].expandedRecipe)) {
                    this.addIngredientsToExpandedRecipe(expandedRecipe,
                        { id: material, count: recipeItem.count * count });
                }
            }
        }
        if (moreToExpand) return null;
        return expandedRecipe;
    }

    public static getUpgradeMaterial(material: string): IMaterial | undefined {
        return recipeData[material];
    }

    private static getRecipe({ material: id, count: upgradeCount }: IMaterialRecipeIngredient): {
        baseUpgrades: IUpgradeRecipe[];
        craftedUpgrades: IUpgradeRecipe[];
    } {
        const baseUpgrades: IUpgradeRecipe[] = [];
        const craftedUpgrades: IUpgradeRecipe[] = [];

        const upgradeDetails = this.recipeData[id];

        if (!upgradeDetails) {
            return {
                baseUpgrades: [],
                craftedUpgrades: [],
            };
        }

        if (!upgradeDetails.craftable) {
            baseUpgrades.push({
                id: id,
                count: upgradeCount,
            });
        }

        if (upgradeDetails.craftable) {
            craftedUpgrades.push({
                id: id,
                count: upgradeCount,
            });

            if (upgradeDetails.recipe) {
                const recipeDetails = upgradeDetails.recipe.map(upgrade =>
                    this.getRecipe({ material: upgrade.material, count: upgrade.count * upgradeCount })
                );

                for (const recipeDetail of recipeDetails) {
                    baseUpgrades.push(...recipeDetail.baseUpgrades);
                    craftedUpgrades.push(...recipeDetail.craftedUpgrades);
                }
            }
        }

        return {
            baseUpgrades,
            craftedUpgrades,
        };
    }

    // For each upgrade, returns a list of all nodes from which it can be farmed.
    //
    // The map key is the material name (e.g. "Classified Data-Slate") or, for character
    // shards, the character name (e.g. "Aleph-Null"), the map value is
    // ICampaignBattle.shortName (e.g. SHME31 for Saim-Hann Mirror Elite 31).
    static getUpgradesLocations(): Record<string, string[]> {
        const result: Record<string, string[]> = {};
        const battles: ICampaignBattle[] = [];
        for (const battleDataKey in this.battleData) {
            battles.push({ ...this.battleData[battleDataKey], shortName: battleDataKey });
        }

        const groupedData = groupBy(battles, 'reward');

        for (const key in groupedData) {
            result[key] = groupedData[key].map(x => x.shortName ?? '');
        }

        return result;
    }

    private static getEstimatesByPriority(
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow>,
        upgrades: Record<string, ICombinedUpgrade>,
        inventoryUpgrades: Record<string, number>
    ): ICharacterUpgradeRankEstimate[] {
        const result: ICharacterUpgradeRankEstimate[] = [];
        for (const goal of goals) {
            const goalUpgrades: ICharacterUpgradeEstimate[] = [];
            for (const upgradeId in upgrades) {
                const upgrade = upgrades[upgradeId];
                const requiredCount = upgrade.countByGoalId[goal.goalId];
                if (!requiredCount) continue;
                const acquiredCount = inventoryUpgrades[upgradeId] ?? 0;
                inventoryUpgrades[upgradeId] = Math.max(acquiredCount - requiredCount, 0);
                const estimate = this.getUpgradeEstimate(upgrade, requiredCount, acquiredCount);

                estimate.relatedCharacters = [goal.unitName];
                estimate.relatedGoals = [goal.goalId];
                goalUpgrades.push(estimate);
            }

            result.push({
                goalId: goal.goalId,
                upgrades: orderBy(goalUpgrades, ['daysTotal', 'energyTotal'], ['desc', 'desc']),
            });
        }
        return result;
    }
}
