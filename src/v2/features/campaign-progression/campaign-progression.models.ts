import { ICampaignBattleComposed } from 'src/models/interfaces';
import { CampaignType } from 'src/models/enums';

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
    /**
     * If we can farm to reach this goal, that is, at least one
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

    /**
     * If, without this battle, we can farm this material.
     */
    canFarmPrior: boolean = false;

    public constructor(
        battle: ICampaignBattleComposed,
        savings: number,
        cumulativeSavings: number,
        canFarmPrior: boolean
    ) {
        this.battle = battle;
        this.savings = savings;
        this.cumulativeSavings = cumulativeSavings;
        this.canFarmPrior = canFarmPrior;
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

    /**
     * Info about farming each material (or character shard). The key is
     * the upgrade ID, or for a shard, the unit ID.
     */
    materialFarmData: Map<string, FarmData> = new Map<string, FarmData>();

    /**
     * Which characters require which materials to hit their goals.
     * The key is material ID, the array is the set of unit IDs.
     * */
    charactersNeedingMaterials: Map<string, Array<string>> = new Map<string, Array<string>>();
}

/** Holds a list of materials and counts, keyed by upgrade material ID. */
export class MaterialRequirements {
    materials: Record<string, number> = {};
}
