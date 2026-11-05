/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import abilityDataJson from '@/fsd/4-entities/abilities/data/new-ability-data.json';

import { INpcData } from './model';

export interface AbilityEntry {
    id: string;
    text: { name: string; currentLevelDescription: string; nextLevelDescription: string };
    variables: Record<string, (string | number)[]>;
    constants?: Record<string, string>;
}

const abilityById = new Map((abilityDataJson as unknown as AbilityEntry[]).map(a => [a.id, a]));

export interface NpcAbilityEntry {
    kind: 'Active' | 'Passive';
    id: string;
    ability: AbilityEntry | undefined;
}

/** @returns the NPC's active abilities followed by its passive ones, each joined with its ability data when known. */
export function getNpcAbilityEntries(npc: INpcData): NpcAbilityEntry[] {
    return [
        ...npc.activeAbilities.map(id => ({ kind: 'Active' as const, id, ability: abilityById.get(id) })),
        ...npc.passiveAbilities.map(id => ({ kind: 'Passive' as const, id, ability: abilityById.get(id) })),
    ];
}
