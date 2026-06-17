/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { obfuscateUserId } from '@/fsd/5-shared/lib';
import {
    TacticusDamageType,
    TacticusEncounterType,
    type GuildSeasonSummary,
    type TacticusGuildRaidEntry,
    type TacticusGuildRaidResponse,
} from '@/fsd/5-shared/lib/tacticus-api';
import { Rarity, RarityMapper } from '@/fsd/5-shared/model';

import { type GuildSeasonPerformanceIndex } from '../guild-performance.api';
import { computeDefaultRarities, getBossOrder, getBossPrefix } from '../guild-performance.utils';

export interface FilterOptions {
    selectedRarities: Set<Rarity>;
    selectedBossPrefixes: Set<string>;
    /** Selection at the unitId level so each individual prime is independently togglable. */
    selectedPrimeUnitIds: Set<string>;
}

function isMainBoss(entry: TacticusGuildRaidEntry): boolean {
    return entry.encounterType === TacticusEncounterType.Boss;
}

/**
 * Applies all performance-tab filters: non-bomb, in selected rarities, in
 * selected boss/prime prefix sets. Kill blows are always included here — the
 * view builders apply `excludeKills` only to the average calculation, since the
 * max stat is meant to reflect the highest-ever damage (often a killing blow).
 */
export function filterPerformanceEntries(
    entries: TacticusGuildRaidEntry[],
    options: FilterOptions
): TacticusGuildRaidEntry[] {
    return entries.filter(entry => {
        if (entry.damageType === TacticusDamageType.Bomb) return false;
        if (!options.selectedRarities.has(entry.rarity)) return false;
        if (isMainBoss(entry)) {
            return options.selectedBossPrefixes.has(getBossPrefix(entry.unitId));
        }
        return options.selectedPrimeUnitIds.has(entry.unitId);
    });
}

/** Unique boss prefixes (main boss only) present in `entries` at the selected rarities,
 *  sorted ascending by (rarity, set) of each family's earliest occurrence within the selected rarities. */
export function getAvailableBossPrefixes(entries: TacticusGuildRaidEntry[], rarities: Set<Rarity>): string[] {
    const firstOccurrence = new Map<string, { rarity: Rarity; set: number }>();
    for (const entry of entries) {
        if (!rarities.has(entry.rarity)) continue;
        if (!isMainBoss(entry)) continue;
        const prefix = getBossPrefix(entry.unitId);
        const current = firstOccurrence.get(prefix);
        if (
            current === undefined ||
            entry.rarity < current.rarity ||
            (entry.rarity === current.rarity && entry.set < current.set)
        ) {
            firstOccurrence.set(prefix, { rarity: entry.rarity, set: entry.set });
        }
    }
    return [...firstOccurrence.entries()]
        .toSorted(([, a], [, b]) => {
            if (a.rarity !== b.rarity) return a.rarity - b.rarity;
            return a.set - b.set;
        })
        .map(([prefix]) => prefix);
}

/** Unique prime unitIds present in `entries` at the selected rarities, sorted ascending
 *  by (rarity, set, encounterIndex) of each unitId's first occurrence. */
export function getAvailablePrimeUnitIds(entries: TacticusGuildRaidEntry[], rarities: Set<Rarity>): string[] {
    const firstOccurrence = new Map<string, { rarity: Rarity; set: number; encounterIndex: number }>();
    for (const entry of entries) {
        if (!rarities.has(entry.rarity)) continue;
        if (isMainBoss(entry)) continue;
        if (firstOccurrence.has(entry.unitId)) continue;
        firstOccurrence.set(entry.unitId, {
            rarity: entry.rarity,
            set: entry.set,
            encounterIndex: entry.encounterIndex,
        });
    }
    return [...firstOccurrence.entries()]
        .toSorted(([, a], [, b]) => {
            if (a.rarity !== b.rarity) return a.rarity - b.rarity;
            if (a.set !== b.set) return a.set - b.set;
            return a.encounterIndex - b.encounterIndex;
        })
        .map(([unitId]) => unitId);
}

// ---------------------------------------------------------------------------
// Aggregate helpers
// ---------------------------------------------------------------------------

function aggregate(damages: number[]): { sum: number; count: number; avg: number; max: number } {
    let sum = 0;
    let max = 0;
    for (const value of damages) {
        sum += value;
        if (value > max) max = value;
    }
    const count = damages.length;
    return { sum, count, avg: count > 0 ? sum / count : 0, max };
}

// ---------------------------------------------------------------------------
// Guild-wide view (all players): per-player rows compared against the guild mean
// ---------------------------------------------------------------------------

export interface PlayerRow {
    userId: string;
    displayName: string;
    avg: number;
    max: number;
    /** Total non-bomb damage for this player on the filtered set (respects excludeKills). */
    total: number;
    /** Average of (hit / guildAvgForThatUnit) across this player's hits. 1.0 = matches guild. */
    performanceIndex: number;
    /** Sum of (hit / guildAvgForThatUnit) — "N guild-average hits' worth" contributed. */
    equivalentHits: number;
    /** (player.avg - guild.avg) / guild.avg, as a percentage. */
    avgDiffPct: number;
    /** (player.max - guild.max) / guild.max, as a percentage. */
    maxDiffPct: number;
    /** (player.total - fairShare) / fairShare, where fairShare = guildTotal / activePlayers. */
    totalDiffPct: number;
    /** (performanceIndex - 1) × 100. */
    performanceDiffPct: number;
    /** (equivalentHits - fairShareHits) / fairShareHits × 100. */
    equivalentDiffPct: number;
}

export interface PlayerBossUnit {
    unitKey: string;
    unitId: string;
    rarity: Rarity;
    set: number;
    encounterIndex: number;
    isBoss: boolean;
    playerAvg: number;
    guildAvg: number;
    /** playerAvg / guildAvg for that unit. 0 when the player has no hits. */
    ratio: number;
    /** Number of non-bomb hits this player has against this unit (respects excludeKills). */
    hits: number;
}

export interface PlayerBossBreakdown {
    userId: string;
    displayName: string;
    /** Units sorted by ratio descending (green → yellow → red). */
    units: PlayerBossUnit[];
}

export interface GuildViewData {
    rows: PlayerRow[];
    guildAvg: number;
    guildMax: number;
    /** Sum of all filtered damages (respects excludeKills). */
    guildTotal: number;
    /** guildTotal / number of players who hit at least once (respects excludeKills). */
    fairShare: number;
    /** Total non-bomb hits in the filtered set (respects excludeKills). */
    totalHits: number;
    /** totalHits / activePlayers — the per-player "fair share" measured in guild-average hits. */
    fairShareHits: number;
}

function notKill(entry: TacticusGuildRaidEntry): boolean {
    return entry.remainingHp !== 0;
}

export function buildGuildView(
    filteredEntries: TacticusGuildRaidEntry[],
    names: Map<string, string>,
    excludeKills: boolean
): GuildViewData {
    if (filteredEntries.length === 0) {
        return {
            rows: [],
            guildAvg: 0,
            guildMax: 0,
            guildTotal: 0,
            fairShare: 0,
            totalHits: 0,
            fairShareHits: 0,
        };
    }

    // max always uses the full set (kills included); avg & total may exclude kills
    const avgSource = excludeKills ? filteredEntries.filter(entry => notKill(entry)) : filteredEntries;
    const guildAvgStats = aggregate(avgSource.map(entry => entry.damageDealt));
    const guildMaxStats = aggregate(filteredEntries.map(entry => entry.damageDealt));

    // Per-unit guild average — used to normalise each hit by the difficulty of that boss/prime.
    const unitAggregates = new Map<string, { sum: number; count: number }>();
    for (const entry of avgSource) {
        const key = `${entry.unitId}:${entry.rarity}`;
        let agg = unitAggregates.get(key);
        if (agg === undefined) {
            agg = { sum: 0, count: 0 };
            unitAggregates.set(key, agg);
        }
        agg.sum += entry.damageDealt;
        agg.count++;
    }
    const guildAvgByUnit = new Map<string, number>();
    for (const [key, { sum, count }] of unitAggregates) {
        guildAvgByUnit.set(key, count > 0 ? sum / count : 0);
    }

    const byPlayerAvg = new Map<string, number[]>();
    const byPlayerRatios = new Map<string, number[]>();
    for (const entry of avgSource) {
        let damages = byPlayerAvg.get(entry.userId);
        if (damages === undefined) {
            damages = [];
            byPlayerAvg.set(entry.userId, damages);
        }
        damages.push(entry.damageDealt);

        const unitAvg = guildAvgByUnit.get(`${entry.unitId}:${entry.rarity}`) ?? 0;
        if (unitAvg > 0) {
            let ratios = byPlayerRatios.get(entry.userId);
            if (ratios === undefined) {
                ratios = [];
                byPlayerRatios.set(entry.userId, ratios);
            }
            ratios.push(entry.damageDealt / unitAvg);
        }
    }
    const byPlayerMax = new Map<string, number[]>();
    for (const entry of filteredEntries) {
        let damages = byPlayerMax.get(entry.userId);
        if (damages === undefined) {
            damages = [];
            byPlayerMax.set(entry.userId, damages);
        }
        damages.push(entry.damageDealt);
    }

    const guildTotal = guildAvgStats.sum;
    const activePlayers = byPlayerAvg.size;
    const fairShare = activePlayers > 0 ? guildTotal / activePlayers : 0;
    const totalHits = avgSource.length;
    const fairShareHits = activePlayers > 0 ? totalHits / activePlayers : 0;

    const allUserIds = new Set([...byPlayerAvg.keys(), ...byPlayerMax.keys()]);
    const rows: PlayerRow[] = [];
    for (const userId of allUserIds) {
        const avgStats = aggregate(byPlayerAvg.get(userId) ?? []);
        const maxStats = aggregate(byPlayerMax.get(userId) ?? []);
        const ratios = byPlayerRatios.get(userId) ?? [];
        const ratioSum = ratios.reduce((sum, ratio) => sum + ratio, 0);
        const performanceIndex = ratios.length > 0 ? ratioSum / ratios.length : 0;
        const equivalentHits = ratioSum;
        rows.push({
            userId,
            displayName: names.get(userId) ?? obfuscateUserId(userId),
            avg: avgStats.avg,
            max: maxStats.max,
            total: avgStats.sum,
            performanceIndex,
            equivalentHits,
            avgDiffPct: guildAvgStats.avg > 0 ? ((avgStats.avg - guildAvgStats.avg) / guildAvgStats.avg) * 100 : 0,
            maxDiffPct: guildMaxStats.max > 0 ? ((maxStats.max - guildMaxStats.max) / guildMaxStats.max) * 100 : 0,
            totalDiffPct: fairShare > 0 ? ((avgStats.sum - fairShare) / fairShare) * 100 : 0,
            performanceDiffPct: ratios.length > 0 ? (performanceIndex - 1) * 100 : 0,
            equivalentDiffPct: fairShareHits > 0 ? ((equivalentHits - fairShareHits) / fairShareHits) * 100 : 0,
        });
    }

    return {
        rows,
        guildAvg: guildAvgStats.avg,
        guildMax: guildMaxStats.max,
        guildTotal,
        fairShare,
        totalHits,
        fairShareHits,
    };
}

/**
 * The full-guild Performance Index value for a single player in one season (bosses only, excluding
 * kills) — each non-kill boss hit ÷ that boss's guild non-kill average, meaned. Returns undefined
 * when the player logged no non-kill boss hits that season. Matches {@link buildGuildPerformanceIndexRows}.
 */
export function playerPerformanceIndex(summary: GuildSeasonSummary, playerId: string): number | undefined {
    const ratios: number[] = [];
    for (const entry of summary.bossPerformance) {
        if (entry.enemyInfo.encounterIndex !== 0) continue; // bosses only
        const guildAvg = entry.guildAverageDamageWithoutKills;
        if (guildAvg <= 0) continue;
        const player = entry.playerEntries.find(candidate => candidate.playerId === playerId);
        if (player === undefined) continue;
        for (const hit of player.nonKillHits) ratios.push(hit / guildAvg);
    }
    if (ratios.length === 0) return undefined;
    return ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;
}

export interface PerformanceIndexSeasonPoint {
    season: number;
    performanceIndex: number;
}

export interface PlayerPerformanceLine {
    /** Stable series id — the player's userId. */
    userId: string;
    displayName: string;
    points: PerformanceIndexSeasonPoint[];
}

/**
 * One Performance Index line per player across all history, for the multi-line chart. Players with
 * no chartable points are omitted. Sorted by display name.
 */
export function buildAllPlayersPerformanceLines(
    seasonData: GuildSeasonSummary[],
    names: Map<string, string>
): PlayerPerformanceLine[] {
    return getHistoricalPerformancePlayers(seasonData, names)
        .map(player => ({
            userId: player.userId,
            displayName: player.displayName,
            points: buildPlayerPerformanceIndexSeries(seasonData, player.userId),
        }))
        .filter(line => line.points.length > 0);
}

/**
 * Players who have at least one chartable Performance Index point across history — i.e. a non-kill
 * boss hit in some season. Sorted by display name.
 */
export function getHistoricalPerformancePlayers(
    seasonData: GuildSeasonSummary[],
    names: Map<string, string>
): { userId: string; displayName: string }[] {
    const seen = new Map<string, string>();
    for (const summary of seasonData) {
        for (const entry of summary.bossPerformance) {
            if (entry.enemyInfo.encounterIndex !== 0) continue; // bosses only
            for (const player of entry.playerEntries) {
                // Anonymized rows (no id) can't be attributed to an individual, so they're skipped.
                if (player.playerId === undefined) continue;
                if (player.nonKillHits.length > 0 && !seen.has(player.playerId)) {
                    seen.set(player.playerId, names.get(player.playerId) ?? obfuscateUserId(player.playerId));
                }
            }
        }
    }
    return [...seen.entries()]
        .map(([userId, displayName]) => ({ userId, displayName }))
        .toSorted((a, b) => a.displayName.localeCompare(b.displayName));
}

/**
 * The selected player's per-season Performance Index across all history, ascending by season.
 * Seasons the player didn't participate in (no non-kill boss hits) are omitted.
 */
export function buildPlayerPerformanceIndexSeries(
    seasonData: GuildSeasonSummary[],
    playerId: string
): PerformanceIndexSeasonPoint[] {
    const points: PerformanceIndexSeasonPoint[] = [];
    for (const summary of seasonData) {
        const performanceIndex = playerPerformanceIndex(summary, playerId);
        if (performanceIndex !== undefined) points.push({ season: summary.season, performanceIndex });
    }
    return points.toSorted((a, b) => a.season - b.season);
}

/**
 * Builds the full-guild Performance Index rows for a historical season, reconstructed from the
 * aggregate's raw per-player boss hit arrays (`bossPerformance`). This reproduces the live tab's
 * default Performance Index exactly: bosses only, excluding kills — each non-kill hit is divided
 * by the guild's non-kill average for that boss, and the per-player mean of those ratios is the
 * index. Limited to the season's top-2 rarities (all `bossPerformance` covers).
 *
 * Only the fields the Performance Index table reads are meaningful; the rest are left at 0.
 */
export function buildGuildPerformanceIndexRows(summary: GuildSeasonSummary, names: Map<string, string>): PlayerRow[] {
    const ratiosByPlayer = new Map<string, number[]>();
    for (const entry of summary.bossPerformance) {
        if (entry.enemyInfo.encounterIndex !== 0) continue; // bosses only
        const guildAvg = entry.guildAverageDamageWithoutKills;
        if (guildAvg <= 0) continue;
        for (const player of entry.playerEntries) {
            // Anonymized rows (no id) can't be attributed to an individual, so they're skipped.
            if (player.playerId === undefined) continue;
            if (player.nonKillHits.length === 0) continue;
            let ratios = ratiosByPlayer.get(player.playerId);
            if (ratios === undefined) {
                ratios = [];
                ratiosByPlayer.set(player.playerId, ratios);
            }
            for (const hit of player.nonKillHits) ratios.push(hit / guildAvg);
        }
    }

    const rows: PlayerRow[] = [];
    for (const [userId, ratios] of ratiosByPlayer) {
        const ratioSum = ratios.reduce((sum, ratio) => sum + ratio, 0);
        const performanceIndex = ratios.length > 0 ? ratioSum / ratios.length : 0;
        rows.push({
            userId,
            displayName: names.get(userId) ?? obfuscateUserId(userId),
            performanceIndex,
            performanceDiffPct: ratios.length > 0 ? (performanceIndex - 1) * 100 : 0,
            equivalentHits: ratioSum,
            avg: 0,
            max: 0,
            total: 0,
            avgDiffPct: 0,
            maxDiffPct: 0,
            totalDiffPct: 0,
            equivalentDiffPct: 0,
        });
    }
    return rows;
}

/**
 * Per-player per-(unitId, rarity, encounterIndex) breakdown intended for the
 * heat-map style table. Returns EVERY unit at the selected tiers for each player —
 * including units the player never hit (those have `hits === 0` and `ratio === 0`).
 * The caller is expected to pre-filter `entries` to: non-bomb + selected rarities
 * (+ excludeKills), but NOT to apply boss/prime selection.
 *
 * Units within each player are returned unsorted; the consumer sorts per display mode.
 */

export function buildPlayerBreakdowns(
    entries: TacticusGuildRaidEntry[],
    names: Map<string, string>
): PlayerBossBreakdown[] {
    if (entries.length === 0) return [];

    // Key includes encounterIndex so primes that share a unitId stay separate slots.
    const unitMeta = new Map<
        string,
        { unitId: string; rarity: Rarity; set: number; encounterIndex: number; isBoss: boolean }
    >();
    const guildSumByUnit = new Map<string, { sum: number; count: number }>();
    for (const entry of entries) {
        const unitKey = `${entry.unitId}:${entry.rarity}:${entry.encounterIndex}`;
        if (!unitMeta.has(unitKey)) {
            unitMeta.set(unitKey, {
                unitId: entry.unitId,
                rarity: entry.rarity,
                set: entry.set,
                encounterIndex: entry.encounterIndex,
                isBoss: entry.encounterType === TacticusEncounterType.Boss,
            });
        }
        let agg = guildSumByUnit.get(unitKey);
        if (agg === undefined) {
            agg = { sum: 0, count: 0 };
            guildSumByUnit.set(unitKey, agg);
        }
        agg.sum += entry.damageDealt;
        agg.count++;
    }
    const guildAvgByUnit = new Map<string, number>();
    for (const [key, { sum, count }] of guildSumByUnit) {
        guildAvgByUnit.set(key, count > 0 ? sum / count : 0);
    }

    // userId → unitKey → damages[]
    const perPlayerPerUnit = new Map<string, Map<string, number[]>>();
    const allUserIds = new Set<string>();
    for (const entry of entries) {
        allUserIds.add(entry.userId);
        let userMap = perPlayerPerUnit.get(entry.userId);
        if (userMap === undefined) {
            userMap = new Map();
            perPlayerPerUnit.set(entry.userId, userMap);
        }
        const unitKey = `${entry.unitId}:${entry.rarity}:${entry.encounterIndex}`;
        let damages = userMap.get(unitKey);
        if (damages === undefined) {
            damages = [];
            userMap.set(unitKey, damages);
        }
        damages.push(entry.damageDealt);
    }

    const breakdowns: PlayerBossBreakdown[] = [];
    for (const userId of allUserIds) {
        const userMap = perPlayerPerUnit.get(userId) ?? new Map<string, number[]>();
        // Include every unit at the selected tiers — even ones this player hasn't hit.
        const units: PlayerBossUnit[] = [];
        for (const [unitKey, meta] of unitMeta) {
            const damages = userMap.get(unitKey) ?? [];
            let sum = 0;
            for (const value of damages) sum += value;
            const playerAvg = damages.length > 0 ? sum / damages.length : 0;
            const guildAvg = guildAvgByUnit.get(unitKey) ?? 0;
            units.push({
                unitKey,
                unitId: meta.unitId,
                rarity: meta.rarity,
                set: meta.set,
                encounterIndex: meta.encounterIndex,
                isBoss: meta.isBoss,
                playerAvg,
                guildAvg,
                ratio: guildAvg > 0 && damages.length > 0 ? playerAvg / guildAvg : 0,
                hits: damages.length,
            });
        }
        breakdowns.push({
            userId,
            displayName: names.get(userId) ?? obfuscateUserId(userId),
            units,
        });
    }
    return breakdowns.toSorted((a, b) => a.displayName.localeCompare(b.displayName));
}

// ---------------------------------------------------------------------------
// Per-unit player buckets — pivot of buildPlayerBreakdowns for the per-boss mode
// ---------------------------------------------------------------------------

export interface PlayerInBucket {
    userId: string;
    displayName: string;
    playerAvg: number;
    ratio: number;
}

export interface UnitPlayerBuckets {
    unitKey: string;
    unitId: string;
    rarity: Rarity;
    set: number;
    encounterIndex: number;
    isBoss: boolean;
    guildAvg: number;
    /** Players whose ratio ≥ 1.20. */
    greenPlayers: PlayerInBucket[];
    /** Players with 0.80 ≤ ratio < 1.20. */
    yellowPlayers: PlayerInBucket[];
    /** Players with ratio < 0.80. */
    redPlayers: PlayerInBucket[];
}

/**
 * Pivots `breakdowns` into one row per (unit) with players bucketed by colour.
 * Players who haven't hit a given unit are omitted from that row. Bucket thresholds:
 *   green  ≥ guild avg + 20%
 *   yellow ≥ guild avg − 20%  (and < +20%)
 *   red    everything below
 * Rows are sorted descending by (rarity, set) with boss → left prime → right prime
 * within a set (encounterIndex ascending).
 */
export function buildUnitPlayerBuckets(breakdowns: PlayerBossBreakdown[]): UnitPlayerBuckets[] {
    const byUnit = new Map<string, UnitPlayerBuckets>();
    for (const breakdown of breakdowns) {
        for (const unit of breakdown.units) {
            if (unit.hits === 0) continue;
            let bucket = byUnit.get(unit.unitKey);
            if (bucket === undefined) {
                bucket = {
                    unitKey: unit.unitKey,
                    unitId: unit.unitId,
                    rarity: unit.rarity,
                    set: unit.set,
                    encounterIndex: unit.encounterIndex,
                    isBoss: unit.isBoss,
                    guildAvg: unit.guildAvg,
                    greenPlayers: [],
                    yellowPlayers: [],
                    redPlayers: [],
                };
                byUnit.set(unit.unitKey, bucket);
            }
            const player: PlayerInBucket = {
                userId: breakdown.userId,
                displayName: breakdown.displayName,
                playerAvg: unit.playerAvg,
                ratio: unit.ratio,
            };
            if (unit.ratio >= 1.2) bucket.greenPlayers.push(player);
            else if (unit.ratio >= 0.8) bucket.yellowPlayers.push(player);
            else bucket.redPlayers.push(player);
        }
    }
    for (const bucket of byUnit.values()) {
        bucket.greenPlayers = bucket.greenPlayers.toSorted((a, b) => b.ratio - a.ratio);
        bucket.yellowPlayers = bucket.yellowPlayers.toSorted((a, b) => b.ratio - a.ratio);
        bucket.redPlayers = bucket.redPlayers.toSorted((a, b) => b.ratio - a.ratio);
    }
    return [...byUnit.values()].toSorted((a, b) => {
        if (a.rarity !== b.rarity) return b.rarity - a.rarity;
        if (a.set !== b.set) return b.set - a.set;
        return a.encounterIndex - b.encounterIndex;
    });
}

// ---------------------------------------------------------------------------
// Player view: per-unit (boss or prime) rows showing the player's stats vs
// the guild's stats for that same unit.
// ---------------------------------------------------------------------------

export interface UnitRow {
    unitKey: string;
    unitId: string;
    rarity: Rarity;
    set: number;
    encounterIndex: number;
    isBoss: boolean;
    bossPrefix: string;
    /** This unit's own max HP. */
    unitMaxHp: number;
    /** Max HP of the main boss in this unit's family — used to keep primes adjacent to their boss. */
    parentBossMaxHp: number;
    avg: number;
    max: number;
    /** Guild's average damage on this unit (respects excludeKills). */
    guildAvg: number;
    /** Guild's max damage on this unit, across all players. */
    guildMax: number;
    avgDiffPct: number;
    maxDiffPct: number;
    /** Non-kill damage values dealt by the selected player against this unit. */
    playerNonKillHits: number[];
    /** Kill-blow damage values. Empty array when excludeKills=true. */
    playerKillHits: number[];
}

export function buildPlayerView(
    filteredEntries: TacticusGuildRaidEntry[],
    userId: string,
    excludeKills: boolean
): UnitRow[] {
    // Group by (unitId, rarity, encounterIndex) so primes that share a unitId but appear
    // in different encounter slots (e.g. Silent King's left and right minions) stay separate.
    const groups = new Map<string, TacticusGuildRaidEntry[]>();
    for (const entry of filteredEntries) {
        const key = `${entry.unitId}:${entry.rarity}:${entry.encounterIndex}`;
        let list = groups.get(key);
        if (list === undefined) {
            list = [];
            groups.set(key, list);
        }
        list.push(entry);
    }

    // Parent boss HP per prefix — primes inherit this for sorting so they sit next to their boss
    const bossHpByPrefix = new Map<string, number>();
    for (const entry of filteredEntries) {
        if (!isMainBoss(entry)) continue;
        const prefix = getBossPrefix(entry.unitId);
        const current = bossHpByPrefix.get(prefix) ?? 0;
        if (entry.maxHp > current) bossHpByPrefix.set(prefix, entry.maxHp);
    }

    const rows: UnitRow[] = [];
    for (const [key, groupEntries] of groups) {
        const sample = groupEntries[0];
        const isBoss = isMainBoss(sample);
        const bossPrefix = getBossPrefix(sample.unitId);

        let unitMaxHp = 0;
        for (const entry of groupEntries) {
            if (entry.maxHp > unitMaxHp) unitMaxHp = entry.maxHp;
        }
        const parentBossMaxHp = isBoss ? unitMaxHp : (bossHpByPrefix.get(bossPrefix) ?? unitMaxHp);

        const playerKillHits: number[] = [];
        const playerNonKillHits: number[] = [];
        for (const entry of groupEntries) {
            if (entry.userId !== userId) continue;
            if (notKill(entry)) playerNonKillHits.push(entry.damageDealt);
            else playerKillHits.push(entry.damageDealt);
        }
        if (playerKillHits.length === 0 && playerNonKillHits.length === 0) continue;
        if (excludeKills && playerNonKillHits.length === 0) continue;

        const playerHitsForStats = excludeKills ? playerNonKillHits : [...playerNonKillHits, ...playerKillHits];
        const guildSource = excludeKills ? groupEntries.filter(entry => notKill(entry)) : groupEntries;
        const guildStats = aggregate(guildSource.map(entry => entry.damageDealt));
        const playerAvgStats = aggregate(playerHitsForStats);
        const playerMaxStats = aggregate(playerHitsForStats);

        rows.push({
            unitKey: key,
            unitId: sample.unitId,
            rarity: sample.rarity,
            set: sample.set,
            encounterIndex: sample.encounterIndex,
            isBoss,
            bossPrefix,
            unitMaxHp,
            parentBossMaxHp,
            avg: playerAvgStats.avg,
            max: playerMaxStats.max,
            guildAvg: guildStats.avg,
            guildMax: guildStats.max,
            avgDiffPct: guildStats.avg > 0 ? ((playerAvgStats.avg - guildStats.avg) / guildStats.avg) * 100 : 0,
            maxDiffPct: guildStats.max > 0 ? ((playerMaxStats.max - guildStats.max) / guildStats.max) * 100 : 0,
            playerNonKillHits,
            playerKillHits: excludeKills ? [] : playerKillHits,
        });
    }

    // Graphs are sorted descending: highest rarity / latest set first
    return rows.toSorted((a, b) => {
        if (a.rarity !== b.rarity) return b.rarity - a.rarity;
        if (a.set !== b.set) return b.set - a.set;
        return b.encounterIndex - a.encounterIndex;
    });
}

/**
 * Per-unit rows for one player in a historical season, reconstructed from the aggregate's raw boss
 * hit arrays (`bossPerformance`). Mirrors {@link buildPlayerView}: avg respects `excludeKills`,
 * while max and the hit distribution stay kill-inclusive. Covers bosses + primes the player hit, at
 * the season's top-2 rarities. The aggregate has no `set`, so rows sort by the GuildBoss{N} rotation
 * order (which matches `set` within a rarity).
 */
export function buildPlayerViewFromSummary(
    summary: GuildSeasonSummary,
    userId: string,
    excludeKills: boolean
): UnitRow[] {
    const bossHpByFamily = new Map<string, number>();
    for (const entry of summary.bossPerformance) {
        if (entry.enemyInfo.encounterIndex !== 0) continue;
        const key = `${getBossPrefix(entry.enemyInfo.enemyId)}:${entry.enemyInfo.rarity}`;
        bossHpByFamily.set(key, Math.max(bossHpByFamily.get(key) ?? 0, entry.enemyInfo.maxHp));
    }

    const rows: UnitRow[] = [];
    for (const entry of summary.bossPerformance) {
        const player = entry.playerEntries.find(candidate => candidate.playerId === userId);
        if (player === undefined) continue;
        const playerHitsAll = [...player.nonKillHits, ...player.killHits];
        if (playerHitsAll.length === 0) continue;

        const { enemyId, rarity: rarityName, encounterIndex, maxHp, set } = entry.enemyInfo;
        const rarity = RarityMapper.stringToNumber[rarityName];
        const isBoss = encounterIndex === 0;
        const bossPrefix = getBossPrefix(enemyId);

        if (excludeKills && player.nonKillHits.length === 0) continue;
        const playerHitsForStats = excludeKills ? player.nonKillHits : playerHitsAll;
        const playerAvgStats = aggregate(playerHitsForStats);
        const playerMaxStats = aggregate(playerHitsForStats);
        const guildAvg = excludeKills ? entry.guildAverageDamageWithoutKills : entry.guildAverageDamage;
        const guildMax = excludeKills ? entry.guildMaxDamageWithoutKills : entry.guildMaxDamage;

        rows.push({
            unitKey: `${enemyId}:${rarity}:${encounterIndex}`,
            unitId: enemyId,
            rarity,
            set: set ?? getBossOrder(bossPrefix),
            encounterIndex,
            isBoss,
            bossPrefix,
            unitMaxHp: maxHp,
            parentBossMaxHp: isBoss ? maxHp : (bossHpByFamily.get(`${bossPrefix}:${rarityName}`) ?? maxHp),
            avg: playerAvgStats.avg,
            max: playerMaxStats.max,
            guildAvg,
            guildMax,
            avgDiffPct: guildAvg > 0 ? ((playerAvgStats.avg - guildAvg) / guildAvg) * 100 : 0,
            maxDiffPct: guildMax > 0 ? ((playerMaxStats.max - guildMax) / guildMax) * 100 : 0,
            playerNonKillHits: player.nonKillHits,
            playerKillHits: excludeKills ? [] : player.killHits,
        });
    }

    // Match the live player view: highest rarity, then latest set (GuildBoss order), then primes
    // before boss within a family.
    return rows.toSorted((a, b) => {
        if (a.rarity !== b.rarity) return b.rarity - a.rarity;
        if (a.set !== b.set) return b.set - a.set;
        return b.encounterIndex - a.encounterIndex;
    });
}

/**
 * Computes per-player performance index for the current (live) season from the raw Tacticus raid
 * response. Mirrors the backend definition: non-bomb, non-kill, boss-only hits at the top-2
 * rarities; each hit is divided by the per-unit guild average, and the player's PI is the mean of
 * those ratios. Returns a `GuildSeasonPerformanceIndex` entry suitable for merging with the
 * historical entries from `/guild/raid/performance-index`.
 */
export function buildCurrentSeasonPIEntry(currentData: TacticusGuildRaidResponse): GuildSeasonPerformanceIndex {
    const top2Rarities = new Set(computeDefaultRarities(currentData.entries));
    const relevant = currentData.entries.filter(
        entry =>
            entry.damageType !== TacticusDamageType.Bomb &&
            entry.encounterType === TacticusEncounterType.Boss &&
            entry.remainingHp !== 0 &&
            top2Rarities.has(entry.rarity)
    );

    const unitSums = new Map<string, { sum: number; count: number }>();
    for (const entry of relevant) {
        const key = `${entry.unitId}:${entry.rarity}`;
        const agg = unitSums.get(key) ?? { sum: 0, count: 0 };
        agg.sum += entry.damageDealt;
        agg.count++;
        unitSums.set(key, agg);
    }
    const guildAvgByUnit = new Map<string, number>();
    for (const [key, { sum, count }] of unitSums) {
        if (count > 0) guildAvgByUnit.set(key, sum / count);
    }

    const ratiosByPlayer = new Map<string, number[]>();
    for (const entry of relevant) {
        const unitAvg = guildAvgByUnit.get(`${entry.unitId}:${entry.rarity}`);
        if (!unitAvg) continue;
        let ratios = ratiosByPlayer.get(entry.userId);
        if (!ratios) {
            ratios = [];
            ratiosByPlayer.set(entry.userId, ratios);
        }
        ratios.push(entry.damageDealt / unitAvg);
    }

    return {
        season: currentData.season,
        playerEntries: [...ratiosByPlayer.entries()].map(([playerId, ratios]) => ({
            playerId,
            performanceIndex: ratios.reduce((s, r) => s + r, 0) / ratios.length,
        })),
    };
}

/**
 * Converts the `/guild/raid/performance-index` response (season-major) into one line per player
 * (player-major) for the historical performance chart. Null playerId entries (keyless member's own
 * row) are keyed by `ownUserId` when provided.
 */
export function buildLinesFromPerformanceIndex(
    entries: GuildSeasonPerformanceIndex[],
    names: Map<string, string>,
    ownUserId?: string
): PlayerPerformanceLine[] {
    const byPlayer = new Map<string, PerformanceIndexSeasonPoint[]>();
    for (const { season, playerEntries } of entries) {
        if (season === undefined || !playerEntries) continue;
        for (const { playerId, performanceIndex } of playerEntries) {
            if (performanceIndex === undefined) continue;
            const userId = playerId ?? ownUserId;
            if (!userId) continue;
            let points = byPlayer.get(userId);
            if (!points) {
                points = [];
                byPlayer.set(userId, points);
            }
            points.push({ season, performanceIndex });
        }
    }
    return [...byPlayer.entries()]
        .map(([userId, points]) => ({
            userId,
            displayName: names.get(userId) ?? obfuscateUserId(userId),
            points: points.toSorted((a, b) => a.season - b.season),
        }))
        .filter(line => line.points.length > 0)
        .toSorted((a, b) => a.displayName.localeCompare(b.displayName));
}
