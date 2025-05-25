import { Rarity } from '@/fsd/5-shared/model';

import { IMow } from '@/fsd/4-entities/mow';
import { IBaseUpgrade } from '@/fsd/4-entities/upgrade';

export interface IMowLookupInputs {
    mow: IMow | null;
    primaryAbilityStart: number;
    primaryAbilityEnd: number;
    secondaryAbilityStart: number;
    secondaryAbilityEnd: number;
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
