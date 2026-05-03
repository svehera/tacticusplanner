import { uniq } from 'lodash';

// eslint-disable-next-line import-x/no-internal-modules
import factions from '@/data/factions.json';

import { FactionId, Rank, Rarity } from '@/fsd/5-shared/model';

import { CampaignsService, CampaignType, ICampaignBattleComposed, ICampaignsProgress } from '@/fsd/4-entities/campaign';
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
import { MowsService } from '@/fsd/4-entities/mow';
import { IRecipeExpandedUpgrade, UpgradesService } from '@/fsd/4-entities/upgrade';

import { ShardsService } from '@/fsd/3-features/goals';

import {
    CampaignsProgressData,
    GoalData,
    CampaignProgressData,
    BattleSavings,
    MaterialRequirements,
    FarmData,
} from './campaign-progression.models';

const imperialFactions = factions.filter(f => f.alliance === 'Imperial');
const chaosFactions = factions.filter(f => f.alliance === 'Chaos');

/** Returns all factions that are allied to the given faction (same alliance, or just itself for Xenos). */
const alliedFactions = (factionId: FactionId) => {
    const faction = factions.find(f => f.snowprintId === factionId);
    if (!faction) throw new Error(`Unknown faction ID: ${factionId}`);
    switch (faction.alliance) {
        case 'Imperial': {
            return imperialFactions;
        }
        case 'Chaos': {
            return chaosFactions;
        }
        case 'Xenos': {
            return [faction];
        }
    }
};

const factionCampaigns = Object.fromEntries(
    factions.map(f => {
        const allies = alliedFactions(f.snowprintId)?.map(a => a.snowprintId) ?? [];
        return [f.snowprintId, CampaignsService.allCampaigns.filter(c => allies.includes(c.faction))];
    })
);

const campaignFactions = Object.fromEntries(CampaignsService.allCampaigns.map(c => [c.id, alliedFactions(c.faction)]));

/** Maps a rarity string to a numeric sort key (higher = rarer). */
const mapRarity = (rarity: Rarity | 'Shard' | 'Mythic Shard'): number => {
    const rarityMap = {
        [Rarity.Common]: 0,
        [Rarity.Uncommon]: 1,
        [Rarity.Rare]: 2,
        [Rarity.Epic]: 3,
        [Rarity.Legendary]: 4,
        [Rarity.Mythic]: 5,
        Shard: 6,
        'Mythic Shard': 7,
    };
    return rarityMap[rarity];
};
/**
 * Static service that analyses campaign progression and computes energy savings
 * for beating uncleared nodes relative to a player's active goals.
 */
export class CampaignsProgressionService {
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
     * @param nodesToBeat The map into which we should store the unbeaten
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
        for (const goal of goals) {
            // Pass empty inventory so raw (pre-inventory) counts are aggregated below.
            const goalData: GoalData = this.computeGoalCost(goal, campaignProgress, {});
            for (const x of goalData.unfarmableLocations) {
                nodesToBeat.get(x.campaign)?.push(x);
            }
            const unit = CharactersService.getUnit(goal.unitId);
            if (!unit) {
                console.error("Couldn't find unit '" + goal.unitId + "'.");
                continue;
            }
            // If this unit can participate in campaigns, add the farm data to the
            // campaign results.
            for (const campaign of factionCampaigns[unit.faction]) {
                if (!result.data.get(campaign.id)) {
                    console.error("no campaign data for '" + campaign.id + "'.");
                    continue;
                }
                result.data.get(campaign.id)?.goalCost.set(goal.goalId, goalData.totalEnergy);
            }

            // Sum up all the materials across all goals (raw counts, no inventory yet).
            for (const [material, data] of goalData.farmData.entries()) {
                if (result.materialFarmData.has(material)) {
                    const existingData = result.materialFarmData.get(material)!;
                    existingData.count += data.count;
                } else {
                    result.materialFarmData.set(material, data);
                }
                if (!result.charactersNeedingMaterials.get(material)) {
                    result.charactersNeedingMaterials.set(material, []);
                }
                result.charactersNeedingMaterials.get(material)?.push(goal.unitId);
            }
        }
        for (const [material, units] of result.charactersNeedingMaterials.entries()) {
            result.charactersNeedingMaterials.set(material, uniq(units.toSorted()));
        }

        // Apply inventory subtraction once against the aggregate counts (not per-goal).
        for (const [material, farmData] of result.materialFarmData.entries()) {
            const remaining = farmData.count - (inventoryUpgrades[material] ?? 0);
            if (remaining <= 0) {
                result.materialFarmData.delete(material);
                continue;
            }
            farmData.count = remaining;
            // Recompute totalEnergy with the adjusted count using the best farmable location.
            if (farmData.canFarm && farmData.farmableLocations.length > 0) {
                let best = Infinity;
                for (const loc of farmData.farmableLocations) {
                    const cost = this.getCostToFarmMaterial(loc, remaining);
                    if (cost < best) best = cost;
                }
                farmData.totalEnergy = best;
            }
        }
    }

    /**
     * @param nodes The nodes to beat, keyed by campaign.
     * @returns The set of nodes to beat, with duplicates removed.
     */
    private static deduplicateNodesToBeat(
        nodes: Map<string, ICampaignBattleComposed[]>
    ): Map<string, ICampaignBattleComposed[]> {
        const returnValue = new Map<string, ICampaignBattleComposed[]>();
        for (const [campaign, battles] of nodes.entries()) {
            const newBattles: ICampaignBattleComposed[] = [];
            const used: Set<number> = new Set<number>();
            for (const battle of battles) {
                if (used.has(battle.nodeNumber)) continue;
                newBattles.push(battle);
                used.add(battle.nodeNumber);
            }
            returnValue.set(campaign, newBattles);
        }
        return returnValue;
    }

    /**
     * For a single campaign, walks its unbeaten nodes in order and records
     * any battle that either unlocks a new material or saves enough energy
     * to be worth suggesting.
     */
    private static computeBattleSavings(
        campaign: string,
        nodes: ICampaignBattleComposed[],
        result: CampaignsProgressData
    ): void {
        const latestEnergyCost = new Map<string, number>();
        // Track materials unlocked within this loop so subsequent nodes switch to savings mode.
        const unlockedMaterials = new Set<string>();
        // For materials that start unfarmable, record the first unlock node's cost as the baseline.
        const firstUnlockEnergy = new Map<string, number>();
        let cumulativeSavings = 0;

        for (const battle of nodes) {
            const reward = this.getReward(battle);
            if (!result.materialFarmData.has(reward)) continue;
            const farmData = result.materialFarmData.get(reward)!;
            const canFarmNow = farmData.canFarm || unlockedMaterials.has(reward);
            const newEnergyCost = this.getCostToFarmMaterial(battle, farmData.count);
            // For materials that started unfarmable but have been unlocked in this loop,
            // use the first unlock node's cost as the energy baseline (farmData.totalEnergy is 0).
            const baseEnergy = farmData.canFarm
                ? farmData.totalEnergy
                : (firstUnlockEnergy.get(reward) ?? newEnergyCost);
            const oldEnergy = latestEnergyCost.get(reward) ?? baseEnergy;
            // Only suggest a node if it saves at least count/2 energy, or if the material is not yet farmable.
            if (!canFarmNow || oldEnergy - farmData.count / 2 > newEnergyCost) {
                const individualSavings = canFarmNow ? baseEnergy - newEnergyCost : 0;
                if (canFarmNow) cumulativeSavings += individualSavings;
                result.data
                    .get(campaign)
                    ?.savings.push(new BattleSavings(battle, individualSavings, cumulativeSavings, canFarmNow));
                latestEnergyCost.set(reward, newEnergyCost);
                if (!canFarmNow) {
                    unlockedMaterials.add(reward);
                    firstUnlockEnergy.set(reward, newEnergyCost);
                }
            }
        }
    }

    /**
     * @returns The ID of the upgrade material (or shards) rewarded when completing this battle.
     */
    public static getReward(battle: ICampaignBattleComposed): string {
        // Elite battles give a guaranteed material, so return that.
        for (const reward of battle.rewards.guaranteed) {
            if (reward.id === 'gold') continue;
            return reward.id;
        }
        // Otherwise, return the first potential reward that is not gold.
        for (const reward of battle.rewards.potential) {
            if (reward.id === 'gold') continue;
            return reward.id;
        }
        return '';
    }

    /**
     * Analyzes all existing goals and campaign progress, and computes, for each
     * campaign, how much each related character goal costs, and how much we would
     * save on all other goals if we were to beat other nodes in the campaign.
     */
    public static computeCampaignsProgress(
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterUnlockGoal | ICharacterAscendGoal>,
        campaignProgress: ICampaignsProgress,
        inventoryUpgrades: Record<string, number> = {}
    ): CampaignsProgressData {
        const result = new CampaignsProgressData();

        // For each campaign, a list of battles to beat that will make
        // our goals cheaper.
        let nodesToBeat = new Map<string, ICampaignBattleComposed[]>();
        // Do some initialization required before
        // calling computeGoalCostsAndUnbeatenNodes.
        for (const campaign of Object.keys(campaignFactions)) {
            nodesToBeat.set(campaign, []);
            result.data.set(campaign, new CampaignProgressData());
        }

        this.computeGoalCostsAndUnbeatenNodes(goals, campaignProgress, inventoryUpgrades, result, nodesToBeat);

        nodesToBeat = this.deduplicateNodesToBeat(nodesToBeat);

        for (const [campaign, nodes] of nodesToBeat) {
            if (nodes.length === 0) continue;
            this.computeBattleSavings(
                campaign,
                nodes.toSorted((a, b) => a.nodeNumber - b.nodeNumber),
                result
            );
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
        materialReqs.materials[material] = (materialReqs.materials[material] ?? 0) + count;
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
        this.gatherMaterialRequirements(goal, materialReqs);
        this.subtractInventory(materialReqs, inventoryUpgrades);

        const result = new GoalData();
        const sortedMaterials = Object.keys(materialReqs.materials).toSorted((a, b) => {
            const rarityA = UpgradesService.recipeExpandedUpgradeData[a]?.rarity;
            const rarityB = UpgradesService.recipeExpandedUpgradeData[b]?.rarity;
            return mapRarity(rarityB ?? 'Shard') - mapRarity(rarityA ?? 'Shard');
        });
        for (const materialId of sortedMaterials) {
            const farmData = this.getCostToFarm(materialId, materialReqs.materials[materialId], campaignProgress);
            result.canFarm = result.canFarm && farmData.canFarm;
            result.totalEnergy += farmData.totalEnergy;
            result.farmData.set(materialId, farmData);
            result.farmableLocations.push(...farmData.farmableLocations);
            result.unfarmableLocations.push(...farmData.unfarmableLocations);
        }
        return result;
    }

    /** Populates `materialReqs` with every base material the goal needs. */
    private static gatherMaterialRequirements(
        goal: ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterUnlockGoal | ICharacterAscendGoal,
        materialReqs: MaterialRequirements
    ): void {
        if (goal.type === PersonalGoalType.Unlock) {
            this.addToMaterials(materialReqs, 'shards_' + goal.unitId, charsUnlockShards[goal.rarity] - goal.shards);
            return;
        }
        if (goal.type === PersonalGoalType.Ascend) {
            const shardsNeeded = ShardsService.getTargetShards(goal) - goal.shards;
            if (shardsNeeded > 0) {
                this.addToMaterials(materialReqs, 'shards_' + goal.unitId, shardsNeeded);
            }
            return;
        }
        const upgradeRanks =
            goal.type === PersonalGoalType.UpgradeRank
                ? CharacterUpgradesService.getCharacterUpgradeRank(goal as ICharacterUpgradeRankGoal)
                : CampaignsProgressionService.getMowUpgradeRank(goal as ICharacterUpgradeMow);

        for (const unitUpgrade of upgradeRanks) {
            for (const upgradeMaterialId of unitUpgrade.upgrades) {
                const expandedRecipe: IRecipeExpandedUpgrade =
                    UpgradesService.recipeExpandedUpgradeData[upgradeMaterialId];
                if (Object.keys(expandedRecipe.expandedRecipe).length === 0) {
                    this.addToMaterials(materialReqs, expandedRecipe.id, 1);
                } else {
                    for (const [material, count] of Object.entries(expandedRecipe.expandedRecipe)) {
                        if (material === 'Gold') continue;
                        this.addToMaterials(materialReqs, material, count);
                    }
                }
            }
        }
    }

    /** Reduces material counts by what is already in inventory, removing fully-covered entries. */
    private static subtractInventory(
        materialReqs: MaterialRequirements,
        inventoryUpgrades: Record<string, number>
    ): void {
        const adjusted: Record<string, number> = {};
        for (const [material, count] of Object.entries(materialReqs.materials)) {
            const remaining = count - (inventoryUpgrades[material] ?? 0);
            if (remaining > 0) adjusted[material] = remaining;
        }
        materialReqs.materials = adjusted;
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
                startRankPoint5: false,
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
     * @param materialId The ID of the material to farm.
     * @param count The number of this material we need.
     * @param campaignProgress Our progress in the campaigns, dictating the nodes from
     *                         which we can farm.
     * @returns The total cost in energy to farm `count` of `material`, as well as the
     *          nodes we can use now, and in the future.
     */
    public static getCostToFarm(materialId: string, count: number, campaignProgress: ICampaignsProgress): FarmData {
        const { farmable, unfarmable } = this.partitionLocations(materialId, campaignProgress);
        const result: FarmData = {
            material: materialId,
            totalEnergy: 0,
            canFarm: farmable.length > 0,
            count,
            campaignType: CampaignType.Normal,
            farmableLocations: farmable,
            unfarmableLocations: unfarmable,
        };
        let bestBattle: ICampaignBattleComposed | undefined = undefined;
        for (const battle of result.farmableLocations) {
            if (!bestBattle) {
                bestBattle = battle;
                result.campaignType = battle.campaignType;
                result.totalEnergy = this.getCostToFarmMaterial(battle, count);
                continue;
            }
            const energyCost = this.getCostToFarmMaterial(battle, count);
            if (energyCost < result.totalEnergy) {
                bestBattle = battle;
                result.campaignType = battle.campaignType;
                result.totalEnergy = energyCost;
            }
        }
        return result;
    }

    /**
     * @param battle The campaign battle to farm.
     * @param count The number of items to farm.
     * @returns The total expected energy cost using the ideal strategy to minimize
     *          energy spent.
     */
    public static getCostToFarmMaterial(battle: ICampaignBattleComposed, count: number): number {
        // The drop rate is calculated in drops per raid, so it doesn't take into account energy.
        // The effective energy cost to farm a single item is energyCost / dropRate.
        return Math.ceil((battle.energyCost * count) / battle.dropRate);
    }

    /**
     * Partitions all battles for `materialId` into farmable (already cleared) and
     * unfarmable (not yet cleared) in a single pass over the campaign data.
     */
    private static partitionLocations(
        materialId: string,
        campaignProgress: ICampaignsProgress
    ): { farmable: ICampaignBattleComposed[]; unfarmable: ICampaignBattleComposed[] } {
        const farmable: ICampaignBattleComposed[] = [];
        const unfarmable: ICampaignBattleComposed[] = [];
        for (const battle of Object.values(CampaignsService.campaignsComposed)) {
            if (this.getReward(battle) !== materialId) continue;
            if (CampaignsService.hasCompletedBattle(battle, campaignProgress)) {
                farmable.push(battle);
            } else {
                unfarmable.push(battle);
            }
        }
        return { farmable, unfarmable };
    }

    /**
     * @returns All battles for `materialId` that the player has already cleared
     *          and can therefore farm.
     */
    public static getFarmableLocations(
        materialId: string,
        campaignProgress: ICampaignsProgress
    ): ICampaignBattleComposed[] {
        return this.partitionLocations(materialId, campaignProgress).farmable;
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
        materialId: string,
        campaignProgress: ICampaignsProgress
    ): ICampaignBattleComposed[] {
        return this.partitionLocations(materialId, campaignProgress).unfarmable;
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
        const baseCampaign = battle.campaign.slice(0, Math.max(0, battle.campaign.length - 6));
        let result: ICampaignBattleComposed | undefined = undefined;
        for (const x of farmData.unfarmableLocations) {
            if (x.campaign == baseCampaign && this.getReward(x) == this.getReward(battle)) result = x;
        }
        return result;
    }
}
