/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { Rarity } from '@/fsd/5-shared/model';

import { CharactersService } from '@/fsd/4-entities/character/characters.service';
import { NpcService } from '@/fsd/4-entities/npc/npc-service';

import guildBossRaw from './data/guild_boss.json';
import { npcUnitRoundIconMap, unitRoundIconMap } from './guild-boss-portraits';
import type {
    GuildBossData,
    GuildBossEncounter,
    GuildBossSeasonConfig,
    GuildBossStats,
    GuildBossUnitSet,
    GuildBossWeapon,
} from './guild-boss.model';

export const guildBossData = guildBossRaw as unknown as GuildBossData;

export function getSeasonIds(): string[] {
    return guildBossData.guildBossSeasonConfigRotation;
}

export function getSeasonConfig(seasonId: string): GuildBossSeasonConfig | undefined {
    return guildBossData.guildBossSeasonDataConfigsGDTO[seasonId];
}

/** Tiers in descending rarity order (highest tier first), for display. */
export function getSortedTiers(config: GuildBossSeasonConfig): GuildBossSeasonConfig['tiers'] {
    return config.tiers.toSorted((a, b) => b.tier - a.tier);
}

/** Strips the `:N` suffix to get the key used in unitSets. */
export function getUnitSetId(rawUnitId: string): string {
    const colonIndex = rawUnitId.lastIndexOf(':');
    return colonIndex === -1 ? rawUnitId : rawUnitId.slice(0, colonIndex);
}

/** Extracts the 1-based stats array index from the `:N` suffix. Returns 1 if absent. */
export function getProgressionIndexFromUnitId(rawUnitId: string): number {
    const colonIndex = rawUnitId.lastIndexOf(':');
    if (colonIndex === -1) return 1;
    const n = Number(rawUnitId.slice(colonIndex + 1));
    return Number.isNaN(n) ? 1 : n;
}

export function getUnitSet(rawUnitId: string): GuildBossUnitSet | undefined {
    return guildBossData.unitSets[getUnitSetId(rawUnitId)];
}

/** Clamps `index` into the valid `[0, length - 1]` range for a non-empty array. */
export function clampStatsIndex(length: number, index: number): number {
    return Math.max(0, Math.min(index, length - 1));
}

/** Returns the stats entry at the given 0-based array index, clamped to valid range. */
export function getStatsAtIndex(unitSet: GuildBossUnitSet, index: number): GuildBossStats {
    if (unitSet.stats.length === 0) throw new Error('Unit set has no stats entries');
    return unitSet.stats[clampStatsIndex(unitSet.stats.length, index)];
}

/** The `:N` suffix in encounter unitIds is 1-based. This converts to a 0-based array index. */
export function encounterStatsIndex(rawUnitId: string): number {
    return getProgressionIndexFromUnitId(rawUnitId) - 1;
}

export function getTierRarity(tier: number): Rarity {
    return tier as Rarity;
}

export function isRangedWeapon(weapon: GuildBossWeapon): boolean {
    return weapon.Range !== undefined;
}

/** Converts camelCase ability/trait names to space-separated words. */
export function formatAbilityName(name: string): string {
    return name.replaceAll(/([a-z])([A-Z])/g, '$1 $2').replaceAll(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

export function getFieldEnemies(encounter: GuildBossEncounter): string[] {
    if (encounter.enemies && encounter.enemies.length > 0) return encounter.enemies;
    return [];
}

/** Returns the set's two prime (`Crystal`) encounters, ordered left-to-right by `encounterIndex`. */
export function getSetPrimeEncounters(encounters: GuildBossEncounter[]): GuildBossEncounter[] {
    return encounters
        .filter(enc => enc.guildBossEncounterType === 'Crystal')
        .toSorted((a, b) => a.encounterIndex - b.encounterIndex);
}

export interface EncounterLocation {
    seasonId: string;
    tier: number;
    set: number;
    encounterIndex: number;
}

/**
 * Best-effort: the first encounter (in season-rotation order) whose unitId matches this unitSetId.
 * Not unique — the same boss can appear in multiple season/tier/set slots. `tier`/`set` are array
 * indices into `GuildBossSeasonConfig.tiers`/`GuildBossTier.sets`, matching how callers already index them.
 */
export function findEncounterLocation(unitSetId: string): EncounterLocation | undefined {
    for (const seasonId of getSeasonIds()) {
        const config = guildBossData.guildBossSeasonDataConfigsGDTO[seasonId];
        if (!config) continue;
        for (const [tier, tierEntry] of config.tiers.entries()) {
            for (const [set, setEntry] of tierEntry.sets.entries()) {
                for (const enc of setEntry.encounters) {
                    if (getUnitSetId(enc.unitId) === unitSetId) {
                        return { seasonId, tier, set, encounterIndex: enc.encounterIndex };
                    }
                }
            }
        }
    }
    return undefined;
}

const PRIME_ID_RE = /(?:MiniBoss|Minion)\d+(.+)/;

export function resolvePrimePortraitPath(unitSetId: string): string | undefined {
    if (unitRoundIconMap[unitSetId]) return unitRoundIconMap[unitSetId];
    const match = PRIME_ID_RE.exec(unitSetId);
    if (!match) return undefined;
    const characterId = match[1].charAt(0).toLowerCase() + match[1].slice(1);
    return CharactersService.getUnit(characterId)?.roundIcon;
}

export function resolvePrimeRegularPortraitPath(unitSetId: string, questUnitId?: string): string | undefined {
    const match = PRIME_ID_RE.exec(unitSetId);
    if (match) {
        const characterId = match[1].charAt(0).toLowerCase() + match[1].slice(1);
        const charIcon = CharactersService.getUnit(characterId)?.icon;
        if (charIcon) return charIcon;
    }
    if (questUnitId) {
        const npcIcon = NpcService.getNpcById(questUnitId)?.icon;
        if (npcIcon) return npcIcon;
    }
    return undefined;
}

export function resolveNpcUnitPortraitPath(unitSetId: string): string | undefined {
    if (npcUnitRoundIconMap[unitSetId]) return npcUnitRoundIconMap[unitSetId];
    const questUnitId = guildBossData.unitSets[unitSetId]?.questUnitId;
    if (!questUnitId) return undefined;
    return NpcService.getNpcById(questUnitId)?.icon;
}

/** Same resolution as `resolveNpcUnitPortraitPath`, but never substitutes a small round icon — for
 *  full-portrait use cases (e.g. a battlefield-enemy card), where a round icon would look wrong. */
export function resolveNpcUnitFullPortraitPath(unitSetId: string): string | undefined {
    const questUnitId = guildBossData.unitSets[unitSetId]?.questUnitId;
    if (!questUnitId) return undefined;
    return NpcService.getNpcById(questUnitId)?.icon;
}

export function resolvePrimeDisplayName(unitSetId: string): string | undefined {
    const match = PRIME_ID_RE.exec(unitSetId);
    if (!match) return undefined;
    const characterId = match[1].charAt(0).toLowerCase() + match[1].slice(1);
    return CharactersService.getUnit(characterId)?.shortName;
}

const BOSS_SET_RE = /^GuildBoss(\d+)Boss/;
const PRIME_SET_RE = /^GuildBoss(\d+)(?:MiniBoss|Minion)(\d+)/;

export function getBossUnitSetIds(): string[] {
    return Object.keys(guildBossData.unitSets)
        .filter(id => BOSS_SET_RE.test(id))
        .toSorted((a, b) => Number(BOSS_SET_RE.exec(a)![1]) - Number(BOSS_SET_RE.exec(b)![1]));
}

export function getPrimeUnitSetIds(): string[] {
    return Object.keys(guildBossData.unitSets)
        .filter(id => PRIME_SET_RE.test(id))
        .toSorted((a, b) => {
            const ma = PRIME_SET_RE.exec(a)!;
            const mb = PRIME_SET_RE.exec(b)!;
            const tierDiff = Number(ma[1]) - Number(mb[1]);
            return tierDiff === 0 ? Number(ma[2]) - Number(mb[2]) : tierDiff;
        });
}

const FACTION_PREFIXES = ['Tyran', 'Necro', 'Death', 'Orks', 'Astra', 'Eldar', 'Thous', 'Admec', 'Tau', 'Darka'];
const UNIT_TYPE_RE = /^GuildBoss\d+(?:Boss|MiniBoss|Minion|Npc|LootObj)\d*/;

/** Extracts a human-readable display name from a unitSetId. */
export function getUnitDisplayName(unitSetId: string): string {
    const withoutPrefix = unitSetId.replace(UNIT_TYPE_RE, '');
    let name = withoutPrefix;
    for (const faction of FACTION_PREFIXES) {
        if (name.startsWith(faction)) {
            name = name.slice(faction.length);
            break;
        }
    }
    return formatAbilityName(name || unitSetId);
}
