import { IMow2 } from '@/fsd/4-entities/mow';
import { IBaseUpgrade } from '@/fsd/4-entities/upgrade';

export type { IMowMaterialsTotal } from '@/fsd/3-features/goals';

export interface IMowLookupInputs {
    mow: IMow2 | undefined;
    primaryAbilityStart: number;
    primaryAbilityEnd: number;
    secondaryAbilityStart: number;
    secondaryAbilityEnd: number;
}

export interface IMowUpgrade extends IBaseUpgrade {
    requiredTotal: number;
}
