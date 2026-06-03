import { RarityString } from '@/fsd/5-shared/model';

import {
    EnemyInfo,
    GuildDamageSeasonSummary,
    GuildDamageSeasonSummaryGuildBossEntry,
    GuildDamageSeasonSummaryPlayerBossEntry,
    GuildDamageSeasonSummaryTextPlayerData,
    GuildSeasonBossLeaderboard,
    GuildSeasonBossLeaderboardEntry,
    GuildSeasonBossPerformanceEntry,
    GuildSeasonEncounterIndex,
    GuildSeasonHistoryResponse,
    GuildSeasonLoopInfo,
    GuildSeasonPerformanceIndexEntry,
    GuildSeasonPerformanceIndexPlayerEntry,
    GuildSeasonPlayerPerformanceEntry,
    GuildSeasonSummary,
} from './tacticus-api.guild-season.models';

/**
 * Ingests and validates the raw `GET guild/raid?history=true` body into structured
 * {@link GuildSeasonHistoryResponse} data.
 *
 * The server pre-aggregates everything (see tacticus-api.guild-season.models.ts), so this layer
 * only validates structure and normalizes the wire format — it does no aggregation. Notably it
 * collapses the `null`s the ASP.NET Core worker emits for absent optional fields into `undefined`,
 * and drops any unknown extra properties so consumers get exactly the typed shape.
 *
 * Use {@link safeParseGuildSeasonHistory} for a non-throwing result; the throwing
 * {@link parseGuildSeasonHistory} is convenient when the caller already has error boundaries.
 */

/** A structural validation failure, carrying the path to the offending node. */
export class GuildSeasonParseError extends Error {
    constructor(
        message: string,
        /** Dotted path to the node that failed validation, e.g. `seasonData[2].loops[0].bossTokens`. */
        public readonly path: string
    ) {
        super(`Invalid guild season history at "${path}": ${message}`);
        this.name = 'GuildSeasonParseError';
    }
}

export type GuildSeasonHistoryParseResult =
    | { success: true; data: GuildSeasonHistoryResponse }
    | { success: false; error: GuildSeasonParseError };

/** Validates and structures the raw response, throwing {@link GuildSeasonParseError} on bad input. */
export function parseGuildSeasonHistory(raw: unknown): GuildSeasonHistoryResponse {
    const root = asObject(raw, 'root');
    return {
        sequenceNumber: asNumber(root.sequenceNumber, 'sequenceNumber'),
        seasonData: asArray(root.seasonData, 'seasonData').map((season, index) =>
            parseSeasonSummary(season, `seasonData[${index}]`)
        ),
    };
}

/** Non-throwing variant: returns the parsed data or the {@link GuildSeasonParseError}. */
export function safeParseGuildSeasonHistory(raw: unknown): GuildSeasonHistoryParseResult {
    try {
        return { success: true, data: parseGuildSeasonHistory(raw) };
    } catch (error) {
        if (error instanceof GuildSeasonParseError) return { success: false, error };
        throw error;
    }
}

export type GuildSeasonSummaryParseResult =
    | { success: true; data: GuildSeasonSummary }
    | { success: false; error: GuildSeasonParseError };

/**
 * Validates and structures a single {@link GuildSeasonSummary}. Used for the keyless-member
 * `GET guild/raid` response, which returns one aggregated (anonymized) season rather than the raw
 * per-hit `TacticusGuildRaidResponse` a keyed leader receives.
 */
export function parseGuildSeasonSummary(raw: unknown): GuildSeasonSummary {
    return parseSeasonSummary(raw, 'root');
}

/** Non-throwing variant of {@link parseGuildSeasonSummary}. */
export function safeParseGuildSeasonSummary(raw: unknown): GuildSeasonSummaryParseResult {
    try {
        return { success: true, data: parseGuildSeasonSummary(raw) };
    } catch (error) {
        if (error instanceof GuildSeasonParseError) return { success: false, error };
        throw error;
    }
}

// ---------------------------------------------------------------------------
// Per-entity parsers
// ---------------------------------------------------------------------------

function parseSeasonSummary(value: unknown, path: string): GuildSeasonSummary {
    const o = asObject(value, path);
    const damage = asObject(o.damageSummary, `${path}.damageSummary`);
    const textData = asObject(damage.textData, `${path}.damageSummary.textData`);

    return {
        season: asNumber(o.season, `${path}.season`),
        totalDamage: asNumber(o.totalDamage, `${path}.totalDamage`),
        damageSummary: {
            textData: {
                playerData: asArray(textData.playerData, `${path}.damageSummary.textData.playerData`).map(
                    (player, index) =>
                        parsePlayerSeasonTotals(player, `${path}.damageSummary.textData.playerData[${index}]`)
                ),
            },
            guildEntries: asArray(damage.guildEntries, `${path}.damageSummary.guildEntries`).map((entry, index) =>
                parseGuildBossEntry(entry, `${path}.damageSummary.guildEntries[${index}]`)
            ),
            playerEntries: asArray(damage.playerEntries, `${path}.damageSummary.playerEntries`).map((entry, index) =>
                parsePlayerBossEntry(entry, `${path}.damageSummary.playerEntries[${index}]`)
            ),
        } satisfies GuildDamageSeasonSummary,
        leaderboards: asArray(o.leaderboards, `${path}.leaderboards`).map((leaderboard, index) =>
            parseLeaderboard(leaderboard, `${path}.leaderboards[${index}]`)
        ),
        loops: asArray(o.loops, `${path}.loops`).map((loop, index) => parseLoopInfo(loop, `${path}.loops[${index}]`)),
        performanceIndex: asArray(o.performanceIndex, `${path}.performanceIndex`).map((entry, index) =>
            parsePerformanceIndexEntry(entry, `${path}.performanceIndex[${index}]`)
        ),
        bossPerformance: asArray(o.bossPerformance, `${path}.bossPerformance`).map((entry, index) =>
            parseBossPerformanceEntry(entry, `${path}.bossPerformance[${index}]`)
        ),
    };
}

function parsePlayerSeasonTotals(value: unknown, path: string): GuildDamageSeasonSummaryTextPlayerData {
    const o = asObject(value, path);
    const target = optional(o.maxDamageTarget);
    return {
        playerId: optString(o.playerId, `${path}.playerId`),
        tokens: asNumber(o.tokens, `${path}.tokens`),
        bombs: asNumber(o.bombs, `${path}.bombs`),
        primeHits: asNumber(o.primeHits, `${path}.primeHits`),
        bossKillHits: asNumber(o.bossKillHits, `${path}.bossKillHits`),
        maxDamage: asNumber(o.maxDamage, `${path}.maxDamage`),
        totalDamage: asNumber(o.totalDamage, `${path}.totalDamage`),
        maxDamageTarget: target === undefined ? undefined : parseEnemyInfo(target, `${path}.maxDamageTarget`),
    };
}

function parseGuildBossEntry(value: unknown, path: string): GuildDamageSeasonSummaryGuildBossEntry {
    const o = asObject(value, path);
    return {
        enemyInfo: parseEnemyInfo(o.enemyInfo, `${path}.enemyInfo`),
        averageDamage: asNumber(o.averageDamage, `${path}.averageDamage`),
        averageDamageWithoutKills: asNumber(o.averageDamageWithoutKills, `${path}.averageDamageWithoutKills`),
        maxDamage: asNumber(o.maxDamage, `${path}.maxDamage`),
        maxDamageWithoutKills: optNumber(o.maxDamageWithoutKills, `${path}.maxDamageWithoutKills`),
        maxDamagePlayerId: optString(o.maxDamagePlayerId, `${path}.maxDamagePlayerId`),
        maxDamageWithoutKillsPlayerId: optString(
            o.maxDamageWithoutKillsPlayerId,
            `${path}.maxDamageWithoutKillsPlayerId`
        ),
        maxDamageComp: compArray(o.maxDamageComp, `${path}.maxDamageComp`),
        maxDamageWithoutKillsComp: optStringArray(o.maxDamageWithoutKillsComp, `${path}.maxDamageWithoutKillsComp`),
    };
}

function parsePlayerBossEntry(value: unknown, path: string): GuildDamageSeasonSummaryPlayerBossEntry {
    const o = asObject(value, path);
    return {
        enemyInfo: parseEnemyInfo(o.enemyInfo, `${path}.enemyInfo`),
        playerId: optString(o.playerId, `${path}.playerId`),
        averageDamage: asNumber(o.averageDamage, `${path}.averageDamage`),
        averageDamageWithoutKills: asNumber(o.averageDamageWithoutKills, `${path}.averageDamageWithoutKills`),
        maxDamage: asNumber(o.maxDamage, `${path}.maxDamage`),
        maxDamageWithoutKills: optNumber(o.maxDamageWithoutKills, `${path}.maxDamageWithoutKills`),
        maxDamageComp: compArray(o.maxDamageComp, `${path}.maxDamageComp`),
        maxDamageWithoutKillsComp: optStringArray(o.maxDamageWithoutKillsComp, `${path}.maxDamageWithoutKillsComp`),
    };
}

function parseLeaderboard(value: unknown, path: string): GuildSeasonBossLeaderboard {
    const o = asObject(value, path);
    return {
        enemyInfo: parseEnemyInfo(o.enemyInfo, `${path}.enemyInfo`),
        entries: asArray(o.entries, `${path}.entries`).map((element, index): GuildSeasonBossLeaderboardEntry => {
            const entry = asObject(element, `${path}.entries[${index}]`);
            return {
                damage: asNumber(entry.damage, `${path}.entries[${index}].damage`),
                playerId: optString(entry.playerId, `${path}.entries[${index}].playerId`),
                comp: compArray(entry.comp, `${path}.entries[${index}].comp`),
            };
        }),
    };
}

function parseLoopInfo(value: unknown, path: string): GuildSeasonLoopInfo {
    const o = asObject(value, path);
    return {
        loopNumber: asNumber(o.loopNumber, `${path}.loopNumber`),
        enemyInfo: parseEnemyInfo(o.enemyInfo, `${path}.enemyInfo`),
        bossTokens: asNumber(o.bossTokens, `${path}.bossTokens`),
        leftPrimeTokens: asNumber(o.leftPrimeTokens, `${path}.leftPrimeTokens`),
        rightPrimeTokens: asNumber(o.rightPrimeTokens, `${path}.rightPrimeTokens`),
    };
}

function parsePerformanceIndexEntry(value: unknown, path: string): GuildSeasonPerformanceIndexEntry {
    const o = asObject(value, path);
    return {
        enemyInfo: parseEnemyInfo(o.enemyInfo, `${path}.enemyInfo`),
        playerEntries: asArray(o.playerEntries, `${path}.playerEntries`).map(
            (element, index): GuildSeasonPerformanceIndexPlayerEntry => {
                const entry = asObject(element, `${path}.playerEntries[${index}]`);
                return {
                    playerId: optString(entry.playerId, `${path}.playerEntries[${index}].playerId`),
                    performanceIndex: asNumber(
                        entry.performanceIndex,
                        `${path}.playerEntries[${index}].performanceIndex`
                    ),
                    performanceIndexWithoutKills: asNumber(
                        entry.performanceIndexWithoutKills,
                        `${path}.playerEntries[${index}].performanceIndexWithoutKills`
                    ),
                };
            }
        ),
    };
}

function parseBossPerformanceEntry(value: unknown, path: string): GuildSeasonBossPerformanceEntry {
    const o = asObject(value, path);
    return {
        enemyInfo: parseEnemyInfo(o.enemyInfo, `${path}.enemyInfo`),
        guildAverageDamage: asNumber(o.guildAverageDamage, `${path}.guildAverageDamage`),
        guildAverageDamageWithoutKills: asNumber(
            o.guildAverageDamageWithoutKills,
            `${path}.guildAverageDamageWithoutKills`
        ),
        guildMaxDamage: asNumber(o.guildMaxDamage, `${path}.guildMaxDamage`),
        guildMaxDamageWithoutKills: asNumber(o.guildMaxDamageWithoutKills, `${path}.guildMaxDamageWithoutKills`),
        playerEntries: asArray(o.playerEntries, `${path}.playerEntries`).map(
            (element, index): GuildSeasonPlayerPerformanceEntry => {
                const entry = asObject(element, `${path}.playerEntries[${index}]`);
                return {
                    playerId: optString(entry.playerId, `${path}.playerEntries[${index}].playerId`),
                    nonKillHits: asNumberArray(entry.nonKillHits, `${path}.playerEntries[${index}].nonKillHits`),
                    killHits: asNumberArray(entry.killHits, `${path}.playerEntries[${index}].killHits`),
                };
            }
        ),
    };
}

function parseEnemyInfo(value: unknown, path: string): EnemyInfo {
    const o = asObject(value, path);
    return {
        enemyId: asString(o.enemyId, `${path}.enemyId`),
        rarity: asRarity(o.rarity, `${path}.rarity`),
        encounterIndex: asNumber(o.encounterIndex, `${path}.encounterIndex`) as GuildSeasonEncounterIndex,
        maxHp: asNumber(o.maxHp, `${path}.maxHp`),
    };
}

// ---------------------------------------------------------------------------
// Primitive validators
// ---------------------------------------------------------------------------

/** Treats `null` and `undefined` alike: both mean "field absent". */
function optional(value: unknown): unknown {
    return value ?? undefined;
}

function asObject(value: unknown, path: string): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new GuildSeasonParseError(`expected object, got ${describe(value)}`, path);
    }
    return value as Record<string, unknown>;
}

function asArray(value: unknown, path: string): unknown[] {
    if (!Array.isArray(value)) {
        throw new GuildSeasonParseError(`expected array, got ${describe(value)}`, path);
    }
    return value;
}

function asNumber(value: unknown, path: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new GuildSeasonParseError(`expected finite number, got ${describe(value)}`, path);
    }
    return value;
}

function asString(value: unknown, path: string): string {
    if (typeof value !== 'string') {
        throw new GuildSeasonParseError(`expected string, got ${describe(value)}`, path);
    }
    return value;
}

function asStringArray(value: unknown, path: string): string[] {
    return asArray(value, path).map((item, index) => asString(item, `${path}[${index}]`));
}

function asNumberArray(value: unknown, path: string): number[] {
    return asArray(value, path).map((item, index) => asNumber(item, `${path}[${index}]`));
}

const RARITY_VALUES = new Set<string>(Object.values(RarityString));

function asRarity(value: unknown, path: string): RarityString {
    const rarityName = asString(value, path);
    if (!RARITY_VALUES.has(rarityName)) {
        throw new GuildSeasonParseError(`expected one of ${[...RARITY_VALUES].join(', ')}, got "${rarityName}"`, path);
    }
    return rarityName as RarityString;
}

function optNumber(value: unknown, path: string): number | undefined {
    const present = optional(value);
    return present === undefined ? undefined : asNumber(present, path);
}

function optString(value: unknown, path: string): string | undefined {
    const present = optional(value);
    return present === undefined ? undefined : asString(present, path);
}

function optStringArray(value: unknown, path: string): string[] | undefined {
    const present = optional(value);
    return present === undefined ? undefined : asStringArray(present, path);
}

/** A required string array that is `null`/absent when anonymized — normalized to an empty array. */
function compArray(value: unknown, path: string): string[] {
    return optStringArray(value, path) ?? [];
}

function describe(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
}
