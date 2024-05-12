import {
    IBaseUpgradeData,
    ICharacterShardsEstimate,
    ICharacterUpgrade,
    ICharacterUpgradeEstimate,
    ICharacterUpgradeRank,
    ICharacterUpgradeRankEstimate,
    ICharacterUpgradeRankGoal,
    ICombinedUpgrade,
    ICraftedUpgradeData,
    IEstimatedUpgrades,
    ILocationRaid,
    IShardsRaid,
    IUpgradeRecipe,
} from 'src/v2/features/goals/goals.models';
import {
    ICampaignBattle,
    ICampaignBattleComposed,
    ICampaignsData,
    ICampaignsProgress,
    IDailyRaidsFilters,
    IDailyRaidsPreferences,
    IEstimatedRanksSettings,
    IMaterialRecipeIngredient,
    IRankUpData,
    IRecipeData,
} from 'src/models/interfaces';
import { rarityStringToNumber } from 'src/models/constants';
import { Rank, Rarity, RarityString } from 'src/models/enums';
import { CampaignsService } from 'src/v2/features/goals/campaigns.service';
import { cloneDeep, groupBy, orderBy } from 'lodash';

import rankUpData from 'src/assets/rankUpData.json';
import recipeData from 'src/v2/data/recipeData.json';
import battleData from 'src/assets/battleData.json';
import { getEnumValues, rankToString } from 'src/shared-logic/functions';

export class UpgradesService {
    static readonly recipeData: IRecipeData = recipeData;
    static readonly rankUpData: IRankUpData = rankUpData;
    static readonly battleData: ICampaignsData = battleData;
    static readonly baseUpgradesData: IBaseUpgradeData = this.composeBaseUpgrades();
    static readonly craftedUpgradesData: ICraftedUpgradeData = this.composeCraftedUpgrades();

    static readonly rankEntries: number[] = getEnumValues(Rank).filter(x => x > 0);
    static getUpgradesEstimatedDays(
        settings: IEstimatedRanksSettings,
        ...goals: Array<ICharacterUpgradeRankGoal>
    ): IEstimatedUpgrades {
        const inventoryUpgrades = cloneDeep(settings.upgrades);

        const characters = this.convertGoalsToMaterials(inventoryUpgrades, goals);

        const combinedBaseMaterials = this.combineBaseMaterials(characters);
        this.populateLocationsData(combinedBaseMaterials, settings);

        const materials = this.getTotalEstimates(combinedBaseMaterials, inventoryUpgrades);
        const byCharactersPriority = this.getEstimatesByPriority(goals, combinedBaseMaterials, inventoryUpgrades);

        // const shardsRaids = this.getTodayRaids(materials, settings.completedLocations);

        // const energyTotal = sum(materials.map(material => material.energyTotal));
        // const energyPerDay = sum(materials.map(material => material.energyPerDay));
        // const onslaughtTokens = sum(materials.map(material => material.onslaughtTokensTotal));
        // const raidsTotal = sum(materials.map(material => material.raidsTotal));
        // const daysTotal = Math.max(...materials.map(material => material.daysTotal), Math.ceil(onslaughtTokens / 1.5));

        return {
            // shardsRaids,
            characters,
            materials,
            byCharactersPriority,
            daysTotal: 0,
            energyTotal: 0,
            raidsTotal: 0,
        };
    }

    public static convertGoalsToMaterials(
        inventoryUpgrades: Record<string, number>,
        goals: Array<ICharacterUpgradeRankGoal>
    ): ICharacterUpgrade[] {
        return goals.map(goal => {
            const upgradeRanks = this.getUpgradeRank(goal);
            const baseUpgradesTotal = this.getBaseUpgradesTotal(upgradeRanks, inventoryUpgrades);
            // TODO implement upgrades rarity filter
            // goal.upgradesRarity
            return {
                goalId: goal.goalId,
                characterId: goal.characterName,
                label: goal.characterName,
                upgradeRanks,
                baseUpgradesTotal,
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

    private static getUpgradeEstimate(
        upgrade: ICombinedUpgrade,
        requiredCount: number,
        acquiredCount: number
    ): ICharacterUpgradeEstimate {
        const { id, label, rarity, iconPath, locations, relatedCharacters } = upgrade;

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
            daysTotal: 0,
            raidsTotal: 0,
            energyTotal: 0,
            isBlocked: !selectedLocations.length,
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

        return estimate;
    }

    private static combineBaseMaterials(charactersUpgrades: ICharacterUpgrade[]): Record<string, ICombinedUpgrade> {
        const result: Record<string, ICombinedUpgrade> = {};
        for (const character of charactersUpgrades) {
            for (const upgradeId in character.baseUpgradesTotal) {
                const upgradeCount = character.baseUpgradesTotal[upgradeId];

                const combinedUpgrade: ICombinedUpgrade = result[upgradeId] ?? {
                    ...this.baseUpgradesData[upgradeId],
                    requiredCount: 0,
                    countByGoalId: {},
                    relatedCharacters: [],
                };

                combinedUpgrade.requiredCount += upgradeCount;
                combinedUpgrade.countByGoalId[character.goalId] = upgradeCount;
                if (!combinedUpgrade.relatedCharacters.includes(character.characterId)) {
                    combinedUpgrade.relatedCharacters.push(character.characterId);
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
        for (const upgradeId in upgrades) {
            const combinedUpgrade = upgrades[upgradeId];

            for (const location of combinedUpgrade.locations) {
                const campaignProgress = settings.campaignsProgress[location.campaign as keyof ICampaignsProgress];
                location.isUnlocked = location.nodeNumber <= campaignProgress;
                location.isPassFilter =
                    !settings.filters || this.passLocationFilter(location, settings.filters, combinedUpgrade.rarity);
            }

            const unlockedLocations = combinedUpgrade.locations.filter(x => x.isUnlocked);
            const minEnergy = Math.min(...unlockedLocations.map(x => x.energyPerItem));
            const maxEnergy = Math.max(...unlockedLocations.map(x => x.energyPerItem));
            const hasAnyMedianLocation = unlockedLocations.some(
                location => location.energyPerItem > minEnergy && location.energyPerItem < maxEnergy
            );

            for (const location of combinedUpgrade.locations) {
                location.isSelected =
                    location.isUnlocked &&
                    location.isPassFilter &&
                    this.passSelectionFilter(location, settings.preferences, {
                        minEnergy,
                        maxEnergy,
                        hasAnyMedianLocation,
                    });
            }

            combinedUpgrade.locations = orderBy(
                combinedUpgrade.locations,
                ['isSelected', 'energyPerItem', 'expectedGold'],
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

    private static passSelectionFilter(
        location: ICampaignBattleComposed,
        preferences: IDailyRaidsPreferences,
        inputs: { minEnergy: number; maxEnergy: number; hasAnyMedianLocation: boolean }
    ): boolean {
        const { minEnergy, maxEnergy, hasAnyMedianLocation } = inputs;
        const { useLeastEfficientNodes, useMoreEfficientNodes, useMostEfficientNodes } = preferences;

        if (!useMostEfficientNodes && !useMoreEfficientNodes && !useLeastEfficientNodes) {
            return true;
        }

        if (useMostEfficientNodes && location.energyPerItem === minEnergy) {
            return true;
        }

        if (
            useMoreEfficientNodes &&
            ((hasAnyMedianLocation && location.energyPerItem > minEnergy && location.energyPerItem < maxEnergy) ||
                (!hasAnyMedianLocation && location.energyPerItem >= minEnergy && location.energyPerItem < maxEnergy))
        ) {
            return true;
        }

        return useLeastEfficientNodes && location.energyPerItem === maxEnergy;
    }

    private static getBaseUpgradesTotal(
        upgradeRanks: ICharacterUpgradeRank[],
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

    private static getUpgradeRank(goal: ICharacterUpgradeRankGoal): ICharacterUpgradeRank[] {
        const characterRankUpData = this.rankUpData[goal.characterName];

        const ranksRange = this.rankEntries.filter(r => r >= goal.rankStart && r < goal.rankEnd);
        const upgradeRanks: ICharacterUpgradeRank[] = [];

        for (const rank of ranksRange) {
            const upgrades = characterRankUpData[rankToString(rank)] ?? [];
            upgradeRanks.push({
                rankStart: rank,
                rankEnd: rank + 1,
                rankPoint5: false,
                upgrades: upgrades,
            });
        }

        if (goal.rankPoint5) {
            const lastRankUpgrades = characterRankUpData[rankToString(goal.rankEnd)] ?? [];
            // select every even upgrade (top row in game)
            const rankPoint5Upgrades = lastRankUpgrades.filter((_, index) => (index + 1) % 2 !== 0);

            upgradeRanks.push({
                rankStart: goal.rankEnd,
                rankEnd: goal.rankEnd,
                rankPoint5: true,
                upgrades: rankPoint5Upgrades,
            });
        }

        if (goal.appliedUpgrades.length) {
            const currentRank = upgradeRanks[0];
            currentRank.upgrades = currentRank.upgrades.filter(
                upgrade => upgrade && !goal.appliedUpgrades.includes(upgrade)
            );
        }
        return upgradeRanks;
    }

    private static getTodayRaids(materials: ICharacterShardsEstimate[], completedLocations: string[]): IShardsRaid[] {
        const result: IShardsRaid[] = [];

        for (const material of materials) {
            const locations: ILocationRaid[] = material.raidsLocations.map(location => ({
                id: location.id,
                campaign: location.campaign,
                battleNumber: location.nodeNumber,
                raidsCount: Math.ceil(location.dailyBattleCount),
                farmedItems: location.itemsPerDay,
                energySpent: location.energyPerDay,
                isCompleted: completedLocations.some(locationId => locationId === location.id),
            }));

            const materialRaid: IShardsRaid = {
                ...material,
                locations: orderBy(locations, ['isCompleted'], ['asc']),
                isCompleted: locations.every(location => location.isCompleted),
            };

            result.push(materialRaid);
        }

        return orderBy(result, ['isCompleted'], ['asc']);
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
            const locationsComposed = locations.map(location => CampaignsService.campaignsComposed[location]);

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

    private static getRecipe({ material: id, count }: IMaterialRecipeIngredient): {
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
                count: count,
            });
        }

        if (upgradeDetails.craftable) {
            craftedUpgrades.push({
                id: id,
                count: count,
            });

            if (upgradeDetails.recipe) {
                const recipeDetails = upgradeDetails.recipe.map(upgrade => this.getRecipe(upgrade));

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
        goals: ICharacterUpgradeRankGoal[],
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

                goalUpgrades.push(estimate);
            }

            result.push({
                ...goal,
                upgrades: orderBy(goalUpgrades, ['daysTotal', 'energyTotal'], ['desc', 'desc']),
            });
        }
        return result;
    }
}
