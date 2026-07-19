/* eslint-disable boundaries/element-types */

import { Rank, Rarity, RarityMapper, RarityStars } from '@/fsd/5-shared/model';

import { INpcData, NpcService, INpcStats } from '@/fsd/4-entities/npc';

import type { GuildBossStats, GuildBossUnitSet } from './guild-boss.model';
import {
    clampStatsIndex,
    encounterStatsIndex,
    getUnitDisplayName,
    getUnitSet,
    getUnitSetId,
    isRangedWeapon,
    resolveNpcUnitFullPortraitPath,
} from './guild-boss.service';

const NPC_PREFIX_RE = /^GuildBoss\d+Npc\d+/;

const FACTION_ABBREVIATIONS: Record<string, string> = {
    Tyranids: 'tyran',
    Necrons: 'necro',
    DeathGuard: 'death',
    Orks: 'orks',
    AstraMilitarum: 'astra',
    Aeldari: 'eldar',
    ThousandSons: 'thous',
    AdeptusMechanicus: 'admec',
    Tau: 'tau',
    DarkAngels: 'darka',
};

/** Fallback only — used when a field-enemy unitSetId has no `unitSets`/`questUnitId` entry to resolve through. */
function fuzzyResolveNpc(unitSetId: string, factionId?: string): INpcData | undefined {
    const match = NPC_PREFIX_RE.exec(unitSetId);
    if (!match) return undefined;
    const rest = unitSetId.slice(match[0].length);
    const abbreviation = factionId ? FACTION_ABBREVIATIONS[factionId] : undefined;
    if (!abbreviation) return undefined;
    const fuzzyRe = new RegExp(String.raw`^${abbreviation}Npc\d+${rest}$`, 'i');
    return NpcService.npcDataFull.find(npc => fuzzyRe.test(npc.snowprintId));
}

function mapStats(stats: GuildBossStats): INpcStats {
    return {
        abilityLevel: stats.AbilityLevel,
        damage: stats.Damage,
        armor: stats.FixedArmor,
        health: stats.Health,
        progressionIndex: stats.ProgressionIndex,
        rank: (stats.Rank + 1) as Rank,
        rarityStars: stats.StarLevel as RarityStars,
        critChance: stats.CritChance,
        critDamage: stats.CritDamage,
        blockChance: stats.BlockChance,
        blockDamage: stats.BlockDamage,
    };
}

function toNpcData(unitSetId: string, unitSet: GuildBossUnitSet): INpcData {
    const meleeWeapons = unitSet.weapons?.filter(w => !isRangedWeapon(w)) ?? [];
    const rangedWeapons = unitSet.weapons?.filter(w => isRangedWeapon(w)) ?? [];
    const resolvedNpc = unitSet.questUnitId ? NpcService.getNpcById(unitSet.questUnitId) : undefined;
    const fallbackNpc = resolvedNpc ?? fuzzyResolveNpc(unitSetId, unitSet.FactionId);

    return {
        snowprintId: unitSetId,
        name: fallbackNpc?.name ?? getUnitDisplayName(unitSetId),
        faction: unitSet.FactionId as INpcData['faction'],
        meleeDamage: meleeWeapons[0]?.DamageProfile,
        meleeHits: meleeWeapons[0]?.hits,
        rangeDamage: rangedWeapons[0]?.DamageProfile,
        rangeHits: rangedWeapons[0]?.hits,
        rangeDistance: rangedWeapons[0]?.Range,
        meleeAttacks: meleeWeapons.map(w => ({ damageType: w.DamageProfile, hits: w.hits })),
        rangedAttacks: rangedWeapons.map(w => ({ damageType: w.DamageProfile, hits: w.hits, range: w.Range })),
        movement: unitSet.Movement,
        traits: unitSet.traits ?? [],
        icon: resolveNpcUnitFullPortraitPath(unitSetId) ?? fallbackNpc?.icon ?? '',
        activeAbilities: unitSet.activeAbilities ?? [],
        passiveAbilities: unitSet.passiveAbilities ?? [],
        stats: unitSet.stats.map(stats => mapStats(stats)),
    };
}

/**
 * Resolves a battlefield-enemy raw unitId (e.g. `GuildBoss6Npc5TyranBarbgaunt:4`) into the
 * `INpcData`/`INpcStats` shape the shared NPC-stats popup expects. Stats/traits/weapons come from
 * `guild_boss.json`'s own `unitSets`; `NpcService`/`new-npc-data.json` is consulted only to resolve
 * a display name/icon via `questUnitId` (or, failing that, a fuzzy id match) when the unitSets data
 * itself doesn't already carry one.
 */
export function resolveFieldEnemyNpcData(
    rawEnemyId: string
): { npc: INpcData; stats: INpcStats; rarity: Rarity } | undefined {
    const unitSetId = getUnitSetId(rawEnemyId);
    const unitSet = getUnitSet(rawEnemyId);
    if (!unitSet) return undefined;

    const npc = toNpcData(unitSetId, unitSet);
    const index = clampStatsIndex(unitSet.stats.length, encounterStatsIndex(rawEnemyId));
    const rarity = RarityMapper.stringToRarity(unitSet.stats[index].BaseRarity) ?? Rarity.Common;
    return { npc, stats: npc.stats[index], rarity };
}
