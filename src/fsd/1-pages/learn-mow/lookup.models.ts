import { Rarity } from '@/fsd/5-shared/model';

import { IMow2 } from '@/fsd/4-entities/mow';
import { IBaseUpgrade } from '@/fsd/4-entities/upgrade';

export interface IMowLookupInputs {
    mow: IMow2 | null;
    primaryAbilityStart: number;
    primaryAbilityEnd: number;
    secondaryAbilityStart: number;
    secondaryAbilityEnd: number;
}

export interface IMowMaterialsTotal {
    components: number;
    salvage: number;
    gold: number;
    badges: Map<Rarity, number>;
    forgeBadges: Map<Rarity, number>;
}

export interface IMowUpgrade extends IBaseUpgrade {
    requiredTotal: number;
}
