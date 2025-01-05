import {
    IBaseUpgrade,
    IBaseUpgradeData,
    ICharacterAscendGoal,
    ICharacterUnlockGoal,
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
import { IUnit, IUnitData } from 'src/v2/features/characters/characters.models';
import { cloneDeep, groupBy, mean, orderBy, sum, uniq, uniqBy } from 'lodash';
import { StaticDataService } from 'src/services/static-data.service';
import { UpgradesService } from 'src/v2/features/goals/upgrades.service';

import rankUpData from 'src/assets/rankUpData.json';
import recipeData from 'src/v2/data/recipeData.json';
import battleData from 'src/assets/battleData.json';
import { getEnumValues, rankToString } from 'src/shared-logic/functions';
import { MowLookupService } from 'src/v2/features/lookup/mow-lookup.service';
import { charsUnlockShards } from 'src/models/constants';
import _ from 'lodash';
import { getTypographyUtilityClass } from '@mui/material';
import { AcUnitRounded } from '@mui/icons-material';

/**
 * Information about farming a particular material.
 */
export class FarmData {
    /** The material to farm. */
    material: string = '';

    /** How many instances of the material we need to farm. */
    count: number = 0;

    /** If we can farm this item yet. */
    canFarm: boolean = true;

    /** How much it would cost to farm the material the requisite number of times. */
    totalEnergy: number = 0;

    /** The type of node we used to farm the material. */
    campaignType: CampaignType = CampaignType.Normal;

    /** The nodes from which we can farm the material. */
    farmableLocations: ICampaignBattleComposed[] = [];

    /** The locked nodes from which we cannot yet farm the material. */
    unfarmableLocations: ICampaignBattleComposed[] = [];
}

/** Information about farming a particular material. */
export class GoalData {
    /** If we can farm to reach this goal, that is, at least one
     * node for each necessary material is unlocked).
     */
    canFarm: boolean = true;

    /** How much it costs to farm all materials necessary to hit the goal. */
    totalEnergy: number = 0;

    /**
     * Information about each material we need to farm to reach this goal.
     * Keyed by material name. In the event the material is a character shard,
     * the key is the unit ID.
     */
    farmData: Map<string, FarmData> = new Map<string, FarmData>();

    /** The nodes from which we can farm the requisite materials. */
    farmableLocations: ICampaignBattleComposed[] = [];

    /** The locked nodes from which we cannot yet farm the requisite materials. */
    unfarmableLocations: ICampaignBattleComposed[] = [];
}

/**
 * For a given battle, says how much we would save on all our goals by
 * beating the battle.
 */
export class BattleSavings {
    /** The battle to beat to achieve these savings. */
    battle: ICampaignBattleComposed;

    /** If beating this battle would unlock an as-of-yet unfarmable material
     * needed for a character, specifies the character. In sorted order.
     */
    wouldUnlockFor: string[] = [];

    /**
     * The savings on our goals by beating only this node. This will be negative
     * if beating this node unlocks a material.
     */
    savings: number = 0;

    /**
     * The cumulative savings on our goals by beating this
     * node and all nodes in the campaign before it.
     *
     * This will be negative if beating this node unlocks a material.
     */
    cumulativeSavings: number = 0;

    public constructor(
        battle: ICampaignBattleComposed,
        wouldUnlockFor: string[],
        savings: number,
        cumulativeSavings: number
    ) {
        this.battle = battle;
        this.wouldUnlockFor = wouldUnlockFor;
        this.savings = savings;
        this.cumulativeSavings = cumulativeSavings;
    }
}

export class CampaignFactionMapping {
    // For each campaign, a list of factions usable in at least one node.
    campaignFactions: Map<string, Set<string>> = new Map<string, Set<string>>();
    // For each faction, a list of campaigns they can be used in.
    factionCampaigns: Map<string, Set<string>> = new Map<string, Set<string>>();
}

/**
 * Information about a particular campaign. Includes how much each related
 * goal costs, and how much we would save by advancing to particular nodes.
 */
export class CampaignProgressData {
    /**
     * The cost to hit the goal of each character eligible for use in the campaign.
     * The key is the goal ID, not the unit ID. The cost will be negative if the
     * goal is not currently farmable.
     */
    goalCost: Map<string, number> = new Map<string, number>();

    /** The total savings we would get on all of our goals if we beat this node. */
    savings: BattleSavings[] = [];
}

/** Progress data for each campaign. */
export class CampaignsProgressData {
    /**
     * For each campaign, the progress data. Key is campaign
     * name (e.g. "Indomitus Elite", "Octarius", "Saim-Hann Mirror").
     */
    data: Map<string, CampaignProgressData> = new Map<string, CampaignProgressData>();

    /** Info about farming each material (or character shard). */
    materialFarmData: Map<string, FarmData> = new Map<string, FarmData>();

    /**
     * Which characters require which materials to hit their goals.
     * The key is material ID, the array is the set of unit IDs.
     * */
    charactersNeedingMaterials: Map<string, Array<string>> = new Map<string, Array<string>>();
}

/** Holds a list of materials and counts, keyed by upgrade material ID. */
class MaterialRequirements {
    materials: Record<string, number> = {};
}

export class CampaignsProgressionService {
    static readonly recipeData: IRecipeData = recipeData;
    static readonly rankUpData: IRankUpData = rankUpData;
    static readonly battleData: ICampaignsData = battleData;
    static readonly campaignData: Record<string, ICampaignBattleComposed> = CampaignsService.getCampaignComposed();
    static readonly campaignFactionMapping = this.getFactionCampaignMappings();

    /**
     * @returns A mapping of all factions playable in a campaign, and
     *      all campaigns playable by a faction.
     */
    private static getFactionCampaignMappings(): CampaignFactionMapping {
        const result = new CampaignFactionMapping();
        result.campaignFactions.set('Indomitus', new Set<string>(['Ultramarines']));
        result.campaignFactions.set('Indomitus Mirror', new Set<string>(['Necrons']));
        result.campaignFactions.set('Fall of Cadia', new Set<string>(['Black Legion']));
        result.campaignFactions.set('Fall of Cadia Mirror', new Set<string>(['Astra Militarum']));
        result.campaignFactions.set('Octarius', new Set<string>(['Orks']));
        result.campaignFactions.set('Octarius Mirror', new Set<string>(['Black Templars']));
        result.campaignFactions.set('Saim-Hann', new Set<string>(['Aeldari']));
        result.campaignFactions.set('Saim-Hann Mirror', new Set<string>(['Thousand Sons']));
        result.campaignFactions.set('Indomitus Elite', new Set<string>(['Ultramarines']));
        result.campaignFactions.set('Indomitus Mirror Elite', new Set<string>(['Necrons']));
        result.campaignFactions.set('Fall of Cadia Elite', new Set<string>(['Black Legion']));
        result.campaignFactions.set('Fall of Cadia Mirror Elite', new Set<string>(['Astra Militarum']));
        result.campaignFactions.set('Octarius Elite', new Set<string>(['Orks']));
        result.campaignFactions.set('Octarius Mirror Elite', new Set<string>(['Black Templars']));
        result.campaignFactions.set('Saim-Hann Elite', new Set<string>(['Aeldari']));
        result.campaignFactions.set('Saim-Hann Mirror Elite', new Set<string>(['Thousand Sons']));
        for (const [campaign, factions] of result.campaignFactions.entries()) {
            factions.forEach((key: string, faction: string) => {
                if (!result.factionCampaigns.get(faction)) {
                    result.factionCampaigns.set(faction, new Set<string>());
                }
                result.factionCampaigns.get(faction)?.add(campaign);
            });
        }
        Object.entries(battleData).forEach(([battleId, battle]) => {
            CampaignsService.getCampaignComposed()[battleId].alliesFactions.forEach(faction => {
                result.campaignFactions.get(battle.campaign)?.add(faction);
                if (!result.factionCampaigns.get(faction)) {
                    result.factionCampaigns.set(faction, new Set<string>());
                }
                result.factionCampaigns.get(faction)?.add(battle.campaign);
            });
        });
        return result;
    }

    /**
     * Computes the cost per goal and associates each character with the campaigns
     * in which they can participate. Also computes the nodes we can beat to bring
     * the cost of our goals down further.
     *
     * @param goals The goals to analyze.
     * @param campaignProgress The progress on the various campaigns.
     * @param inventoryUpgrades Which upgrades we already have farmed.
     * @param result The campaign progress data into which we should store
     *               the results. Should already have (empty) entries for
     *         every campaign.
     * @param nodesToBeat The map into which we should store the unbeated
     *                    nodes, keyed by campaign. Should already have
     *                    (empty) sets for every campaign.
     */
    private static computeGoalCostsAndUnbeatenNodes(
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterUnlockGoal | ICharacterAscendGoal>,
        campaignProgress: ICampaignsProgress,
        inventoryUpgrades: Record<string, number>,
        result: CampaignsProgressData,
        nodesToBeat: Map<string, ICampaignBattleComposed[]>
    ): void {
        let totalCost: number = 0;
        for (const goal of goals) {
            const goalData: GoalData = this.computeGoalCost(goal, campaignProgress, inventoryUpgrades);
            if (goalData.canFarm) {
                // Only add the cost if we can farm everything.
                totalCost += goalData.totalEnergy;
            }
            goalData.unfarmableLocations.forEach(x => {
                nodesToBeat.get(x.campaign)?.push(x);
            });
            const unit = StaticDataService.getUnit(goal.unitId);
            if (!unit) {
                console.error("Couldn't find unit '" + goal.unitId + "'.");
                continue;
            }
            // If this unit can participate in campaigns, add the farm data to the
            // campaign results.
            this.campaignFactionMapping.factionCampaigns.get(unit.faction)?.forEach(campaign => {
                if (!result.data.get(campaign)) {
                    console.error("no campaign data for '" + campaign + "'.");
                    return;
                }
                result.data.get(campaign)?.goalCost.set(goal.goalId, goalData.totalEnergy);
            });

            // Sum up all the materials across all goals.
            goalData.farmData.forEach((data, material) => {
                if (result.materialFarmData.has(material)) {
                    const existingData = result.materialFarmData.get(material)!;
                    existingData.count += data.count;
                    if (existingData.canFarm) existingData.totalEnergy += data.totalEnergy;
                } else {
                    result.materialFarmData.set(material, data);
                }
                if (!result.charactersNeedingMaterials.get(material)) {
                    result.charactersNeedingMaterials.set(material, []);
                }
                result.charactersNeedingMaterials.get(material)?.push(goal.unitId);
            });
        }
    }

    /**
     * @param nodes The nodes to beat, keyed by campaign.
     * @returns The set of nodes to beat, with duplicates removed.
     */
    private static uniquifyNodesToBeat(
        nodes: Map<string, ICampaignBattleComposed[]>
    ): Map<string, ICampaignBattleComposed[]> {
        const ret = new Map<string, ICampaignBattleComposed[]>();
        for (const [campaign, battles] of nodes.entries()) {
            const newBattles: ICampaignBattleComposed[] = [];
            const used: Set<number> = new Set<number>();
            for (const battle of battles) {
                if (used.has(battle.nodeNumber)) continue;
                newBattles.push(battle);
                used.add(battle.nodeNumber);
            }
            ret.set(campaign, newBattles);
        }
        return ret;
    }

    /**
     * Analyzes all existing goals and campaign progress, and computes, for each
     * campaign, how much each related character goal costs, and how much we would
     * save on all other goals if we were to beat other nodes in the campaign.
     */
    public static computeCampaignsProgress(
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterUnlockGoal | ICharacterAscendGoal>,
        campaignProgress: ICampaignsProgress,
        inventoryUpgrades: Record<string, number>
    ): CampaignsProgressData {
        const result = new CampaignsProgressData();

        // For each campaign, a list of battles to beat that will make
        // our goals cheaper.
        let nodesToBeat = new Map<string, ICampaignBattleComposed[]>();
        // Do some initialization required before
        // calling computeGoalCostsAndUnbeatenNodes.
        for (const campaign of this.campaignFactionMapping.campaignFactions.keys()) {
            nodesToBeat.set(campaign, []);
            result.data.set(campaign, new CampaignProgressData());
        }

        this.computeGoalCostsAndUnbeatenNodes(goals, campaignProgress, {}, result, nodesToBeat);

        nodesToBeat = this.uniquifyNodesToBeat(nodesToBeat);

        const newMaterialEnergy = new Map<string, number>();
        for (const campaign of nodesToBeat.keys()) {
            if ((nodesToBeat.get(campaign)?.length ?? 0) == 0) continue;
            const nodes: ICampaignBattleComposed[] = nodesToBeat.get(campaign)!.sort((a, b) => {
                return a.nodeNumber - b.nodeNumber;
            });
            let cumulativeSavings: number = 0;

            // For each campaign, go through each node (in battle order) and compute the
            // savings we achieve by being able to farm the node. If we don't save anything,
            // then we omit the node from the results.
            for (const battle of nodes) {
                if (!result.materialFarmData.has(battle.reward)) {
                    // This is a character shard.
                    continue;
                }
                const farmData = result.materialFarmData.get(battle.reward)!;
                if (farmData.canFarm) {
                    const newEnergyCost: number = this.getCostToFarmMaterial(
                        battle.campaignType,
                        farmData.count,
                        battle.rarityEnum
                    );
                    const oldEnergy = newMaterialEnergy.get(battle.reward) ?? farmData.totalEnergy;
                    if (farmData.campaignType == battle.campaignType) continue;
                    if (oldEnergy > newEnergyCost) {
                        cumulativeSavings += farmData.totalEnergy - newEnergyCost;
                        result.data
                            .get(campaign)
                            ?.savings.push(
                                new BattleSavings(battle, [], farmData.totalEnergy - newEnergyCost, cumulativeSavings)
                            );
                        newMaterialEnergy.set(battle.reward, newEnergyCost);
                    }
                } else {
                    // By beating this battle, we unlock upgrade materials we couldn't previously farm.
                    result.data
                        .get(campaign)
                        ?.savings.push(
                            new BattleSavings(
                                battle,
                                result.charactersNeedingMaterials.get(battle.reward) ?? [],
                                -1,
                                -1
                            )
                        );
                    newMaterialEnergy.set(battle.reward, -1);
                }
            }
        }

        return result;
    }

    /**
     * Add `count` of `material` to `materials`, added the entry if it
     * doesn't already exist.
     * @param materials The record to modify.
     * @param material The material we need.
     * @param count The number of this specific material that we need.
     */
    private static addToMaterials(materialReqs: MaterialRequirements, material: string, count: number): void {
        if (materialReqs.materials[material]) {
            materialReqs.materials[material] += count;
        } else {
            materialReqs.materials[material] = count;
        }
    }

    /**
     * Computes the cheapest cost to reach a specific goal, given existing
     * inventory. Uses nodes, if available, in the following order: Elite,
     * Early Indom, Mirror, Normal. Does not modify `inventoryUpgrades`.
     *
     * @param goal The goal to reach.
     * @param campaignProgress The account's progress on the campaigns.
     * @param inventoryUpgrades The account's existing inventory, which may be useful
     *                          to reach the specified goal.
     * @returns The cheapest cost to reach a specific goal, given existing inventory.
     *          Includes the nodes we can currently use to farm, and the nodes from which
     *          we could reap savings if we were to beat.
     */
    public static computeGoalCost(
        goal: ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterUnlockGoal | ICharacterAscendGoal,
        campaignProgress: ICampaignsProgress,
        inventoryUpgrades: Record<string, number>
    ): GoalData {
        const materialReqs = new MaterialRequirements();
        if (goal.type == PersonalGoalType.Unlock) {
            const unlockGoal = goal as ICharacterUnlockGoal;
            this.addToMaterials(materialReqs, goal.unitName, charsUnlockShards[goal.rarity] - goal.shards);
        } else {
            const upgradeRanks =
                goal.type === PersonalGoalType.UpgradeRank
                    ? UpgradesService.getCharacterUpgradeRank(goal as ICharacterUpgradeRankGoal)
                    : UpgradesService.getMowUpgradeRank(goal as ICharacterUpgradeMow);

            for (const unitUpgrade of upgradeRanks) {
                for (const upgradeMaterial of unitUpgrade.upgrades) {
                    const expandedRecipe: IRecipeExpandedUpgrade =
                        UpgradesService.recipeExpandedUpgradeData[upgradeMaterial];
                    if (Object.entries(expandedRecipe.expandedRecipe).length == 0) {
                        this.addToMaterials(materialReqs, expandedRecipe.id, 1);
                    } else {
                        for (const [material, count] of Object.entries(expandedRecipe.expandedRecipe)) {
                            if (material == 'Gold') continue;
                            this.addToMaterials(materialReqs, material, count);
                        }
                    }
                }
            }
        }
        const result: GoalData = new GoalData();

        {
            const newMaterials: Record<string, number> = {};
            for (const [material, count] of Object.entries(materialReqs.materials)) {
                let newCount: number = count;
                if (inventoryUpgrades[material]) {
                    newCount -= inventoryUpgrades[material];
                }
                if (newCount > 0) {
                    newMaterials[material] = count;
                }
            }
            materialReqs.materials = newMaterials;
        }
        const sortedMaterials: string[] = Object.keys(materialReqs.materials).sort(
            (a, b) =>
                UpgradesService.recipeExpandedUpgradeData[b].rarity -
                UpgradesService.recipeExpandedUpgradeData[a].rarity
        );
        for (const material of sortedMaterials) {
            const count: number = materialReqs.materials[material];
            const farmData: FarmData = this.getCostToFarm(material, count, campaignProgress, inventoryUpgrades);
            result.canFarm = result.canFarm && farmData.canFarm;
            result.totalEnergy = result.canFarm ? result.totalEnergy + farmData.totalEnergy : -1;
            result.farmData.set(material, farmData);
            farmData.farmableLocations.forEach(x => {
                result.farmableLocations.push(x);
            });
            farmData.unfarmableLocations.forEach(x => {
                result.unfarmableLocations.push(x);
            });
        }

        return result;
    }

    /**
     * Computes the lowest amount of energy "required" to farm the given material `count` times.
     *
     * We say required because farming involves probabilities and a random number generator,
     * so the results are always an approximation.
     *
     * @param material The ID of the material to farm.
     * @param count The number of this material we need.
     * @param campaignProgress Our progress in the campaigns, dictating the nodes from
     *                         which we can farm.
     * @param inventoryUpgrades Our current inventory, allowing us to skip farming some
     *                         or all materials if we already have them.
     * @returns The total cost in energy to farm `count` of `material`, as well as the
     *          nodes we can use now, and in the future.
     */
    public static getCostToFarm(
        material: string,
        count: number,
        campaignProgress: ICampaignsProgress,
        inventoryUpgrades: Record<string, number>
    ): FarmData {
        const result: FarmData = {
            material: material,
            totalEnergy: 0,
            canFarm: true,
            count: count,
            campaignType: CampaignType.Normal,
            farmableLocations: this.getFarmableLocations(material, campaignProgress),
            unfarmableLocations: this.getUnfarmableLocations(material, campaignProgress),
        };
        const hasElite = result.farmableLocations.filter(x => x.campaignType == CampaignType.Elite).length > 0;
        const hasEarly =
            result.farmableLocations.filter(
                x => x.campaign == 'Indomitus' && x.type == CampaignType.Normal && x.nodeNumber < 30
            ).length > 0;
        const hasMirror = result.farmableLocations.filter(x => x.campaignType == CampaignType.Mirror).length > 0;
        const hasNormal = result.farmableLocations.filter(x => x.campaignType == CampaignType.Normal).length > 0;
        const rarity = UpgradesService.recipeExpandedUpgradeData[material]?.rarity ?? undefined;
        if (hasElite) {
            result.totalEnergy = this.getCostToFarmMaterial(CampaignType.Elite, count, rarity!);
            result.campaignType = CampaignType.Elite;
        } else if (hasEarly) {
            result.totalEnergy = this.getCostToFarmMaterial(CampaignType.Early, count, rarity!);
            result.campaignType = CampaignType.Early;
        } else if (hasMirror) {
            result.totalEnergy = this.getCostToFarmMaterial(CampaignType.Mirror, count, rarity!);
            result.campaignType = CampaignType.Mirror;
        } else if (hasNormal) {
            result.totalEnergy = this.getCostToFarmMaterial(CampaignType.Normal, count, rarity!);
            result.campaignType = CampaignType.Normal;
        } else if (result.farmableLocations.length == 0) {
            result.totalEnergy = -1;
            result.canFarm = false;
        } else {
            console.error('Unknown node type ' + CampaignType[result.farmableLocations[0].campaignType]);
            result.totalEnergy = -1;
        }
        return result;
    }

    /**
     * @param type The campaign type of the node.
     * @returns the energy cost to raid/battle a node of the specified type.
     */
    public static getEnergyCost(type: CampaignType): number {
        switch (type) {
            case CampaignType.Normal:
                return 6;
            case CampaignType.Mirror:
                return 6;
            case CampaignType.Early:
                return 5;
            case CampaignType.SuperEarly:
                return 3;
            case CampaignType.Elite:
                return 10;
        }
        return -1;
    }

    /**
     * @param type The campaign type of the node.
     * @param rarity The rarity of the reward material from the battle.
     * @returns The drop rate of the item (e.g. 0.3 = 3 times out of ten).
     */
    public static getDropRate(type: CampaignType, rarity: Rarity): number {
        const normalDropRates = new Map<Rarity, number>([
            [Rarity.Common, 3 / 4.0],
            [Rarity.Uncommon, 4 / 7.0],
            [Rarity.Rare, 1 / 5.0],
            [Rarity.Epic, 1 / 7.0],
            [Rarity.Legendary, 1 / 12.0],
        ]);
        const mirrorDropRates = new Map<Rarity, number>([
            [Rarity.Common, 3 / 4.0],
            [Rarity.Uncommon, 4 / 7.0],
            [Rarity.Rare, 1 / 5.0],
            [Rarity.Epic, 1 / 7.0],
            [Rarity.Legendary, 1 / 12.0],
        ]);
        const eliteDropRates = new Map<Rarity, number>([
            [Rarity.Common, 3 / 2.0],
            [Rarity.Uncommon, 1.25],
            [Rarity.Rare, 13 / 12.0],
            [Rarity.Epic, 2 / 3.0],
            [Rarity.Legendary, 1 / 3.0],
        ]);
        switch (type) {
            case CampaignType.Normal:
            case CampaignType.Early:
                return normalDropRates.get(rarity) ?? -1;
            case CampaignType.Mirror:
                return mirrorDropRates.get(rarity) ?? -1;
            case CampaignType.Elite:
                return eliteDropRates.get(rarity) ?? -1;
        }
        return -1;
    }

    /**
     * @param type The campaign type from which to farm.
     * @param rarity The rarity of the material to farm.
     * @param count The number of items to farm.
     * @returns The total expected energy cost using the ideal strategy to minimize
     *          energy spent.
     */
    public static getCostToFarmMaterial(type: CampaignType, count: number, rarity: Rarity): number {
        if (rarity === undefined) {
            // For character shards, elite nodes drop 25 shards per 24 pulls. All other nodes drop 3
            // shards per 10 pulls.
            if (type == CampaignType.Elite) {
                return 10 * Math.ceil((count * 24) / 25.0);
            } else if (type == CampaignType.Early) {
                return 5 * Math.ceil((count * 10) / 3.0);
            } else {
                return 6 * Math.ceil((count * 10) / 3.0);
            }
        }

        return Math.ceil(count / this.getDropRate(type, rarity)) * this.getEnergyCost(type);
    }

    /** @returns the material ID of the material with the given label. */
    private static getMaterialId(materialLabel: string): string {
        return UpgradesService.materialByLabel[materialLabel];
    }

    /**
     *
     * @param material The ID of the material to farm.
     * @param campaignProgress Our campaign progress thus far, which restricts our ability
     *                         to farm certain materials more cheaply (e.g. if we haven't
     *                         beaten an elite node, only a normal node).
     * @returns The locations from which we can currently farm a specific material.
     */
    public static getFarmableLocations(
        material: string,
        campaignProgress: ICampaignsProgress
    ): ICampaignBattleComposed[] {
        const result: ICampaignBattleComposed[] = [];

        Object.entries(CampaignsService.getCampaignComposed()).forEach(([campaign, battle]) => {
            if (
                this.getMaterialId(battle.reward) === this.getMaterialId(material) &&
                CampaignsService.hasCompletedBattle(battle, campaignProgress)
            ) {
                result.push(battle);
            }
        });

        return result;
    }

    /**
     *
     * @param material The material to farm.
     * @param campaignProgress Our campaign progress thus far, which restricts our ability
     *             to farm certain materials more cheaply (e.g. if we haven't
     *             beaten an elite node, only a normal node).
     * @returns The locations from which we cannot currently farm a specific material, because
     *          we have yet to beat the necessary battle.
     */
    public static getUnfarmableLocations(
        material: string,
        campaignProgress: ICampaignsProgress
    ): ICampaignBattleComposed[] {
        const result: ICampaignBattleComposed[] = [];

        let count = 0;
        Object.entries(CampaignsService.getCampaignComposed()).forEach(([campaign, battle]) => {
            if (
                this.getMaterialId(battle.reward) == this.getMaterialId(material) &&
                !CampaignsService.hasCompletedBattle(battle, campaignProgress)
            ) {
                result.push(battle);
                ++count;
            }
        });

        return result;
    }
}
