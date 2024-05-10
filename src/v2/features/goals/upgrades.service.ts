import {
    ICharacterAscendGoal,
    ICharacterUnlockGoal,
    ICharacterUpgradeRankGoal,
    IEstimatedAscensionSettings,
    IEstimatedShards,
    ILocationRaid,
    IShardMaterial,
    ICharacterShardsEstimate,
    IShardsRaid,
    ICharacterUpgradeEstimate,
    IEstimatedUpgrades,
    ICharacterUpgrade,
    ICharacterUpgradeRank,
    IBaseUpgradeData,
    IUpgradeBase,
    IUpgradeData,
    ICraftedUpgradeData,
} from 'src/v2/features/goals/goals.models';
import {
    ICampaignBattle,
    ICampaignBattleComposed,
    ICampaignsData,
    ICampaignsProgress,
    IEstimatedRanksSettings,
    IMaterialRecipeIngredientFull,
    IRankUpData,
    IRecipeData,
    IRecipeDataFull,
} from 'src/models/interfaces';
import { charsProgression, charsUnlockShards, rarityStringToNumber, rarityToStars } from 'src/models/constants';
import {
    Alliance,
    Campaign,
    CampaignsLocationsUsage,
    CampaignType,
    PersonalGoalType,
    Rank,
    Rarity,
    RarityString,
} from 'src/models/enums';
import { StaticDataService } from 'src/services';
import { CampaignsService } from 'src/v2/features/goals/campaigns.service';
import { groupBy, map, orderBy, sum, sumBy } from 'lodash';

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
    // static readonly upgradesData: IUpgradeData = this.convertRecipeData();
    static readonly rankEntries: number[] = getEnumValues(Rank).filter(x => x > 0);
    static getUpgradesEstimatedDays(
        settings: IEstimatedRanksSettings,
        ...goals: Array<ICharacterUpgradeRankGoal>
    ): IEstimatedUpgrades {
        const materials = this.convertGoalsToMaterials(settings, goals);

        // const shardsRaids = this.getTodayRaids(materials, settings.completedLocations);
        //
        // const energyTotal = sum(materials.map(material => material.energyTotal));
        // const energyPerDay = sum(materials.map(material => material.energyPerDay));
        // const onslaughtTokens = sum(materials.map(material => material.onslaughtTokensTotal));
        // const raidsTotal = sum(materials.map(material => material.raidsTotal));
        // const daysTotal = Math.max(...materials.map(material => material.daysTotal), Math.ceil(onslaughtTokens / 1.5));

        return {
            // shardsRaids,
            materials,
            daysTotal: 0,
            energyTotal: 0,
            raidsTotal: 0,
        };
    }

    public static convertGoalsToMaterials(
        settings: IEstimatedRanksSettings,
        goals: Array<ICharacterUpgradeRankGoal>
    ): ICharacterUpgradeEstimate[] {
        const materials = goals.map(goal => this.convertGoalToMaterial(goal));
        // const result: ICharacterUpgradeEstimate[] = materials;

        // for (let i = 0; i < materials.length; i++) {
        //     const material = materials[i];
        //     const previousShardsTokens = result[i - 1]?.onslaughtTokensTotal ?? 0;
        //     const unlockedLocations = material.possibleLocations.filter(location => {
        //         const campaignProgress = settings.campaignsProgress[location.campaign as keyof ICampaignsProgress];
        //         return location.nodeNumber <= campaignProgress;
        //     });
        //
        //     const raidsLocations =
        //         material.campaignsUsage === CampaignsLocationsUsage.LeastEnergy
        //             ? CampaignsService.selectBestLocations(unlockedLocations, settings.preferences)
        //             : material.campaignsUsage === CampaignsLocationsUsage.BestTime
        //             ? unlockedLocations
        //             : [];
        //
        //     const energyPerDay = sum(raidsLocations.map(x => x.energyPerDay));
        //
        //     if (material.onslaughtShards > 0) {
        //         raidsLocations.push(
        //             this.getOnslaughtLocation(material, 1),
        //             this.getOnslaughtLocation(material, 2),
        //             this.getOnslaughtLocation(material, 3)
        //         );
        //     }
        //
        //     const isBlocked = !raidsLocations.length;
        //     const shardsLeft = material.requiredCount - material.ownedCount;
        //     let energyTotal = 0;
        //     let raidsTotal = 0;
        //     let shardsCollected = 0;
        //     let daysTotal = 0;
        //     let onslaughtTokens = 0;
        //     while (!isBlocked && shardsCollected < shardsLeft) {
        //         let leftToCollect = shardsLeft - shardsCollected;
        //         for (const location of raidsLocations) {
        //             if (location.campaignType === 'Onslaught') {
        //                 if (daysTotal <= previousShardsTokens / 1.5) {
        //                     continue;
        //                 }
        //
        //                 onslaughtTokens += location.dailyBattleCount;
        //                 leftToCollect -= location.itemsPerDay;
        //                 shardsCollected += location.itemsPerDay;
        //                 raidsTotal += location.dailyBattleCount;
        //                 continue;
        //             }
        //
        //             if (leftToCollect >= location.itemsPerDay) {
        //                 leftToCollect -= location.itemsPerDay;
        //                 energyTotal += location.energyPerDay;
        //                 shardsCollected += location.itemsPerDay;
        //                 raidsTotal += location.dailyBattleCount;
        //             } else {
        //                 const energyLeftToFarm = leftToCollect * location.energyPerItem;
        //                 const battlesLeftToFarm = Math.ceil(energyLeftToFarm / location.energyCost);
        //                 shardsCollected += leftToCollect;
        //                 energyTotal += battlesLeftToFarm * location.energyCost;
        //                 raidsTotal += battlesLeftToFarm;
        //             }
        //         }
        //         daysTotal++;
        //         if (daysTotal > 1000) {
        //             console.error('Infinite loop', material, raidsLocations);
        //             break;
        //         }
        //     }
        //
        //     if (raidsTotal % 1 !== 0) {
        //         daysTotal++;
        //     }
        //
        //     result.push({
        //         ...material,
        //         availableLocations: unlockedLocations,
        //         raidsLocations,
        //         energyTotal,
        //         daysTotal,
        //         raidsTotal: Math.ceil(raidsTotal),
        //         onslaughtTokensTotal: Math.ceil(onslaughtTokens),
        //         isBlocked,
        //         energyPerDay,
        //     });
        // }
        // @ts-expect-error 1421241
        return materials;
    }

    private static convertGoalToMaterial(goal: ICharacterUpgradeRankGoal): ICharacterUpgrade {
        const upgradeRanks = this.getUpgradeRank(goal);

        return {
            goalId: goal.goalId,
            characterId: goal.characterName,
            label: goal.characterName,
            upgradeRanks,
        };
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
                upgrades: upgrades.map(x => this.baseUpgradesData[x]),
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
                upgrades: rankPoint5Upgrades.map(x => this.baseUpgradesData[x]),
            });
        }

        if (goal.appliedUpgrades.length) {
            const currentRank = upgradeRanks[0];
            currentRank.upgrades = currentRank.upgrades.filter(
                upgrade => upgrade && !goal.appliedUpgrades.includes(upgrade.id)
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

    static composeBaseUpgrades(): IBaseUpgradeData {
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

    static composeCraftedUpgrades(): ICraftedUpgradeData {
        const result: ICraftedUpgradeData = {};
        const upgrades = Object.keys(this.recipeData);

        for (const upgradeName of upgrades) {
            const upgrade = this.recipeData[upgradeName];

            if (!upgrade.craftable) {
                continue;
            }

            const id = upgrade.material;

            result[upgradeName] = {
                id,
                label: upgrade.label ?? id,
                rarity: rarityStringToNumber[upgrade.rarity as RarityString],
                iconPath: upgrade.icon!,
                baseUpgrades: [],
                craftedUpgrades: [],
            };
        }

        console.log(result);
        return result;
    }

    static composeCraftedUpgrades(): ICraftedUpgradeData {
        const result: ICraftedUpgradeData = {};
        const upgrades = Object.keys(this.recipeData);

        for (const upgradeName of upgrades) {
            const upgrade = this.recipeData[upgradeName];

            if (!upgrade.craftable) {
                continue;
            }

            const id = upgrade.material;

            result[upgradeName] = {
                id,
                label: upgrade.label ?? id,
                rarity: rarityStringToNumber[upgrade.rarity as RarityString],
                iconPath: upgrade.icon!,
                baseUpgrades: [],
                craftedUpgrades: [],
            };
        }

        console.log(result);
        return result;
    }

    // static getRecipe = (
    //     materialId: string,
    //     count: number,
    //     allMaterials: IMaterialRecipeIngredientFull[]
    // ): IMaterialRecipeIngredientFull => {
    //     const upgrade = this.recipeData[materialId];
    //     const locations = upgradeLocations[materialId] ?? [];
    //
    //     if (!upgrade || !upgrade.recipe?.length) {
    //         const item: IMaterialRecipeIngredientFull = {
    //             id: materialId,
    //             label: upgrade?.label ?? upgrade?.material,
    //             count,
    //             rarity: rarityStringToNumber[upgrade?.rarity as RarityString],
    //             stat: upgrade?.stat ?? '',
    //             locations: locations,
    //             craftable: upgrade?.craftable,
    //             locationsComposed: locations.map(x => CampaignsService.campaignsComposed[x]),
    //             iconPath: upgrade?.icon ?? '',
    //             characters: [],
    //             priority: 0,
    //         };
    //         allMaterials.push(item);
    //         return item;
    //     } else {
    //         return {
    //             id: materialId,
    //             label: upgrade.label ?? upgrade.material,
    //             count,
    //             stat: upgrade.stat,
    //             craftable: upgrade.craftable,
    //             locations: locations,
    //             locationsComposed: locations.map(x => CampaignsService.campaignsComposed[x]),
    //             rarity: rarityStringToNumber[upgrade.rarity as RarityString],
    //             recipe: upgrade.recipe.map(item => getRecipe(item.material, count * item.count, allMaterials)),
    //             iconPath: upgrade.icon ?? '',
    //             characters: [],
    //             priority: 0,
    //         };
    //     }
    // };

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
}
