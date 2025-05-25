import { Rarity, Faction } from '@/fsd/5-shared/model';

import { EquipmentClass, EquipmentType } from './enums';

/**
 * Information about equipment coming directly from a spreadsheet, with a tiny
 * bit of massaging into JSON. Most of this was gathered by Towen (thanks so
 * much).
 */
export interface IEquipmentRaw {
    /** What kind of equipment this is (e.g. Crit). */
    slot: string;

    /** The class of equipment, e.g. Greaves, VoidBlade. */
    clazz: string;

    /**
     * The ID that SP uses to identify this object. You can use this ID to
     * determine the icon path.
     */
    snowprintId: number;

    /** The in-game name of the item. */
    displayName: string;

    /** The rarity of the item. */
    rarity: string;

    /** For equipment with RNG, the chance (or boost to chance) they provide. */
    chance: number;

    /** The factions that can equip this item. */
    factions: string[];

    /**
     * The primary boost this item gives. For defensive items, this is health.
     * So it's expected that this can be empty (e.g. for greaves).
     *
     * The index represents the level of the item.
     */
    boost1: number[];

    /**
     * The secondary boost this item gives. For defensive items, this is armor.
     * Most items do not yield two boosts, so this is often empty.
     *
     * The index represents the level of the item.
     */
    boost2: number[];
}

/**
 * Similar to IEquipmentRaw, but with the types converted to enums.
 */
export interface IEquipment {
    /** See @IEquipmentRaw.slot. */
    slot: EquipmentType;

    /** See @IEquipmentRaw.clazz. */
    clazz: EquipmentClass;

    /** See @IEquipmentRaw.snowprintId. */
    snowprintId: number;

    /** See @IEquipmentRaw.displayName. */
    displayName: string;

    /** See @IEquipmentRaw.rarity. */
    rarity: Rarity;

    /** See @IEquipmentRaw.chance. */
    chance?: number;

    /** See @IEquipmentRaw.factions. */
    factions: Faction[];

    /** See @IEquipmentRaw.boost1. */
    boost1: number[];

    /** See @IEquipmentRaw.boost2. */
    boost2: number[];
}
