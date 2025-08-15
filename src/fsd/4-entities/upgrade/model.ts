import { Rarity } from '@/fsd/5-shared/model';

import { ICampaignBattleComposed } from '@/fsd/4-entities/campaign/@x/upgrade';

/**
 * Holds a material and a count of how many of the material are needed.
 */
export interface IUpgradeRecipe {
    id: string;
    count: number;
}

export interface ICraftedUpgrade {
    id: string;
    label: string;
    rarity: Rarity;
    iconPath: string;
    baseUpgrades: IUpgradeRecipe[];
    craftedUpgrades: IUpgradeRecipe[];
    recipe: IUpgradeRecipe[];
    crafted: true;
    stat: string | 'Health' | 'Damage' | 'Armour' | 'Shard';
}

export interface IBaseUpgrade {
    id: string;
    label: string;
    rarity: Rarity;
    iconPath: string;
    locations: ICampaignBattleComposed[];
    crafted: false;
    stat: string | 'Health' | 'Damage' | 'Armour' | 'Shard';
}

export interface IRecipeDataFull {
    [material: string]: IMaterialFull;
}

export interface IMaterialFull {
    id: string;
    snowprintId: string;
    label: string;
    rarity: Rarity;
    craftable: boolean;
    stat: string | 'Health' | 'Damage' | 'Armour' | 'Shard';
    faction?: string; // if not specifor to faction then this property can be omitted ("undefined");
    recipe?: Array<IMaterialRecipeIngredientFull>; // if material is not craftable recipe can be omitted ("undefined")
    allMaterials?: IMaterialRecipeIngredientFull[];
    iconPath: string;
    character?: string;
    priority?: number;
}

export interface IMaterialRecipeIngredientFull {
    id: string;
    snowprintId: string;
    label: string | 'Gold';
    count: number;
    rarity: Rarity;
    stat: string;
    craftable: boolean;
    recipe?: IMaterialRecipeIngredientFull[];
    locations?: Array<string>;
    locationsComposed?: Array<ICampaignBattleComposed>;
    iconPath: string;
    characters: string[];
    priority: number;
}

export interface IMaterialEstimated2 {
    id: string;
    label: string;
    expectedEnergy: number;
    numberOfBattles: number;
    totalEnergy: number;
    dailyEnergy: number;
    locations: ICampaignBattleComposed[];
    possibleLocations: ICampaignBattleComposed[];
    unlockedLocations: string[];
    locationsString: string;
    missingLocationsString: string;
    daysOfBattles: number;
    dailyBattles: number;
    count: number;
    craftedCount: number;
    rarity: Rarity;
    // energyPerBattle: number;
    quantity: number;
    countLeft: number;
    iconPath: string;
    characters: string[];
    priority: number;
    isBlocked: boolean;
}

export interface IRecipeData {
    [material: string]: IMaterial;
}

export interface IMaterial {
    material: string;
    label?: string;
    tacticusId?: string;
    rarity: string;
    craftable: boolean;
    stat: string | 'Health' | 'Damage' | 'Armour' | 'Shard';
    icon?: string;
    faction?: string; // If not specific to a faction, this property can be omitted ("undefined").
    recipe?: Array<IMaterialRecipeIngredient>; // If material is not craftable, recipe can be omitted ("undefined").
    locations?: Array<string>; // Campaign locations can be in short form (IM12) or long (Indomitus mirros) depedings how you decide to update battleData json.
}

export interface IMaterialRecipeIngredient {
    material: string | 'Gold'; // material name;
    count: number;
}

/**
 * Holds the fully-expanded recipe for an upgrade material. One can then
 * reference the necessary IBaseUpgrade objects to get the full details.
 * That is, to say, expandedRecipe contains only uncraftable materials. If
 * this material is already uncraftable, expandedRecipe is empty.
 */
export interface IRecipeExpandedUpgrade {
    id: string;
    label: string;
    rarity: Rarity;
    iconPath: string;
    expandedRecipe: Record<string, number>;
    crafted: boolean;
    stat: string | 'Health' | 'Damage' | 'Armour' | 'Shard';
}

export type IRecipeExpandedUpgradeData = Record<string, IRecipeExpandedUpgrade>;

export type IBaseUpgradeData = Record<string, IBaseUpgrade>;
export type ICraftedUpgradeData = Record<string, ICraftedUpgrade>;
