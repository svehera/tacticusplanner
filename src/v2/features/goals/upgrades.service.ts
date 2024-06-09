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
    IUnitUpgrade,
    IUnitUpgradeRank,
    IUpgradeRaid,
    IUpgradeRecipe,
    IUpgradesRaidsDay,
} from 'src/v2/features/goals/goals.models';
import {
    ICampaignBattle,
    ICampaignBattleComposed,
    ICampaignsData,
    ICampaignsProgress,
    IDailyRaidsFilters,
    IEstimatedRanksSettings,
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

export class UpgradesService {
    static readonly recipeData: IRecipeData = recipeData;
    static readonly rankUpData: IRankUpData = rankUpData;
    static readonly battleData: ICampaignsData = battleData;
    static readonly baseUpgradesData: IBaseUpgradeData = this.composeBaseUpgrades();
    static readonly craftedUpgradesData: ICraftedUpgradeData = this.composeCraftedUpgrades();

    static readonly rankEntries: number[] = getEnumValues(Rank).filter(x => x > 0);
    static getUpgradesEstimatedDays(
        settings: IEstimatedRanksSettings,
        ...goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow>
    ): IEstimatedUpgrades {
        const inventoryUpgrades = cloneDeep(settings.upgrades);

        const characters = this.getUpgrades(inventoryUpgrades, goals);

        const combinedBaseMaterials = this.combineBaseMaterials(characters);
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

        const relatedUpgrades = uniq(characters.flatMap(ranksUpgrade => ranksUpgrade.relatedUpgrades));

        return {
            upgradesRaids,
            characters,
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

    public static getUpgrades(
        inventoryUpgrades: Record<string, number>,
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow>
    ): IUnitUpgrade[] {
        return goals.map(goal => {
            const upgradeRanks =
                goal.type === PersonalGoalType.UpgradeRank
                    ? this.getCharacterUpgradeRank(goal)
                    : this.getMowUpgradeRank(goal);
            const baseUpgradesTotal = this.getBaseUpgradesTotal(upgradeRanks, inventoryUpgrades);

            if (goal.upgradesRarity.length) {
                // remove upgrades that do not match to selected rarities
                for (const upgradeId in baseUpgradesTotal) {
                    const upgradeData = this.baseUpgradesData[upgradeId];
                    if (upgradeData && !goal.upgradesRarity.includes(upgradeData.rarity)) {
                        delete baseUpgradesTotal[upgradeId];
                    }
                }
            }

            const relatedUpgrades: string[] = upgradeRanks.flatMap(x => x.upgrades);
            relatedUpgrades.push(...Object.keys(baseUpgradesTotal));

            return {
                goalId: goal.goalId,
                unitId: goal.unitId,
                label: goal.unitName,
                upgradeRanks,
                baseUpgradesTotal,
                relatedUpgrades,
            };
        });
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
                    !settings.filters || this.passLocationFilter(location, settings.filters, combinedUpgrade.rarity);
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

    private static passLocationFilter(
        location: ICampaignBattleComposed,
        filters: IDailyRaidsFilters,
        materialRarity: Rarity
    ): boolean {
        const {
            alliesFactions,
            alliesAlliance,
            enemiesAlliance,
            enemiesFactions,
            campaignTypes,
            upgradesRarity,
            slotsCount,
        } = filters;

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
    }

    public static getUpgrade(upgradeId: string): IBaseUpgrade | ICraftedUpgrade {
        return this.baseUpgradesData[upgradeId] ?? this.craftedUpgradesData[upgradeId];
    }

    private static getBaseUpgradesTotal(
        upgradeRanks: IUnitUpgradeRank[],
        inventoryUpgrades: Record<string, number>
    ): Record<string, number> {
        const baseUpgradesTotal: Record<string, number> = {};
        const craftedUpgradesRankLevel: Record<string, number> = {};

        for (const upgradeRank of upgradeRanks) {
            for (const upgrade of upgradeRank.upgrades) {
                const baseUpgradeData = this.baseUpgradesData[upgrade];
                if (baseUpgradeData) {
                    baseUpgradesTotal[upgrade] = (baseUpgradesTotal[upgrade] ?? 0) + 1;
                    continue;
                }

                const craftedUpgradeData = this.craftedUpgradesData[upgrade];

                if (craftedUpgradeData) {
                    craftedUpgradesRankLevel[upgrade] = (craftedUpgradesRankLevel[upgrade] ?? 0) + 1;
                }
            }
        }

        for (const craftedUpgrade in craftedUpgradesRankLevel) {
            const acquiredCount = inventoryUpgrades[craftedUpgrade];
            const requiredCount = craftedUpgradesRankLevel[craftedUpgrade];
            if (acquiredCount >= requiredCount) {
                inventoryUpgrades[craftedUpgrade] = acquiredCount - requiredCount;
                delete craftedUpgradesRankLevel[craftedUpgrade];
                continue;
            }

            if (acquiredCount > 0 && acquiredCount < requiredCount) {
                inventoryUpgrades[craftedUpgrade] = 0;
                craftedUpgradesRankLevel[craftedUpgrade] = requiredCount - acquiredCount;
            }

            const craftedUpgradeData = this.craftedUpgradesData[craftedUpgrade];
            const craftedUpgradeCount = craftedUpgradesRankLevel[craftedUpgrade];

            if (craftedUpgradeData) {
                for (const baseUpgrade of craftedUpgradeData.baseUpgrades) {
                    baseUpgradesTotal[baseUpgrade.id] =
                        (baseUpgradesTotal[baseUpgrade.id] ?? 0) + baseUpgrade.count * craftedUpgradeCount;
                }
            }
        }
        return baseUpgradesTotal;
    }

    private static getCharacterUpgradeRank(rankLookup: IRankLookup): IUnitUpgradeRank[] {
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

    private static getMowUpgradeRank(rankLookup: ICharacterUpgradeMow): IUnitUpgradeRank[] {
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

    private static composeBaseUpgrades(): IBaseUpgradeData {
        const result: IBaseUpgradeData = {};
        const upgrades = Object.keys(this.recipeData);
        const upgradeLocationsShort = this.getUpgradesLocations();

        for (const upgradeName of upgrades) {
            const upgrade = this.recipeData[upgradeName];

            if (upgrade.craftable) {
                continue;
            }

            const locations = upgradeLocationsShort[upgrade.material] ?? [];
            const locationsComposed = orderBy(
                locations.map(location => CampaignsService.campaignsComposed[location]),
                ['dropRate', 'nodeNumber'],
                ['desc', 'desc']
            );

            console.log(locationsComposed);

            result[upgradeName] = {
                id: upgrade.material,
                label: upgrade.label ?? upgrade.material,
                rarity: rarityStringToNumber[upgrade.rarity as RarityString],
                locations: locationsComposed,
                iconPath: upgrade.icon!,
            };
        }

        return result;
    }

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
            };
        }

        return result;
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
                if (!requiredCount) {
                    continue;
                }
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
