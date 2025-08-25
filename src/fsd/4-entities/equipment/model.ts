import { Rarity, Faction } from '@/fsd/5-shared/model';

/** Stats about an equipment. */
export interface IEquipmentStats {
    blockChance?: number;
    blockDamage?: number;
    /** Used by booster items. */
    blockChanceBonus?: number;
    /** Used by booster items. */
    blockDamageBonus?: number;
    critChance?: number;
    critDamage?: number;
    /** Used by booster items. */
    critChanceBonus?: number;
    /** Used by booster items. */
    critDamageBonus?: number;
    armor?: number;
    hp?: number;
}

/**
 * Information about the level of equipment (e.g. the 9 when you say epic 9 knife). This
 * tells you how much it costs to get here from the previous level by forging (or
 * ascending).
 */
export interface IEquipmentLevel {
    goldCost: number;
    salvageCost: number;
    mythicSalvageCost: number;
    stats: IEquipmentStats;
}

/**
 * Information about equipment coming directly from a spreadsheet, with a tiny
 * bit of massaging into JSON. Most of this was gathered by Towen (thanks so
 * much).
 */
export interface IEquipmentStatic {
    /** The in-game, human-readable name of the item. */
    name: string;

    /** The rarity of the item (e.g. epic). */
    rarity: string;

    /** The type of the item (e.g. I_Crit). */
    type: string;

    /** The ability of the relic. Empty string if none. */
    abilityId: string;

    /** True if this is a relic, shared or not. */
    isRelic: boolean;

    /** True if this is a relic unique to one character. */
    isUniqueRelic: boolean;

    /**
     * The units allowed to equip this item. If this is empty, consult
     * allowedFactions.
     */
    allowedUnits: string[];

    /**
     * Which factions can equip this item. You also need to check the equipment
     * slot types of each character in the faction to determine who can use it.
     */
    allowedFactions: string[];

    /** The stats and cost of the equipment at various levels. */
    levels: IEquipmentLevel[];
}

export interface IEquipment {
    id: string;
    name: string;
    rarity: Rarity;
    type: string;
    abilityId: string;
    isRelic: boolean;
    isUniqueRelic: boolean;
    /** The snowprint IDs of all characters that can equip this item. */
    allowedUnits: string[];
    levels: IEquipmentLevel[];
    icon: string;
}
