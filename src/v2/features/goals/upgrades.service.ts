import { cloneDeep, mean, orderBy, sum, uniq, uniqBy } from 'lodash';

import { DailyRaidsStrategy, PersonalGoalType } from 'src/models/enums';
import { IEstimatedRanksSettings } from 'src/models/interfaces';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { TacticusUpgrade } from '@/fsd/5-shared/lib/tacticus-api/tacticus-api.models';
import { Rank } from '@/fsd/5-shared/model';

import { ICampaignsProgress, CampaignsService, CampaignType } from '@/fsd/4-entities/campaign';
import { campaignEventsLocations, campaignsByGroup } from '@/fsd/4-entities/campaign/campaigns.constants';
import { CharacterUpgradesService, IUnitUpgradeRank } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';
import {
    IBaseUpgrade,
    ICraftedUpgrade,
    IMaterial,
    UpgradesService as FsdUpgradesService,
} from '@/fsd/4-entities/upgrade';
import { recipeDataByName } from '@/fsd/4-entities/upgrade/data';

import {
    ICharacterUpgradeEstimate,
    ICharacterUpgradeMow,
    ICharacterUpgradeRankEstimate,
    ICharacterUpgradeRankGoal,
    ICombinedUpgrade,
    IEstimatedUpgrades,
    IItemRaidLocation,
    IUnitUpgrade,
    IUpgradeRaid,
    IUpgradesRaidsDay,
} from 'src/v2/features/goals/goals.models';

export class UpgradesService {
    static readonly recipeDataByTacticusId: Record<string, IMaterial> = this.composeByTacticusId();

    static readonly rankEntries: number[] = getEnumValues(Rank).filter(x => x > 0);

    public static canonicalizeInventoryUpgrades(inventoryUpgrades: Record<string, number>): Record<string, number> {
        return Object.fromEntries(
            Object.entries(inventoryUpgrades).map(([key, value]) => {
                return [
                    recipeDataByName[key]
                        ? key
                        : (Object.values(recipeDataByName).find(x => x.material === key)?.snowprintId ?? key),
                    value,
                ];
            })
        );
    }

    static getUpgradesEstimatedDays(
        settings: IEstimatedRanksSettings,
        ...goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow>
    ): IEstimatedUpgrades {
        const inventoryUpgrades = this.canonicalizeInventoryUpgrades(cloneDeep(settings.upgrades));

        const unitsUpgrades = this.getUpgrades(inventoryUpgrades, goals);

        const combinedBaseMaterials = this.combineBaseMaterials(unitsUpgrades);
        this.populateLocationsData(combinedBaseMaterials, settings);

        let allMaterials: ICharacterUpgradeEstimate[];
        let byCharactersPriority: ICharacterUpgradeRankEstimate[] = [];

        if (settings.preferences.farmByPriorityOrder) {
            byCharactersPriority = this.getEstimatesByPriority(goals, combinedBaseMaterials, inventoryUpgrades);
            allMaterials = byCharactersPriority.flatMap(x => x.upgrades);
            console.log('All materials', allMaterials);
        } else {
            allMaterials = this.getTotalEstimates(combinedBaseMaterials, inventoryUpgrades);
            console.log('All materials', allMaterials);

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
            x.locations.filter(location => location.isSuggested).some(location => raidedLocations.includes(location.id))
        );
        while (upgradesToFarm.length > 0) {
            const isFirstDay = iteration === 0;
            const raids: IUpgradeRaid[] = [];
            let energyLeft = settings.dailyEnergy;

            if (isFirstDay && raidedUpgrades.length) {
                for (const raidedUpgrade of uniqBy(raidedUpgrades, 'id')) {
                    const raidLocations = settings.completedLocations.filter(
                        x =>
                            x.dailyBattleCount === x.raidsCount &&
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
                    location => location.isSuggested && !plannedLocations.includes(location.id)
                );

                const raidLocations: IItemRaidLocation[] = [];

                for (const location of selectedLocations) {
                    const completedLocation = settings.completedLocations.find(x => x.id === location.id);
                    if (isFirstDay && location.isCompleted) {
                        if (completedLocation) {
                            raidLocations.push(completedLocation);
                        }
                        continue;
                    }

                    const attemptsLeft = isFirstDay
                        ? location.dailyBattleCount - (completedLocation?.raidsCount ?? 0)
                        : location.dailyBattleCount;
                    const locationDailyEnergy = location.energyCost * attemptsLeft;

                    if (material.energyLeft > locationDailyEnergy) {
                        if (energyLeft > locationDailyEnergy) {
                            energyLeft -= locationDailyEnergy;
                            material.energyLeft -= locationDailyEnergy;

                            raidLocations.push({
                                ...location,
                                raidsCount: attemptsLeft,
                                farmedItems: locationDailyEnergy / location.energyPerItem,
                                energySpent: locationDailyEnergy,
                                isShardsLocation: false,
                            });
                            continue;
                        }
                    }

                    if (energyLeft > material.energyLeft) {
                        const numberOfBattles = Math.floor(material.energyLeft / location.energyCost);
                        const maxNumberOfBattles = numberOfBattles > attemptsLeft ? attemptsLeft : numberOfBattles;

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
                        const maxNumberOfBattles = numberOfBattles > attemptsLeft ? attemptsLeft : numberOfBattles;

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
                x => x.energyLeft > Math.min(...x.locations.filter(c => c.isSuggested).map(l => l.energyCost))
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
        const result: IUnitUpgrade[] = [];
        const canonUpgrades = this.canonicalizeInventoryUpgrades(inventoryUpgrades);
        for (const goal of goals) {
            const upgradeRanks =
                goal.type === PersonalGoalType.UpgradeRank
                    ? CharacterUpgradesService.getCharacterUpgradeRank(goal)
                    : this.getMowUpgradeRank(goal);
            const baseUpgradesTotal: Record<string, number> = this.getBaseUpgradesTotal(upgradeRanks, canonUpgrades);

            if (goal.upgradesRarity.length) {
                // remove upgrades that do not match to selected rarities
                for (const upgradeId in baseUpgradesTotal) {
                    const upgradeData = FsdUpgradesService.baseUpgradesData[upgradeId];
                    if (upgradeData && !goal.upgradesRarity.includes(upgradeData.rarity)) {
                        delete baseUpgradesTotal[upgradeId];
                    }
                }
            }

            const relatedUpgrades: string[] = upgradeRanks.flatMap(x => {
                const result: string[] = [...x.upgrades];
                const upgrades: Array<IBaseUpgrade | ICraftedUpgrade> = x.upgrades
                    .map(upgrade => FsdUpgradesService.getUpgrade(upgrade))
                    .filter(x => !!x);
                for (const upgrade of upgrades) {
                    if (upgrade.crafted) {
                        result.push(...upgrade.baseUpgrades.map(x => x.id));
                        result.push(...upgrade.craftedUpgrades.map(x => x.id));
                    }
                }

                return result;
            });

            result.push({
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

    /**
     * @param rankLookup The start and end ability level of the goal, as well as any
     *                   materials that have already been applied.
     * @returns The number of each upgrade material necessary to level up the
     *          abilities.
     */
    public static getMowUpgradeRank(rankLookup: ICharacterUpgradeMow): IUnitUpgradeRank[] {
        const primaryUpgrades = MowsService.getUpgradesRaw(
            rankLookup.unitId,
            rankLookup.primaryStart,
            rankLookup.primaryEnd,
            'primary'
        );
        const secondaryUpgrades = MowsService.getUpgradesRaw(
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
                    x.locations.some(location => location.isUnlocked && location.isPassFilter && !location.isSuggested)
            )
            .map(x => x.id);

        if (!correctUpgradesLocations.length) {
            return estimates;
        }

        for (const upgradeId of correctUpgradesLocations) {
            const upgrade = upgrades[upgradeId];
            const newLocation = upgrade.locations.find(
                location => location.isUnlocked && location.isPassFilter && !location.isSuggested
            );
            if (newLocation) {
                newLocation.isSuggested = true;
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
        const { id, snowprintId, label, rarity, iconPath, locations, relatedCharacters, relatedGoals } = upgrade;

        // console.trace('upgrade', upgrade, requiredCount, acquiredCount);

        const selectedLocations = locations.filter(x => x.isSuggested);

        const leftCount = Math.max(requiredCount - acquiredCount, 0);

        const estimate: ICharacterUpgradeEstimate = {
            id,
            snowprintId,
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
                    ...FsdUpgradesService.baseUpgradesData[upgradeId],
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
        const completedLocations = settings.completedLocations;
        // get locations of the selected Campaign Event if there are any
        const currCampaignEventLocations = campaignsByGroup[settings.preferences.campaignEvent ?? ''] ?? [];
        for (const upgradeId in upgrades) {
            const combinedUpgrade = upgrades[upgradeId];

            for (const location of combinedUpgrade.locations) {
                const campaignProgress = settings.campaignsProgress[location.campaign as keyof ICampaignsProgress];
                const isCampaignEventLocation = campaignEventsLocations.includes(location.campaign);
                const isCampaignEventLocationAvailable = currCampaignEventLocations.includes(location.campaign);

                location.isUnlocked = location.nodeNumber <= campaignProgress;
                location.isPassFilter =
                    !settings.filters ||
                    CampaignsService.passLocationFilter(location, settings.filters, combinedUpgrade.rarity);
                location.isCompleted = completedLocations.some(
                    completedLocation =>
                        location.id === completedLocation.id &&
                        completedLocation.dailyBattleCount === completedLocation.raidsCount
                );
                location.isStarted = completedLocations.some(
                    completedLocation =>
                        location.id === completedLocation.id &&
                        completedLocation.dailyBattleCount !== completedLocation.raidsCount
                );

                // location can be suggested for raids only if it is unlocked, passed other filters
                // and in case it is Campaign Event location user should have specific Campaign Event selected
                location.isSuggested =
                    location.isUnlocked &&
                    location.isPassFilter &&
                    (!isCampaignEventLocation || isCampaignEventLocationAvailable);
            }
            const minEnergy = Math.min(
                ...combinedUpgrade.locations.filter(x => x.isSuggested).map(x => x.energyPerItem)
            );

            if (
                [DailyRaidsStrategy.leastEnergy, DailyRaidsStrategy.leastTime].includes(
                    settings.preferences.farmStrategy
                )
            ) {
                for (const location of combinedUpgrade.locations) {
                    location.isSuggested = location.isSuggested && location.energyPerItem === minEnergy;
                }
            }

            if (
                settings.preferences.farmStrategy === DailyRaidsStrategy.custom &&
                settings.preferences.customSettings
            ) {
                let locationTypes = [...settings.preferences.customSettings[combinedUpgrade.rarity]];
                const selectedLocations = combinedUpgrade.locations.filter(x => x.isSuggested);
                let ignoredLocations = selectedLocations.filter(x => !locationTypes.includes(x.campaignType));
                if (ignoredLocations.length !== selectedLocations.length) {
                    for (const ignoredLocation of ignoredLocations) {
                        ignoredLocation.isSuggested = false;
                    }
                } else {
                    // Adjust for dependencies
                    const needsUpdate = new Set<CampaignType>();

                    if (locationTypes.includes(CampaignType.Elite) && !locationTypes.includes(CampaignType.Extremis)) {
                        needsUpdate.add(CampaignType.Extremis);
                    }

                    if (locationTypes.includes(CampaignType.Extremis) && !locationTypes.includes(CampaignType.Mirror)) {
                        needsUpdate.add(CampaignType.Mirror);
                    }

                    if (needsUpdate.size > 0) {
                        locationTypes = [...locationTypes, ...needsUpdate];

                        ignoredLocations = selectedLocations.filter(x => !locationTypes.includes(x.campaignType));

                        if (ignoredLocations.length !== selectedLocations.length) {
                            for (const ignoredLocation of ignoredLocations) {
                                ignoredLocation.isSuggested = false;
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

                const craftedUpgradeData = FsdUpgradesService.craftedUpgradesData[craftedUpgrade];
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
                const upgradeData = FsdUpgradesService.getUpgrade(upgrade);
                if (!upgradeData) {
                    continue;
                }

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

    static findUpgrade(upgrade: TacticusUpgrade): string | null {
        const byName = FsdUpgradesService.recipeDataByName[upgrade.name];
        if (byName) {
            return byName.material;
        }

        const byTacticusId = this.recipeDataByTacticusId[upgrade.id];
        if (byTacticusId) {
            return byTacticusId.material;
        }

        return null;
    }

    private static composeByTacticusId(): Record<string, IMaterial> {
        const result: Record<string, IMaterial> = {};

        for (const materialName in FsdUpgradesService.recipeDataByName) {
            const material = FsdUpgradesService.recipeDataByName[materialName];
            if (material.tacticusId) {
                result[material.tacticusId] = material;
            }
        }

        return result;
    }
}
