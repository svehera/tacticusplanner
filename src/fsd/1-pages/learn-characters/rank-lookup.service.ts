import { cloneDeep, orderBy, sum } from 'lodash';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { Rank, rankToString } from '@/fsd/5-shared/model';

import { ICampaignBattleComposed, ICampaignsProgress } from '@/fsd/4-entities/campaign';
import { IRankLookup, rankUpData } from '@/fsd/4-entities/character';
import {
    IMaterialRecipeIngredientFull,
    IMaterialFull,
    UpgradesService,
    IMaterialEstimated2,
} from '@/fsd/4-entities/upgrade';

export class RankLookupService {
    /**
     * @param characters The set of rank-up character goals to analyze.
     * @returns The full set of uncraftable upgrade materials needed to meet the
     *          specified rank-up goals.
     */
    public static getUpgradeMaterialsToRankUp(...characters: Array<IRankLookup>): IMaterialFull[] {
        const rankEntries: number[] = getEnumValues(Rank).filter(x => x > 0);
        const result: IMaterialFull[] = [];
        let priority = 0;
        for (const character of characters) {
            priority++;
            const characterUpgrades = rankUpData[character.unitName];
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
                const recipe = UpgradesService.recipeDataFull[upgrade];
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

    public static getAllMaterials(
        campaingsProgress: ICampaignsProgress,
        ownedUpgrades: Record<string, number>,
        upgrades: IMaterialFull[]
    ): IMaterialEstimated2[] {
        const result = UpgradesService.groupBaseMaterials(upgrades)
            .map(x =>
                this.calculateMaterialData(
                    campaingsProgress,
                    x,
                    this.selectBestLocations(campaingsProgress, x.locationsComposed ?? []),
                    ownedUpgrades,
                    {}
                )
            )
            .filter(x => !!x) as IMaterialEstimated2[];

        return orderBy(result, ['daysOfBattles', 'totalEnergy', 'rarity', 'count'], ['desc', 'desc', 'desc', 'desc']);
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
        const selectedLocations = bestLocations?.length ? bestLocations : (material.locationsComposed ?? []);

        const ownedCount = ownedUpgrades[material.id] ?? 0;
        const craftedCount = craftedBasedUpgrades[material.id] ?? 0;
        const neededCount = material.count - craftedCount;
        material.count = neededCount > 0 ? neededCount : 0;
        const leftCount = ownedCount >= material.count ? 0 : material.count - ownedCount;
        if (updateInventory) {
            const updatedCount = ownedCount - material.count;
            ownedUpgrades[material.id] = updatedCount > 0 ? updatedCount : 0;
            craftedBasedUpgrades[material.id] = neededCount > 0 ? 0 : Math.abs(neededCount);
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
            ? (material.locationsComposed
                  ?.filter(x => {
                      return !bestLocations.some(y => x.campaign === y.campaign && x.nodeNumber === y.nodeNumber);
                  })
                  .map(x => x.campaign + ' ' + x.nodeNumber)
                  .join(', ') ?? '')
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
        campaingsProgress: ICampaignsProgress,
        locationsComposed: ICampaignBattleComposed[]
    ): ICampaignBattleComposed[] {
        const unlockedLocations = locationsComposed.filter(location => {
            const campaignProgress = campaingsProgress[location.campaign as keyof ICampaignsProgress];
            return location.nodeNumber <= campaignProgress;
        });

        return orderBy(unlockedLocations, ['energyPerItem', 'expectedGold'], ['asc', 'desc']);
    }
}
