import { IMow } from 'src/v2/features/characters/characters.models';
import { Alliance, Rarity } from 'src/models/enums';
import { IBaseUpgrade, ICraftedUpgrade } from 'src/v2/features/goals/goals.models';

export interface IMowLookupInputs {
    mow: IMow | null;
    primaryAbilityStart: number;
    primaryAbilityEnd: number;
    secondaryAbilityStart: number;
    secondaryAbilityEnd: number;
}

export interface IMowLevelUpgrade {
    lvl: number;
    components: number;
    gold: number;
    badges: number;
    salvage?: number;
    forgeBadges?: number;
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

export interface IMowLevelUpgrades {
    lvl: number;
    primary: string[];
    secondary?: string[];
}

export type IMowLevelUpgradesDic = Record<string, Array<IMowLevelUpgrades>>;
