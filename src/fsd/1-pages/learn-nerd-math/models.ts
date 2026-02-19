/* eslint-disable import-x/no-internal-modules */
import { Rank, Rarity } from '@/fsd/5-shared/model';

import { IEquipment } from '@/fsd/4-entities/equipment';

import { IUnit } from '@/fsd/3-features/characters/characters.models';

export enum SimulationType {
    MAX_DAMAGE = 'MAX_DAMAGE',
    MIN_DAMAGE = 'MIN_DAMAGE',
    SIMULATED_DAMAGE = 'SIMULATED_DAMAGE',
}

export interface UnitAdjustments {
    defenderOnRazorWire: boolean;
    attackerOnHighGround: boolean;
}

export interface DamageCalculationInput {
    baseMinDamage: number;
    baseMaxDamage: number;
    pierceRatio: number;
    numHits: number;
    critChance: number;
    critDamage: number;
    defenderArmor: number;
    blockChance: number;
    blockDamage: number;
    adjustments: UnitAdjustments;
    simulationType: SimulationType;
}

export interface Attacker {
    unit: IUnit | null; /** The SP id of the unit. */
    rarity: Rarity;
    rank: Rank;
    equipment: Array<IEquipment | null>; /** The SP id of the equiment. */
    equipmentLevels: number[]; /** Each level is 1 based. */
    activeLevel: number; /** The level of the active ability, 1-based. */
    passiveLevel: number; /** The level of the passive ability, 1-based. */
}
