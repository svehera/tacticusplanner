import { Alliance, Faction } from '@/fsd/5-shared/model';

export interface INpcData {
    name: string;
    faction: Faction;
    alliance: Alliance;
    movement: number;
    meleeHits: number;
    meleeType: string;
    rangeHits?: number;
    rangeType?: string;
    range?: number;
    health: number;
    damage: number;
    armor: number;
    critChance?: number;
    critDamage?: number;
    blockChance?: number;
    blockDamage?: number;
    traits: string[];
    activeAbilities: string[];
    passiveAbilities: string[];
}

interface INpcDataRaw {
    name: string;
    faction: string;
    alliance: string;
    movement: number;
    meleeHits: number;
    meleeType: string;
    rangeHits?: number;
    rangeType?: string;
    range?: number;
    health: number;
    damage: number;
    armor: number;
    critChance?: number;
    critDamage?: number;
    blockChance?: number;
    blockDamage?: number;
    traits: string[];
    activeAbilities: string[];
    passiveAbilities: string[];
}

export interface INpcsRaw {
    npcs: INpcDataRaw[];
}
