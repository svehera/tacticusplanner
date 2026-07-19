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

export interface EncounterPosition {
    tierIndex: number;
    setIndex: number;
}

/** Resolves the array position of a tier/set field-value pair (does not assume array index === field value). */
export function findPositionByTierSet(
    config: GuildBossSeasonConfig,
    tier: number,
    set: number
): EncounterPosition | undefined {
    const tierIndex = config.tiers.findIndex(t => t.tier === tier);
    if (tierIndex === -1) return undefined;
    const setIndex = config.tiers[tierIndex].sets.findIndex(s => s.set === set);
    if (setIndex === -1) return undefined;
    return { tierIndex, setIndex };
}

/**
 * Finds the position of a boss encounter by its unitSetId, optionally filtered by rarity
 * (matching `tier.tier === rarity`). Use this instead of `findPositionByTierSet` when the
 * caller has the API `rarity` field (0-5) but not the raw game `tier` field, since the API
 * `tier` field does not match the config's `tier` field.
 */
export function findPositionByBossUnitSetId(
    config: GuildBossSeasonConfig,
    unitSetId: string,
    rarity?: number
): EncounterPosition | undefined {
    for (const [tierIndex, tier] of config.tiers.entries()) {
        if (rarity !== undefined && tier.tier !== rarity) continue;
        for (const [setIndex, set] of tier.sets.entries()) {
            for (const enc of set.encounters) {
                if (enc.guildBossEncounterType === 'Boss' && getUnitSetId(enc.unitId) === unitSetId) {
                    return { tierIndex, setIndex };
                }
            }
        }
    }
    return undefined;
}

/**
 * Like `findPositionByBossUnitSetId`, but matches any encounter type (needed for
 * Primes/Minions, whose `unitId` never has `guildBossEncounterType === 'Boss'`) and
 * filters by the exact 1-based progression index baked into the encounter's own
 * `unitId` suffix, not by rarity — the same rarity can span multiple distinct sets for
 * one boss, so only an exact progression-index match uniquely identifies which specific
 * encounter a given stats row refers to.
 */
export function findPositionByUnitSetId(
    config: GuildBossSeasonConfig,
    unitSetId: string,
    progressionIndex?: number
): EncounterPosition | undefined {
    for (const [tierIndex, tier] of config.tiers.entries()) {
        for (const [setIndex, set] of tier.sets.entries()) {
            for (const enc of set.encounters) {
                if (getUnitSetId(enc.unitId) !== unitSetId) continue;
                if (progressionIndex !== undefined && getProgressionIndexFromUnitId(enc.unitId) !== progressionIndex) {
                    continue;
                }
                return { tierIndex, setIndex };
            }
        }
    }
    return undefined;
}

/**
 * Like `findPositionByUnitSetId`, but filters by rarity (`tier.tier === rarity`) instead
 * of exact progression index, and matches any encounter type (needed for Primes/Minions).
 * Not unique — a boss can occupy multiple sets at the same rarity, so this is a
 * best-effort "closest known" lookup, not a precise one. Used only as a lenient fallback
 * for Prime Modifiers when no exact encounter exists for the selected row.
 */
export function findPositionByUnitSetIdAndRarity(
    config: GuildBossSeasonConfig,
    unitSetId: string,
    rarity?: number
): EncounterPosition | undefined {
    for (const [tierIndex, tier] of config.tiers.entries()) {
        if (rarity !== undefined && tier.tier !== rarity) continue;
        for (const [setIndex, set] of tier.sets.entries()) {
            for (const enc of set.encounters) {
                if (getUnitSetId(enc.unitId) === unitSetId) {
                    return { tierIndex, setIndex };
                }
            }
        }
    }
    return undefined;
}

/** The tier value the Legendary/Mythic boss rotation loops back to once the season's climb is exhausted. */
const LOOP_RESTART_RARITY = Rarity.Legendary;

/**
 * Computes the next encounter position after `current` clears. With no `current` (no clears yet this
 * season), returns the season's first set. Advances within a tier, then across tiers, then loops from
 * the last tier (Mythic) back to the first Legendary set once the season's climb is exhausted.
 */
export function getNextEncounterPosition(
    config: GuildBossSeasonConfig,
    current?: EncounterPosition
): EncounterPosition {
    if (!current) return { tierIndex: 0, setIndex: 0 };

    const tier = config.tiers[current.tierIndex];
    if (current.setIndex + 1 < tier.sets.length) {
        return { tierIndex: current.tierIndex, setIndex: current.setIndex + 1 };
    }
    if (current.tierIndex + 1 < config.tiers.length) {
        return { tierIndex: current.tierIndex + 1, setIndex: 0 };
    }
    const legendaryTierIndex = config.tiers.findIndex(t => t.tier === LOOP_RESTART_RARITY);
    return { tierIndex: legendaryTierIndex === -1 ? 0 : legendaryTierIndex, setIndex: 0 };
}

/** Returns the boss + two primes (`getSetPrimeEncounters`-ordered) at a season-config position. */
export function getEncountersAtPosition(
    config: GuildBossSeasonConfig,
    position: EncounterPosition
): { boss?: GuildBossEncounter; leftPrime?: GuildBossEncounter; rightPrime?: GuildBossEncounter } {
    const encounters = config.tiers[position.tierIndex]?.sets[position.setIndex]?.encounters ?? [];
    const boss = encounters.find(enc => enc.guildBossEncounterType === 'Boss');
    const [leftPrime, rightPrime] = getSetPrimeEncounters(encounters);
    return { boss, leftPrime, rightPrime };
}

/**
 * Best-effort: the first encounter (in season-rotation order) whose unitId matches this unitSetId,
 * optionally filtered to an exact 1-based progression index (the encounter's own `:N` suffix). Not
 * unique — the same boss can appear in multiple season/tier/set slots. `tier`/`set` are array indices
 * into `GuildBossSeasonConfig.tiers`/`GuildBossTier.sets`, matching how callers already index them.
 */
export function findEncounterLocation(unitSetId: string, progressionIndex?: number): EncounterLocation | undefined {
    for (const seasonId of getSeasonIds()) {
        const config = getSeasonConfig(seasonId);
        if (!config) continue;
        const position = findPositionByUnitSetId(config, unitSetId, progressionIndex);
        if (!position) continue;
        const encounters = config.tiers[position.tierIndex]?.sets[position.setIndex]?.encounters ?? [];
        const enc = encounters.find(
            candidate =>
                getUnitSetId(candidate.unitId) === unitSetId &&
                (progressionIndex === undefined || getProgressionIndexFromUnitId(candidate.unitId) === progressionIndex)
        );
        if (!enc) continue;
        return { seasonId, tier: position.tierIndex, set: position.setIndex, encounterIndex: enc.encounterIndex };
    }
    return undefined;
}

/** Rarity-filtered counterpart to `findEncounterLocation` — see `findPositionByUnitSetIdAndRarity`. */
export function findEncounterLocationByRarity(unitSetId: string, rarity?: number): EncounterLocation | undefined {
    for (const seasonId of getSeasonIds()) {
        const config = getSeasonConfig(seasonId);
        if (!config) continue;
        const position = findPositionByUnitSetIdAndRarity(config, unitSetId, rarity);
        if (!position) continue;
        const encounters = config.tiers[position.tierIndex]?.sets[position.setIndex]?.encounters ?? [];
        const enc = encounters.find(candidate => getUnitSetId(candidate.unitId) === unitSetId);
        if (!enc) continue;
        return { seasonId, tier: position.tierIndex, set: position.setIndex, encounterIndex: enc.encounterIndex };
    }
    return undefined;
}

export interface EncounterAvailability {
    rarity: Rarity;
    /** 0-based field value (`GuildBossSet.set`); display as `set + 1` for a 1-based label. */
    set: number;
    /** 1-based progression index (the encounter's own `:N` suffix) — pass `progressionIndex - 1`
     *  to the Progression selector's `setStatIndex` to jump straight to this exact encounter. */
    progressionIndex: number;
}

/** Every distinct (rarity, set) position this unitSetId is known to occupy, across all seasons. */
export function getKnownEncounterAvailability(unitSetId: string): EncounterAvailability[] {
    const seen = new Set<string>();
    const results: EncounterAvailability[] = [];
    for (const seasonId of getSeasonIds()) {
        const config = getSeasonConfig(seasonId);
        if (!config) continue;
        for (const tierEntry of config.tiers) {
            for (const setEntry of tierEntry.sets) {
                const enc = setEntry.encounters.find(candidate => getUnitSetId(candidate.unitId) === unitSetId);
                if (!enc) continue;
                const key = `${tierEntry.tier}:${setEntry.set}`;
                if (seen.has(key)) continue;
                seen.add(key);
                results.push({
                    rarity: tierEntry.tier as Rarity,
                    set: setEntry.set,
                    progressionIndex: getProgressionIndexFromUnitId(enc.unitId),
                });
            }
        }
    }
    return results.toSorted((a, b) => a.rarity - b.rarity || a.set - b.set);
}

/**
 * Highest 1-based progression index among this unit's real known encounters (its own `:N`
 * suffix), for use as a default when no specific encounter is known yet (e.g. the flat
 * catalog). Falls back to the full stats-table length if nothing is known.
 */
export function getMaxKnownProgressionIndex(unitSetId: string): number {
    let max: number | undefined;
    for (const seasonId of getSeasonIds()) {
        const config = getSeasonConfig(seasonId);
        if (!config) continue;
        for (const tierEntry of config.tiers) {
            for (const setEntry of tierEntry.sets) {
                for (const enc of setEntry.encounters) {
                    if (getUnitSetId(enc.unitId) !== unitSetId) continue;
                    const index = getProgressionIndexFromUnitId(enc.unitId);
                    if (max === undefined || index > max) max = index;
                }
            }
        }
    }
    return max ?? guildBossData.unitSets[unitSetId]?.stats.length ?? 1;
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
