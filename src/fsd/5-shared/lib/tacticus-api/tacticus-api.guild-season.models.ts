import { RarityString } from '@/fsd/5-shared/model';

/**
 * Aggregated, persisted summaries of past guild raid seasons, returned by
 * `GET guild/raid?history=true`. These mirror the backend `GuildSeasonSummary`
 * shapes (tacticusplannerbackend → FunctionAppHello/Models/GuildSeason/GuildSeasonSummary.cs).
 *
 * Unlike {@link TacticusGuildRaidResponse}, which is the raw list of per-hit entries for the
 * current season, these are pre-aggregated season rollups: the raw hits are not retained.
 *
 * Terminology (matches the backend aggregator):
 *  - "token"         — a Battle hit. Bombs are never tokens.
 *  - "bomb"          — a Bomb hit. Counted only in bomb fields and the guild-level totalDamage;
 *                      excluded from every other damage/average/max figure.
 *  - "killing token" — a Battle hit whose remainingHp reached 0.
 *  - "top-2 rarities"— per-enemy/per-player detail is only recorded for the two highest rarities
 *                      that appear in the season; lower rarities fold into aggregates only.
 *  - "folding"       — hits against the same boss are folded across loops but kept separate per
 *                      rarity (loops stay separate only for the per-loop token counts).
 */

/** Indicates whether the backend has successfully computed and stored a season's summary. */
export enum SeasonFetchStatus {
    Found = 0,
    NotFound = 1,
    Empty = 2,
    TransientError = 3,
    /** Season is outside the 11-season window and was never persisted. */
    TooOld = 4,
    /** Season is within the 11-season window but has not yet been aggregated. */
    NotAggregated = 5,
}

/** One element of `GuildSeasonHistoryResponse.seasonData`. Wraps an optional summary with metadata. */
export interface GuildSeasonHistoryEntry {
    season: number;
    status: SeasonFetchStatus;
    /** Absent when `status` is not `Found` (backend has not computed this season yet). */
    summary?: GuildSeasonSummary;
}

/** Boss/prime slot of an enemy within a raid encounter. */
export enum GuildSeasonEncounterIndex {
    Boss = 0,
    LeftPrime = 1,
    RightPrime = 2,
}

/** Identifies a single enemy: a boss (encounterIndex 0) or a prime (1 = left, 2 = right). */
export interface EnemyInfo {
    /** Snowprint unit id of the enemy (same id space as {@link TacticusGuildRaidEntry.unitId}). */
    enemyId: string;
    rarity: RarityString;
    encounterIndex: GuildSeasonEncounterIndex;
    maxHp: number;
    set: number;
}

// ---------------------------------------------------------------------------
// damageSummary: per-player season totals + per-enemy avg/max (top-2)
// ---------------------------------------------------------------------------

/** Per-player season-wide totals across all rarities. */
export interface GuildDamageSeasonSummaryTextPlayerData {
    /** `null`/absent when anonymized — i.e. another member's row in a keyless member's view. */
    playerId?: string;
    /** Total tokens (Battle hits) used across all enemies. */
    tokens: number;
    /** Total bombs used across all enemies. */
    bombs: number;
    /** Total token hits on primes (encounterIndex 1 and 2), including kills. */
    primeHits: number;
    /** Total token hits on bosses (encounterIndex 0) that were kills. */
    bossKillHits: number;
    /** Largest single token hit of the season (any enemy), including kills. */
    maxDamage: number;
    /** Total token (non-bomb) damage against bosses (encounterIndex 0), all rarities. */
    totalDamage: number;
    /** The enemy hit by {@link maxDamage}. Absent if the player landed no token hits. */
    maxDamageTarget?: EnemyInfo;
}

export interface GuildDamageSeasonSummaryTextData {
    playerData: GuildDamageSeasonSummaryTextPlayerData[];
}

/** Guild-wide avg/max for one enemy (folded across loops). Top-2 rarities. */
export interface GuildDamageSeasonSummaryGuildBossEntry {
    enemyInfo: EnemyInfo;
    averageDamage: number;
    averageDamageWithoutKills: number;
    maxDamage: number;
    /** Only present when the best non-kill hit differs from the best overall hit. */
    maxDamageWithoutKills?: number;
    /** `null`/absent when anonymized — i.e. another member's row in a keyless member's view. */
    maxDamagePlayerId?: string;
    maxDamageWithoutKillsPlayerId?: string;
    /** Hero unitIds followed by the machine-of-war unitId (if any) for the best overall hit. Empty when anonymized. */
    maxDamageComp: string[];
    maxDamageWithoutKillsComp?: string[];
}

/** Per-player avg/max for one enemy (folded across loops). Top-2 rarities. */
export interface GuildDamageSeasonSummaryPlayerBossEntry {
    enemyInfo: EnemyInfo;
    /** `null`/absent when anonymized — i.e. another member's row in a keyless member's view. */
    playerId?: string;
    averageDamage: number;
    averageDamageWithoutKills: number;
    maxDamage: number;
    maxDamageWithoutKills?: number;
    maxDamageComp: string[];
    maxDamageWithoutKillsComp?: string[];
}

export interface GuildDamageSeasonSummary {
    textData: GuildDamageSeasonSummaryTextData;
    /** Guild-wide avg/max per boss and prime. Top-2 rarities. */
    guildEntries: GuildDamageSeasonSummaryGuildBossEntry[];
    /** Per-player avg/max per boss and prime. Top-2 rarities. */
    playerEntries: GuildDamageSeasonSummaryPlayerBossEntry[];
}

// ---------------------------------------------------------------------------
// leaderboards: top-5 single hits per enemy (top-2 rarities)
// ---------------------------------------------------------------------------

export interface GuildSeasonBossLeaderboardEntry {
    damage: number;
    /** Present in `GET guild/sharedLeaderboards` responses; identifies the source guild (5-char tag). */
    guildTag?: string;
    /** Present and true for entries that belong to the requesting guild in a shared-leaderboard response. */
    isOwnGuild?: boolean;
    /** `null`/absent when anonymized — i.e. another member's row in a keyless member's view.
     *  In shared-leaderboard responses the backend replaces this with the guild's display name. */
    playerId?: string;
    /** Hero unitIds followed by the machine-of-war unitId (if any). */
    comp: string[];
}

export interface GuildSeasonBossLeaderboard {
    enemyInfo: EnemyInfo;
    entries: GuildSeasonBossLeaderboardEntry[];
}

/** Response body of `GET guild/sharedLeaderboards`. */
export interface SharedLeaderboardsResponse {
    season: number;
    leaderboards: GuildSeasonBossLeaderboard[];
}

// ---------------------------------------------------------------------------
// loops: per-loop, per-boss token counts (all rarities, loops kept separate)
// ---------------------------------------------------------------------------

export interface GuildSeasonLoopInfo {
    loopNumber: number;
    /** The boss (encounterIndex 0) for this loop encounter. */
    enemyInfo: EnemyInfo;
    bossTokens: number;
    leftPrimeTokens: number;
    rightPrimeTokens: number;
}

// ---------------------------------------------------------------------------
// performanceIndex: per-player weighted-avg-hit ratio vs guild (top-2, bosses only)
// ---------------------------------------------------------------------------

export interface GuildSeasonPerformanceIndexPlayerEntry {
    /** `null`/absent when anonymized — i.e. another member's row in a keyless member's view. */
    playerId?: string;
    /** Player's average token damage divided by the guild's, including kills. 1.5 = +50%. */
    performanceIndex: number;
    /** Same ratio computed over non-kill tokens only. */
    performanceIndexWithoutKills: number;
}

export interface GuildSeasonPerformanceIndexEntry {
    enemyInfo: EnemyInfo;
    playerEntries: GuildSeasonPerformanceIndexPlayerEntry[];
}

// ---------------------------------------------------------------------------
// bossPerformance: raw per-player hit arrays + guild aggregates (top-2, boss + primes)
// ---------------------------------------------------------------------------

export interface GuildSeasonPlayerPerformanceEntry {
    /** `null`/absent when anonymized — i.e. another member's row in a keyless member's view. */
    playerId?: string;
    /** Damage of each non-killing token hit. */
    nonKillHits: number[];
    /** Damage of each killing token hit. */
    killHits: number[];
}

export interface GuildSeasonBossPerformanceEntry {
    enemyInfo: EnemyInfo;
    guildAverageDamage: number;
    guildAverageDamageWithoutKills: number;
    guildMaxDamage: number;
    guildMaxDamageWithoutKills: number;
    playerEntries: GuildSeasonPlayerPerformanceEntry[];
}

// ---------------------------------------------------------------------------
// Top-level season summary + history response
// ---------------------------------------------------------------------------

/** Aggregated rollup of a single guild raid season. */
export interface GuildSeasonSummary {
    season: number;
    /** Total damage across EVERYTHING — all rarities, tiers, sets, loops, tokens and bombs. */
    totalDamage: number;
    damageSummary: GuildDamageSeasonSummary;
    /** Top-5 single hits per boss and per prime, top-2 rarities only. */
    leaderboards: GuildSeasonBossLeaderboard[];
    /** Per-loop, per-boss token counts. All rarities; loops kept separate. */
    loops: GuildSeasonLoopInfo[];
    /** Per-player weighted-average-hit-vs-guild ratios per boss. Top-2 rarities, bosses only. */
    performanceIndex: GuildSeasonPerformanceIndexEntry[];
    /** Raw per-player hit arrays plus guild aggregates per boss and prime. Top-2 rarities. */
    bossPerformance: GuildSeasonBossPerformanceEntry[];
}

/**
 * Response body of `GET guild/raid?history=true`.
 *
 * `seasonData` is ordered ascending by `season`. `sequenceNumber` is an optimistic-concurrency
 * counter that bumps only when a new season is persisted server-side — useful as a cache key.
 */
export interface GuildSeasonHistoryResponse {
    sequenceNumber: number;
    seasonData: GuildSeasonHistoryEntry[];
}
