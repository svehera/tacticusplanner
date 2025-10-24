import { Alliance, DynamicProps, Faction, Rarity, RarityStars, RarityString, UnitType } from '@/fsd/5-shared/model';

import { IBaseUpgrade, ICraftedUpgrade } from '@/fsd/4-entities/upgrade/@x/mow';

export interface IMowStatic {
    id: string;
    tacticusId: string;
    name: string;
    title: string;
    shortName: string;
    fullName: string;
    releaseDate?: string;
    alliance: Alliance;
    deployableAlliance: Alliance;
    faction: Faction;
    initialRarity: RarityString;
}

interface IMowStaticAbility {
    name: string;
    recipes: string[][];
}

export interface IMowStatic2 {
    snowprintId: string;
    name: string;
    factionId: string;
    alliance: string;
    icon: string;
    roundIcon: string;
    primaryAbility: IMowStaticAbility;
    secondaryAbility: IMowStaticAbility;
}

interface IMowBadgeCost {
    rarity: string;
    amount: number;
}

interface IMowUpgradeCosts {
    gold: number;
    salvage: number;
    badges: IMowBadgeCost;
    forgeBadges?: IMowBadgeCost;
    components: number;
}

export interface IMowsAndUpgradeCosts {
    mows: IMowStatic2[];
    upgradeCosts: IMowUpgradeCosts[];
}

export interface IMowDb {
    id: string;
    unlocked: boolean;
    rarity: Rarity;
    stars: RarityStars;
    primaryAbilityLevel: number;
    secondaryAbilityLevel: number;
    shards: number;
    mythicShards: number;
}

export interface IMow extends IMowStatic, IMowDb, DynamicProps {
    portraitIcon: string;
    badgeIcon: string;
    unitType: UnitType.mow;
}

export interface IMow2 extends IMowStatic2, IMowDb, DynamicProps {
    unitType: UnitType.mow;
}

export interface IMowLevelMaterials {
    mowId: string;
    mowLabel: string;
    mowAlliance: Alliance;
    level: number;
    components: number;
    gold: number;
    badges: number;
    salvage: number;
    forgeBadges: number;
    rarity: Rarity;
    primaryUpgrades: Array<IBaseUpgrade | ICraftedUpgrade>;
    secondaryUpgrades: Array<IBaseUpgrade | ICraftedUpgrade>;
}
