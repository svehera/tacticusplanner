import { groupBy, map, orderBy, sumBy, uniq } from 'lodash';

import { RarityMapper, RarityString } from '@/fsd/5-shared/model';

import { CampaignsService } from '@/fsd/4-entities/campaign/@x/upgrade';

import { recipeDataByName } from './data';
import {
    IBaseUpgrade,
    IBaseUpgradeData,
    ICraftedUpgrade,
    ICraftedUpgradeData,
    IMaterialFull,
    IMaterialRecipeIngredient,
    IMaterialRecipeIngredientFull,
    IRecipeData,
    IRecipeDataFull,
    IUpgradeRecipe,
} from './model';

export class UpgradesService {
    static readonly recipeDataByName: IRecipeData = recipeDataByName;
    static readonly baseUpgradesData: IBaseUpgradeData = this.composeBaseUpgrades();
    static readonly craftedUpgradesData: ICraftedUpgradeData = this.composeCraftedUpgrades();
    static readonly recipeDataFull: IRecipeDataFull = this.convertRecipeData();

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
            Object.entries(inventoryUpdate).filter(materialAndCount => materialAndCount[1] > 0)
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
     * Returns an IBaseUpgradeData that holds non-craftable materials only. The
     * locations are sorted in the order elite < early indom < mirror < normal.
     */
    private static composeBaseUpgrades(): IBaseUpgradeData {
        const result: IBaseUpgradeData = {};
        const upgrades = Object.keys(recipeDataByName);
        const upgradeLocationsShort = CampaignsService.getUpgradesLocations();

        for (const upgradeName of upgrades) {
            const upgrade = recipeDataByName[upgradeName];

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
                rarity: RarityMapper.stringToNumber[upgrade.rarity as RarityString],
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
        const upgrades = Object.keys(recipeDataByName);

        for (const upgradeName of upgrades) {
            const upgrade = recipeDataByName[upgradeName];

            if (!upgrade.craftable) {
                continue;
            }

            const id = upgrade.material;

            const recipeDetails = upgrade.recipe?.map(item => this.getRecipe(item)) ?? [];

            result[upgradeName] = {
                id,
                label: upgrade.label ?? id,
                rarity: RarityMapper.stringToNumber[upgrade.rarity as RarityString],
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

    private static getRecipe({ material: id, count: upgradeCount }: IMaterialRecipeIngredient): {
        baseUpgrades: IUpgradeRecipe[];
        craftedUpgrades: IUpgradeRecipe[];
    } {
        const baseUpgrades: IUpgradeRecipe[] = [];
        const craftedUpgrades: IUpgradeRecipe[] = [];

        const upgradeDetails = recipeDataByName[id];

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

    // Converts the static JSON in recipeData to an IRecipeDataFull object.
    static convertRecipeData(): IRecipeDataFull {
        const result: IRecipeDataFull = {};
        const upgrades = Object.keys(recipeDataByName);
        const upgradeLocations = CampaignsService.getUpgradesLocations();

        const getRecipe = (
            materialId: string,
            count: number,
            allMaterials: IMaterialRecipeIngredientFull[]
        ): IMaterialRecipeIngredientFull => {
            const upgrade = recipeDataByName[materialId];
            const locations = upgradeLocations[materialId] ?? [];

            if (!upgrade || !upgrade.recipe?.length) {
                const item: IMaterialRecipeIngredientFull = {
                    id: materialId,
                    label: upgrade?.label ?? upgrade?.material,
                    count,
                    rarity: RarityMapper.stringToNumber[upgrade?.rarity as RarityString],
                    stat: upgrade?.stat ?? '',
                    locations: locations,
                    craftable: upgrade?.craftable,
                    locationsComposed: locations.map(x => CampaignsService.campaignsComposed[x]),
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
                    locationsComposed: locations.map(x => CampaignsService.campaignsComposed[x]),
                    rarity: RarityMapper.stringToNumber[upgrade.rarity as RarityString],
                    recipe: upgrade.recipe.map(item => getRecipe(item.material, count * item.count, allMaterials)),
                    iconPath: upgrade.icon ?? '',
                    characters: [],
                    priority: 0,
                };
            }
        };

        for (const upgradeName of upgrades) {
            const upgrade = recipeDataByName[upgradeName];
            if (!upgrade.craftable) {
                result[upgradeName] = {
                    id: upgrade.material,
                    label: upgrade.label ?? upgrade.material,
                    stat: upgrade.stat,
                    rarity: RarityMapper.stringToNumber[upgrade.rarity as RarityString],
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
                    rarity: RarityMapper.stringToNumber[upgrade.rarity as RarityString],
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

    /**
     *
     * @param upgrades The set of full upgrade materials, including both crafted
     *                 and base materials.
     * @param keepGold Whether or not to keep track of gold in the results.
     * @returns
     */
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
                locationsComposed: items[0].locations?.map(location => CampaignsService.campaignsComposed[location]),
            };
        });
        return keepGold ? result : result.filter(x => x.id !== 'Gold');
    }

    static isValidUpgrade(upgrade: string): boolean {
        return Object.hasOwn(recipeDataByName, upgrade);
    }
}
