import { Rarity, Alliance } from '@/fsd/5-shared/model';

import { IMow } from 'src/v2/features/characters/characters.models';
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

export interface IMowMaterialsTotal {
    components: number;
    gold: number;
    badges: Record<Rarity, number>;
    forgeBadges: Record<Rarity, number>;
}

export interface IMowUpgrade extends IBaseUpgrade {
    requiredTotal: number;
}

export type IMowLevelUpgradesDic = Record<string, Array<IMowLevelUpgrades>>;
