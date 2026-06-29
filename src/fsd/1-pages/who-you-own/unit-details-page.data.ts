/* eslint-disable import-x/no-internal-modules */

import { getEnumValues } from '@/fsd/5-shared/lib';
import { RarityStars } from '@/fsd/5-shared/model';

import abilityDataJson from '@/fsd/4-entities/abilities/data/new-ability-data.json';
import characterData2Json from '@/fsd/4-entities/character/data/new-character-data2.json';
import { EquipmentService } from '@/fsd/4-entities/equipment';
import type { IEquipment } from '@/fsd/4-entities/equipment';
import mowsData2Json from '@/fsd/4-entities/mow/data/new-mows-data2.json';
import traitsDataJson from '@/fsd/4-entities/traits/data/new-traits-data.json';

export interface AbilityEntry {
    id: string;
    text: { name: string; currentLevelDescription: string; nextLevelDescription: string };
    variables: Record<string, (string | number)[]>;
    constants?: Record<string, string>;
    variablesAffectedByRarityBonus?: string[];
}

export const abilityById = new Map((abilityDataJson as unknown as AbilityEntry[]).map(a => [a.id, a]));

export interface CharEntry {
    id: string;
    movement: number;
    activeAbilityId: string;
    passiveAbilityIds: string;
    traits: string[];
    initialStats: { damage: number; armor: number; health: number };
    meleeAttack: { hitCount: number; damageType: string };
    rangedAttack?: { hitCount: number; damageType: string; range?: number };
}

export const charDataById = new Map(
    (
        characterData2Json as unknown as Array<{
            id: string;
            movement: number;
            activeAbilityId: string;
            passiveAbilityIds: string;
            traits?: string[];
            initialStats: { damage: number; armor: number; health: number };
            meleeAttack: { hitCount: number; pierce: string };
            rangedAttack?: { hitCount: number; pierce: string; range?: number };
        }>
    ).map(c => [
        c.id,
        {
            id: c.id,
            movement: c.movement,
            activeAbilityId: c.activeAbilityId,
            passiveAbilityIds: c.passiveAbilityIds,
            traits: c.traits ?? [],
            initialStats: c.initialStats,
            meleeAttack: { hitCount: c.meleeAttack.hitCount, damageType: c.meleeAttack.pierce },
            rangedAttack: c.rangedAttack
                ? { hitCount: c.rangedAttack.hitCount, damageType: c.rangedAttack.pierce, range: c.rangedAttack.range }
                : undefined,
        } satisfies CharEntry,
    ])
);

export interface MowEntry {
    id: string;
    abilities: string[];
    mythicAbilities: string[];
}

export const mowDataById = new Map((mowsData2Json as unknown as MowEntry[]).map(m => [m.id, m]));

export interface TraitEntry {
    id: string;
    name: string;
    styledName: string;
    description: string;
}

export const traitById = new Map((traitsDataJson as unknown as TraitEntry[]).map(t => [t.id, t]));

export const relicByUnit = new Map<string, IEquipment>();
for (const equipment of EquipmentService.equipmentData) {
    if (equipment.isRelic) {
        for (const unitId of equipment.allowedUnits) {
            relicByUnit.set(unitId, equipment);
        }
    }
}

export const MYTHIC_STAR_VALUES = getEnumValues(RarityStars).filter(
    x => x >= RarityStars.OneBlueStar && x <= RarityStars.MythicWings
);
