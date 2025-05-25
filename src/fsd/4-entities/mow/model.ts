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

export interface IMowDb {
    id: string;
    unlocked: boolean;
    rarity: Rarity;
    stars: RarityStars;
    primaryAbilityLevel: number;
    secondaryAbilityLevel: number;
    shards: number;
}

export interface IMow extends IMowStatic, IMowDb, DynamicProps {
    portraitIcon: string;
    badgeIcon: string;
    unitType: UnitType.mow;
}

export interface IMowLevelUpgrade {
    lvl: number;
    components: number;
    gold: number;
    badges: number;
    salvage?: number;
    forgeBadges?: number;
}

export interface IMowLevelUpgrades {
    lvl: number;
    primary: string[];
    secondary?: string[];
}

export type IMowLevelUpgradesDictionary = Record<string, Array<IMowLevelUpgrades>>;

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
