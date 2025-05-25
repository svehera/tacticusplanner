import { uniq } from 'lodash';

import { Rank, Rarity } from '@/fsd/5-shared/model';

import {
    battleData,
    CampaignsService,
    CampaignType,
    ICampaignBattleComposed,
    ICampaignsProgress,
} from '@/fsd/4-entities/campaign';
import {
    CharactersService,
    CharacterUpgradesService,
    charsUnlockShards,
    IUnitUpgradeRank,
} from '@/fsd/4-entities/character';
import {
    PersonalGoalType,
    ICharacterUpgradeRankGoal,
    ICharacterUpgradeMow,
    ICharacterUnlockGoal,
    ICharacterAscendGoal,
} from '@/fsd/4-entities/goal';
import { IRecipeExpandedUpgrade, UpgradesService } from '@/fsd/4-entities/upgrade';

// eslint-disable-next-line import-x/no-internal-modules
import { MowLookupService } from '@/v2/features/lookup/mow-lookup.service';

import {
    CampaignFactionMapping,
    CampaignsProgressData,
    GoalData,
    CampaignProgressData,
    BattleSavings,
    MaterialRequirements,
    FarmData,
} from './campaign-progression.models';

export class CampaignsProgressionService {
    static readonly campaignFactionMapping = this.getFactionCampaignMappings();

    /**
     * @returns A mapping of all factions playable in a campaign, and
     *      all campaigns playable by a faction.
     */
    private static getFactionCampaignMappings(): CampaignFactionMapping {
        const result = new CampaignFactionMapping();

        for (const campaign of CampaignsService.allCampaigns) {
            result.campaignFactions.set(campaign.name, new Set<string>([campaign.faction]));
        }

        for (const [campaign, factions] of result.campaignFactions.entries()) {
            factions.forEach((key: string, faction: string) => {
                if (!result.factionCampaigns.get(faction)) {
                    result.factionCampaigns.set(faction, new Set<string>());
                }
                result.factionCampaigns.get(faction)?.add(campaign);
            });
        }
        Object.entries(battleData).forEach(([battleId, battle]) => {
            CampaignsService.campaignsComposed[battleId].alliesFactions.forEach(faction => {
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
            totalCost += goalData.totalEnergy;
            goalData.unfarmableLocations.forEach(x => {
                nodesToBeat.get(x.campaign)?.push(x);
            });
            const unit = CharactersService.getUnit(goal.unitId);
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
                    existingData.totalEnergy += data.totalEnergy;
                } else {
                    result.materialFarmData.set(material, data);
                }
                if (!result.charactersNeedingMaterials.get(material)) {
                    result.charactersNeedingMaterials.set(material, []);
                }
                result.charactersNeedingMaterials.get(material)?.push(goal.unitId);
            });
        }
        result.charactersNeedingMaterials.forEach((units, material) => {
            result.charactersNeedingMaterials.set(material, uniq(units.sort()));
        });
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
        campaignProgress: ICampaignsProgress
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

        for (const campaign of nodesToBeat.keys()) {
            const newMaterialEnergy = new Map<string, number>();
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
                const newEnergyCost: number = this.getCostToFarmMaterial(
                    battle.campaignType,
                    farmData.count,
                    battle.rarityEnum
                );
                const oldEnergy = newMaterialEnergy.get(battle.reward) ?? farmData.totalEnergy;
                if (oldEnergy - farmData.count > newEnergyCost || !farmData.canFarm) {
                    cumulativeSavings += farmData.totalEnergy - newEnergyCost;
                    result.data
                        .get(campaign)
                        ?.savings.push(
                            new BattleSavings(
                                battle,
                                farmData.totalEnergy - newEnergyCost,
                                cumulativeSavings,
                                farmData.canFarm
                            )
                        );
                    newMaterialEnergy.set(battle.reward, newEnergyCost);
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
     * Computes the cheapest cost to reach a specific goal, ignoring existing
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
            this.addToMaterials(materialReqs, goal.unitName, charsUnlockShards[goal.rarity] - goal.shards);
        } else {
            const upgradeRanks =
                goal.type === PersonalGoalType.UpgradeRank
                    ? CharacterUpgradesService.getCharacterUpgradeRank(goal as ICharacterUpgradeRankGoal)
                    : CampaignsProgressionService.getMowUpgradeRank(goal as ICharacterUpgradeMow);

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
            const farmData: FarmData = this.getCostToFarm(goal, material, count, campaignProgress, inventoryUpgrades);
            result.canFarm = result.canFarm && farmData.canFarm;
            result.totalEnergy = result.totalEnergy + farmData.totalEnergy;
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
     * Computes the lowest amount of energy "required" to farm the given material `count` times.
     *
     * We say required because farming involves probabilities and a random number generator,
     * so the results are always an approximation.
     *
     * @goal goal The goal for which we need to farm the material.
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
        goal: ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterUnlockGoal | ICharacterAscendGoal,
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
        const hasExtremis = result.farmableLocations.filter(x => x.campaignType == CampaignType.Extremis).length > 0;
        const hasElite = result.farmableLocations.filter(x => x.campaignType == CampaignType.Elite).length > 0;
        const hasEarly =
            result.farmableLocations.filter(
                x => x.campaign == 'Indomitus' && x.campaignType == CampaignType.Normal && x.nodeNumber < 30
            ).length > 0;
        const hasMirror = result.farmableLocations.filter(x => x.campaignType == CampaignType.Mirror).length > 0;
        const hasNormal = result.farmableLocations.filter(x => x.campaignType == CampaignType.Normal).length > 0;
        const rarity = UpgradesService.recipeExpandedUpgradeData[material]?.rarity ?? undefined;
        if (hasExtremis) {
            result.totalEnergy = this.getCostToFarmMaterial(CampaignType.Extremis, count, rarity!);
            result.campaignType = CampaignType.Extremis;
        } else if (hasElite) {
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
            result.totalEnergy = this.getCostToFarmMaterial(CampaignType.Normal, count, rarity!);
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
            case CampaignType.Extremis:
                return 6;
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
            [Rarity.Common, 4 / 5.0],
            [Rarity.Uncommon, 7 / 10.0],
            [Rarity.Rare, 1 / 3.0],
            [Rarity.Epic, 1 / 5.0],
            [Rarity.Legendary, 1 / 11.0],
        ]);
        const eliteDropRates = new Map<Rarity, number>([
            [Rarity.Common, 3 / 2.0],
            [Rarity.Uncommon, 1.25],
            [Rarity.Rare, 13 / 12.0],
            [Rarity.Epic, 2 / 3.0],
            [Rarity.Legendary, 1 / 3.0],
        ]);
        const extremisDropRates = new Map<Rarity, number>([
            [Rarity.Common, 0.9375],
            [Rarity.Uncommon, 0.75],
            [Rarity.Rare, 2 / 3.0],
            [Rarity.Epic, 1 / 3.0],
            [Rarity.Legendary, 1 / 7.0],
        ]);
        switch (type) {
            case CampaignType.Normal:
            case CampaignType.Early:
                return normalDropRates.get(rarity) ?? -1;
            case CampaignType.Mirror:
                return mirrorDropRates.get(rarity) ?? -1;
            case CampaignType.Elite:
                return eliteDropRates.get(rarity) ?? -1;
            case CampaignType.Extremis:
                return extremisDropRates.get(rarity) ?? -1;
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
            // For character shards, elite nodes drop 25 shards per 24 pulls. Extermis nodes drop at
            // a rate of 61.54%. All other nodes drop 3 shards per 10 pulls.
            if (type == CampaignType.Extremis) {
                return 6 * Math.ceil(count * 0.6154);
            } else if (type == CampaignType.Elite) {
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

        Object.entries(CampaignsService.campaignsComposed).forEach(([_, battle]) => {
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
        Object.entries(CampaignsService.campaignsComposed).forEach(([_, battle]) => {
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

    /**
     * @param battle The current battle that yields the reward.
     * @returns A random battle in the same campaign, appearing before this
     *          battle, that yields the same reward. Typically this would be
     *          an elite node, and the base node would return the reward.
     */
    public static getBattleFromBaseCampaignWithSameReward(
        battle: ICampaignBattleComposed,
        farmData: FarmData | undefined
    ): ICampaignBattleComposed | undefined {
        if (farmData === undefined) return undefined;
        if (battle.campaignType != CampaignType.Elite) return undefined;
        const baseCampaign = battle.campaign.substring(0, battle.campaign.length - 6);
        let result: ICampaignBattleComposed | undefined = undefined;
        farmData.unfarmableLocations.forEach(x => {
            if (x.campaign == baseCampaign && x.reward == battle.reward) result = x;
        });
        return result;
    }
}
