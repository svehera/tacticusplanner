/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import {
    TacticusDamageType,
    TacticusEncounterType,
    SeasonFetchStatus,
    type GuildSeasonHistoryEntry,
    type GuildSeasonSummary,
    type TacticusGuildRaidEntry,
} from '@/fsd/5-shared/lib/tacticus-api';
import { obfuscateUserId } from '@/fsd/5-shared/lib/user-id-utils';
import { Rank, Rarity, RarityMapper, RarityStars } from '@/fsd/5-shared/model';
import { getImageUrl } from '@/fsd/5-shared/ui';
import type { ISnapshotCharacter } from '@/fsd/5-shared/ui/unit-portrait';

import { CharactersService } from '@/fsd/4-entities/character/characters.service';
import {
    bossPortraitMap,
    describeModifier,
    encounterStatsIndex,
    getEncountersAtPosition,
    getNextEncounterPosition,
    findPositionByBossUnitSetId,
    getSeasonConfig,
    getStatsAtIndex,
    getTierRarity,
    getUnitDisplayName,
    getUnitSet,
    getUnitSetId,
    guildBossData,
    resolvePrimeDisplayName,
    resolvePrimeRegularPortraitPath,
    scaleModifierHpLost,
    sortModifiersByHpLost,
    type EncounterPosition,
    type GuildBossEncounter,
    type GuildBossEncounterModifier,
} from '@/fsd/4-entities/guild_boss';
import { unitRoundIconMap } from '@/fsd/4-entities/guild_boss/guild-boss-portraits';

// ---------------------------------------------------------------------------
// Damage colour coding
// ---------------------------------------------------------------------------

/**
 * Colours a hit against the guild average for that encounter. Green means exactly one thing:
 * comfortably above average.
 *
 * The three cases that carry **no verdict** all read `--soft-fg`: a killing blow is capped by the HP
 * left rather than by the player, a bomb spends no token and is excluded from the average, and
 * without a baseline there is nothing to compare against. Colouring any of them green would leave
 * green meaning three different things.
 */
export function getDamageColorClass(entry: TacticusGuildRaidEntry, avgDamage: number | undefined): string {
    if (entry.damageType === TacticusDamageType.Bomb) return 'text-(--soft-fg)';
    if (entry.remainingHp === 0) return 'text-(--soft-fg)';
    if (avgDamage === undefined || avgDamage === 0) return 'text-(--soft-fg)';
    const ratio = entry.damageDealt / avgDamage;
    if (ratio >= 1.2) return 'font-bold text-(--success)';
    // Amber for the mid band, but not `--warning` — it is amber-400, too light to read as text on
    // `--card`. Per CONVENTIONS' shade-picking guide, a Tailwind shade with an explicit `dark:`
    // variant instead.
    if (ratio >= 0.8) return 'text-amber-600 dark:text-amber-400';
    return 'text-(--danger)';
}

// ---------------------------------------------------------------------------
// Average damage map
// ---------------------------------------------------------------------------

/** Lookup key for {@link buildAvgDamageMap}. Exported so consumers cannot drift from the builder. */
export function avgDamageKey(unitId: string, rarity: number, encounterIndex: number): string {
    return `${unitId}:${rarity}:${encounterIndex}`;
}

/**
 * Average raid-token damage per encounter slot, excluding killing blows (`remainingHp === 0`, capped
 * by what was left rather than by the player) and bombs (they spend no token).
 */
export function buildAvgDamageMap(entries: TacticusGuildRaidEntry[]): Map<string, number> {
    const statsMap = new Map<string, { sum: number; count: number }>();
    for (const entry of entries) {
        if (entry.damageType === TacticusDamageType.Bomb) continue;
        if (entry.remainingHp === 0) continue;
        // Keyed by slot as well, matching the summary tables: Silent King's twin minions share a
        // unitId but are separate encounters, and averaging them together compares each hit against
        // a baseline drawn half from a target it was never aimed at.
        const key = avgDamageKey(entry.unitId, entry.rarity, entry.encounterIndex);
        const existing = statsMap.get(key) ?? { sum: 0, count: 0 };
        existing.sum += entry.damageDealt;
        existing.count++;
        statsMap.set(key, existing);
    }
    const result = new Map<string, number>();
    for (const [key, { sum, count }] of statsMap) {
        result.set(key, sum / count);
    }
    return result;
}

// ---------------------------------------------------------------------------
// Per-loop token counts
// ---------------------------------------------------------------------------

export interface LoopCountMaps {
    loopRaidNumber: Map<TacticusGuildRaidEntry, number>;
    loopBombNumber: Map<TacticusGuildRaidEntry, number>;
}

/**
 * Assigns sequential per-unitId loop counts to each entry, resetting all
 * counters when a boss is killed (encounterType === Boss && remainingHp === 0).
 */
export function buildLoopCountMaps(entries: TacticusGuildRaidEntry[]): LoopCountMaps {
    const loopRaidNumber = new Map<TacticusGuildRaidEntry, number>();
    const loopBombNumber = new Map<TacticusGuildRaidEntry, number>();
    const chronological = [...entries].toSorted((a, b) => (a.completedOn ?? 0) - (b.completedOn ?? 0));
    const raidCounters = new Map<string, number>();
    const bombCounters = new Map<string, number>();
    for (const entry of chronological) {
        const isBomb = entry.damageType === TacticusDamageType.Bomb;
        const key = entry.unitId;
        if (isBomb) {
            bombCounters.set(key, (bombCounters.get(key) ?? 0) + 1);
        } else {
            raidCounters.set(key, (raidCounters.get(key) ?? 0) + 1);
        }
        loopRaidNumber.set(entry, raidCounters.get(key) ?? 0);
        loopBombNumber.set(entry, bombCounters.get(key) ?? 0);
        if (entry.encounterType === TacticusEncounterType.Boss && entry.remainingHp === 0) {
            raidCounters.clear();
            bombCounters.clear();
        }
    }
    return { loopRaidNumber, loopBombNumber };
}

// ---------------------------------------------------------------------------
// Token table sorting
// ---------------------------------------------------------------------------

export interface GuildTokenEntryWithDisplay {
    userId: string;
    displayName: string;
    tokens: number | null | undefined;
    nextTokenAtUtc: number | null | undefined;
    bombAvailableAtUtc: number | null | undefined;
}

export function sortTokenEntries(entries: GuildTokenEntryWithDisplay[]): GuildTokenEntryWithDisplay[] {
    return entries.toSorted((a, b) => {
        const aTokens = a.tokens ?? -1;
        const bTokens = b.tokens ?? -1;
        if (bTokens !== aTokens) return bTokens - aTokens;

        const aNext = a.nextTokenAtUtc ?? 0;
        const bNext = b.nextTokenAtUtc ?? 0;
        if (aNext !== bNext) return aNext - bNext;

        return a.displayName.localeCompare(b.displayName);
    });
}

export function sortBombEntries(entries: GuildTokenEntryWithDisplay[]): GuildTokenEntryWithDisplay[] {
    // "has bomb" (bombAvailableAtUtc null = bomb ready) sorts above "no bomb"
    return entries.toSorted((a, b) => {
        const aHas = a.tokens != undefined && a.bombAvailableAtUtc == undefined ? 1 : 0;
        const bHas = b.tokens != undefined && b.bombAvailableAtUtc == undefined ? 1 : 0;
        if (bHas !== aHas) return bHas - aHas;

        const aNext = a.bombAvailableAtUtc ?? 0;
        const bNext = b.bombAvailableAtUtc ?? 0;
        if (bNext !== aNext) return bNext - aNext;

        return a.displayName.localeCompare(b.displayName);
    });
}

export function formatTime(utcSeconds: number): string {
    return new Date(utcSeconds * 1000).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
    });
}

// ---------------------------------------------------------------------------
// Damage-tab filters
// ---------------------------------------------------------------------------

/** Human-readable name for each GuildBoss{N} prefix. */
export const bossPrefixDisplayNames: Record<string, string> = {
    GuildBoss1: 'Tervigon',
    GuildBoss2: 'Hive Tyrant',
    GuildBoss3: 'Silent King',
    GuildBoss4: 'Ghazghkull',
    GuildBoss5: 'Mortarion',
    GuildBoss6: 'Screamer-Killer',
    GuildBoss7: 'Rogaldorn',
    GuildBoss8: 'Avatar of Khaine',
    GuildBoss9: 'Magnus',
    GuildBoss10: 'Belisarius Cawl',
    GuildBoss11: 'Riptide',
    GuildBoss12: 'Lion',
};

/** Extracts the `GuildBoss{N}` prefix from any raid entry unitId. */
export function getBossPrefix(unitId: string): string {
    return /^(GuildBoss\d+)/.exec(unitId)?.[1] ?? unitId;
}

/**
 * Single-letter rarity codes. All six initials are distinct, so no disambiguation is needed.
 */
const RARITY_CODE: Record<Rarity, string> = {
    [Rarity.Common]: 'C',
    [Rarity.Uncommon]: 'U',
    [Rarity.Rare]: 'R',
    [Rarity.Epic]: 'E',
    [Rarity.Legendary]: 'L',
    [Rarity.Mythic]: 'M',
};

/**
 * The difficulty tier label — `M1`, `L5` — where the digit is the 1-based `set` index within the
 * rarity. This is how the game names a boss on the ladder, and the Overview panel, the Leaderboard
 * band pill, the Discord summary and the Loops board all have to agree on it.
 *
 * Older aggregates omit `set`, in which case this degrades to the bare rarity letter (`M`) rather
 * than inventing a tier number.
 */
export function tierLabel(rarity: Rarity, set?: number): string {
    return `${RARITY_CODE[rarity]}${Number.isFinite(set) ? (set as number) + 1 : ''}`;
}

/** Round portrait + display name for a boss filter option, resolved from its representative unitId
 *  (see {@link BossFilterOption}) — full-fidelity per character, unlike the old prefix-keyed map
 *  this replaced, which always resolved a shared family prefix to whichever unitId happened to be
 *  listed first (e.g. every Hive Tyrant variant showing Leviathan's icon). */
export function bossIconFor(option: BossFilterOption): { icon: string | undefined; name: string } {
    return {
        icon: unitRoundIconMap[option.unitId],
        name: bossPrefixDisplayNames[getBossPrefix(option.unitId)] ?? option.unitId,
    };
}

/**
 * The boss family's position in the fixed game rotation, parsed from `GuildBoss{N}` — this matches
 * the API `set` ordering (within a rarity, sets advance with the boss number) and is used to sort
 * historical rows, which lack `set`. Boss HP is NOT monotonic with order, so it can't substitute.
 * Unknown ids return -1 so they sort last under the descending sort the views use.
 */
export function getBossOrder(unitId: string): number {
    const match = /GuildBoss(\d+)/.exec(unitId);
    return match ? Number.parseInt(match[1], 10) : -1;
}

/**
 * Resolves a player's display name. An undefined id means the row was anonymized (another member
 * in a keyless member's view) and shows as "Anonymous"; otherwise falls back to the raw id.
 */
export function resolvePlayerName(playerId: string | undefined, names: Map<string, string>): string {
    if (playerId === undefined) return 'Anonymous';
    return names.get(playerId) ?? obfuscateUserId(playerId);
}

/**
 * Union of all named players across the live current season and every historical season, sorted by
 * display name. Used for the page-level player select that stays sticky across tabs and seasons.
 * Anonymized rows (no id) are skipped.
 */
export function getAllGuildPlayers(
    currentEntries: TacticusGuildRaidEntry[],
    seasonData: GuildSeasonHistoryEntry[],
    names: Map<string, string>
): { userId: string; displayName: string }[] {
    const seen = new Map<string, string>();
    for (const entry of currentEntries) {
        if (!seen.has(entry.userId)) seen.set(entry.userId, resolvePlayerName(entry.userId, names));
    }
    for (const entry of seasonData) {
        for (const player of entry.summary?.damageSummary.textData.playerData ?? []) {
            if (player.playerId !== undefined && !seen.has(player.playerId)) {
                seen.set(player.playerId, resolvePlayerName(player.playerId, names));
            }
        }
    }
    return [...seen.entries()]
        .map(([userId, displayName]) => ({ userId, displayName }))
        .toSorted((a, b) => a.displayName.localeCompare(b.displayName));
}

/**
 * Merges an extra (typically the fresh current-season) summary into a list of season summaries,
 * deduped by season number with the extra winning. Sorted ascending by season. Used for keyless
 * members, whose current season arrives separately from the stored history.
 */
export function mergeSeasonSummaries(
    seasons: GuildSeasonHistoryEntry[],
    extra: GuildSeasonSummary
): GuildSeasonHistoryEntry[] {
    const bySeason = new Map<number, GuildSeasonHistoryEntry>();
    for (const entry of seasons) bySeason.set(entry.season, entry);
    const existing = bySeason.get(extra.season);
    bySeason.set(
        extra.season,
        existing
            ? { ...existing, summary: extra }
            : { season: extra.season, status: SeasonFetchStatus.Found, summary: extra }
    );
    return [...bySeason.values()].toSorted((a, b) => a.season - b.season);
}

/**
 * Unique identity for one boss "slot" in this season's ladder: a specific `GuildBoss{N}` family, at
 * a specific rarity, at a specific position (`set`) within that rarity. Two boss variants that
 * happen to share a family number but occupy different slots this season — e.g. this season's two
 * Hive Tyrant reskins — get different keys; a boss's own primes, which always share its exact
 * rarity and set, share its key.
 */
export function getBossSlotKey(unitId: string, rarity: Rarity, set: number): string {
    return `${getBossPrefix(unitId)}:${rarity}:${set}`;
}

export interface BossFilterOption {
    /** Opaque key from {@link getBossSlotKey} — compare entries against this (via the same
     *  function) to filter, and pass the option to {@link bossIconFor} for its icon/name. */
    key: string;
    /** The slot's own boss unitId when known, otherwise (rarity/set hit only via a prime) one of
     *  its primes'. */
    unitId: string;
    rarity: Rarity;
    set: number;
}

/**
 * One {@link BossFilterOption} per boss slot present in `occurrences`, ascending by rarity then
 * set — the order the guild actually meets them in this season.
 *
 * This is the single ordering for every boss filter on the page. It replaces sorting by the
 * `GuildBoss{N}` number, which is Snowprint's roster index: it is neither the order bosses appear
 * in a season nor correlated with difficulty, so it produced a sequence that matched nothing on
 * screen. `set` is the position within a rarity tier, so (rarity, set) reconstructs the run.
 *
 * Primes are included when present — they share their boss's rarity and set, so they land in the
 * same slot as their boss, keeping a family listed even if only its primes were hit. A slot's own
 * boss occurrence (`encounterIndex` 0) is always preferred as the option's representative unitId
 * over a prime's, so the filter button's icon is the boss's own whenever it's known.
 */
export function orderBossesByEncounter(
    occurrences: Iterable<{ unitId: string; rarity: Rarity; set: number; encounterIndex: number }>
): BossFilterOption[] {
    const bySlot = new Map<string, BossFilterOption & { isBoss: boolean }>();
    for (const { unitId, rarity, set, encounterIndex } of occurrences) {
        const key = getBossSlotKey(unitId, rarity, set);
        const isBoss = encounterIndex === 0;
        const current = bySlot.get(key);
        if (current === undefined || (isBoss && !current.isBoss)) {
            bySlot.set(key, { key, unitId, rarity, set, isBoss });
        }
    }
    return [...bySlot.values()]
        .toSorted((a, b) => (a.rarity === b.rarity ? a.set - b.set : a.rarity - b.rarity))
        .map(({ key, unitId, rarity, set }) => ({ key, unitId, rarity, set }));
}

/**
 * Boss slots present in `entries`, in encounter order.
 * Pass `rarities` to restrict to a selected subset; omit it when the caller has already filtered.
 */
export function getAvailableBosses(entries: TacticusGuildRaidEntry[], rarities?: Set<Rarity>): BossFilterOption[] {
    return orderBossesByEncounter(
        entries
            .filter(entry => rarities === undefined || rarities.has(entry.rarity))
            .map(entry => ({
                unitId: entry.unitId,
                rarity: entry.rarity,
                set: entry.set,
                encounterIndex: entry.encounterIndex,
            }))
    );
}

/**
 * Returns the default rarity filter for the given rarities.
 * Defaults to the highest rarity present; if that is Legendary, also
 * includes Mythic so top-tier content is always shown together.
 */
export function computeDefaultRaritiesFromRarities(rarities: Rarity[]): Rarity[] {
    if (rarities.length === 0) return [Rarity.Common];
    const maxRarity = Math.max(...rarities) as Rarity;
    if (maxRarity >= Rarity.Legendary) return [Rarity.Legendary, Rarity.Mythic];
    return [maxRarity];
}

/** {@link computeDefaultRaritiesFromRarities} over the rarities present in `entries`. */
export function computeDefaultRarities(entries: TacticusGuildRaidEntry[]): Rarity[] {
    return computeDefaultRaritiesFromRarities(entries.map(entry => entry.rarity));
}

// ---------------------------------------------------------------------------
// Boss/prime display resolution for the Overview tab
// ---------------------------------------------------------------------------

export type BossDisplayHp =
    | { kind: 'actual'; remaining: number; max: number }
    | { kind: 'full'; max: number }
    | { kind: 'fullUnknown' };

export interface EncounterDisplay {
    /** unitId to look up the portrait. */
    unitId: string;
    displayName: string;
    hp: BossDisplayHp;
    fakeChar?: ISnapshotCharacter;
    portraitUrl?: string;
}

export interface PrimeModifierProgress {
    totalModifiers: number;
    modifiersHit: number;
    nextTarget?: { remainingHp: number; description: string; modifierKey: string };
}

export interface PrimeDisplay extends EncounterDisplay {
    modifierProgress?: PrimeModifierProgress;
}

export interface BossOverviewDisplay {
    boss: EncounterDisplay;
    leftPrime?: PrimeDisplay;
    rightPrime?: PrimeDisplay;
    /** True when we're showing the upcoming boss rather than the one that just died. */
    isNextBoss: boolean;
    /** Shared by the boss and both primes, since they're all the same tier's encounter. */
    rarity: Rarity;
    /** 0-based index of this set within its rarity tier; display as setIndex + 1 for a 1-based label. */
    tierSetIndex: number;
}

/** Newest entry matching `unitId`, optionally restricted to strictly after `openedAfter`. */
function latestMatchingEntry(
    entries: TacticusGuildRaidEntry[],
    unitId: string,
    openedAfter: number | undefined
): TacticusGuildRaidEntry | undefined {
    const matches = entries.filter(
        entry => entry.unitId === unitId && (openedAfter === undefined || (entry.completedOn ?? 0) > openedAfter)
    );
    return matches.toSorted((a, b) => (b.completedOn ?? 0) - (a.completedOn ?? 0))[0];
}

/**
 * HP for a boss we've just advanced to (the previous boss just died). Any match here can only be
 * a stale record from an earlier Legendary/Mythic loop around this exact `unitId` — a fresher hit
 * on this boss would itself have been the globally-latest boss entry, so it's shown at full HP
 * rather than mistaken for "still dead this loop."
 */
function resolveAdvancedBossHp(entries: TacticusGuildRaidEntry[], unitId: string, openedAfter: number): BossDisplayHp {
    const latest = latestMatchingEntry(entries, unitId, openedAfter);
    return latest ? { kind: 'full', max: latest.maxHp } : { kind: 'fullUnknown' };
}

/** Upgrades an unresolved `'fullUnknown'` HP to `'full'` using the unit's static max HP from
 *  game data, when raid history has no record to derive HP from. Leaves other kinds as-is. */
function withKnownMax(hp: BossDisplayHp, knownMax: number | undefined): BossDisplayHp {
    if (hp.kind !== 'fullUnknown' || knownMax === undefined) return hp;
    return { kind: 'full', max: knownMax };
}

/** HP for a prime, which can be hit or killed independently of its boss's own state. */
function resolvePrimeHp(
    entries: TacticusGuildRaidEntry[],
    unitId: string,
    openedAfter: number | undefined
): BossDisplayHp {
    const latest = latestMatchingEntry(entries, unitId, openedAfter);
    return latest ? { kind: 'actual', remaining: latest.remainingHp, max: latest.maxHp } : { kind: 'fullUnknown' };
}

/** Modifier hit-progress for a prime with known total HP; omitted when HP (and thus scaling) is unknown. */
function resolveModifierProgress(
    modifiers: GuildBossEncounterModifier[] | undefined,
    hp: BossDisplayHp
): PrimeModifierProgress | undefined {
    if (!modifiers || modifiers.length === 0 || hp.kind === 'fullUnknown') return undefined;

    const max = hp.max;
    const hpLost = hp.kind === 'full' ? 0 : max - hp.remaining;
    const scaled = sortModifiersByHpLost(scaleModifierHpLost(modifiers, max));
    const modifiersHit = scaled.filter(m => m.hpLost <= hpLost).length;
    const nextModifierEntry = scaled.find(m => m.hpLost > hpLost);

    let nextTarget: { remainingHp: number; description: string; modifierKey: string } | undefined;
    if (nextModifierEntry) {
        const modifierDefinition = guildBossData.modifiers[nextModifierEntry.modifier];
        if (modifierDefinition) {
            nextTarget = {
                remainingHp: max - nextModifierEntry.hpLost,
                description: describeModifier(modifierDefinition),
                modifierKey: nextModifierEntry.modifier,
            };
        }
    }

    return { totalModifiers: scaled.length, modifiersHit, nextTarget };
}

function resolvePrimeDisplay(
    entries: TacticusGuildRaidEntry[],
    encounter: GuildBossEncounter | undefined,
    openedAfter: number | undefined
): PrimeDisplay | undefined {
    if (!encounter) return undefined;
    const unitSetId = getUnitSetId(encounter.unitId);
    const unitSet = getUnitSet(encounter.unitId);
    const statsIndex = encounterStatsIndex(encounter.unitId);
    const stats = unitSet ? getStatsAtIndex(unitSet, statsIndex) : undefined;
    const hp = withKnownMax(resolvePrimeHp(entries, unitSetId, openedAfter), stats?.Health);
    const portraitPath = resolvePrimeRegularPortraitPath(unitSetId, unitSet?.questUnitId);
    const fakeChar: ISnapshotCharacter | undefined = stats
        ? {
              id: unitSetId,
              rank: (stats.Rank + 1) as Rank,
              rarity: RarityMapper.stringToRarity(stats.BaseRarity) ?? Rarity.Common,
              stars: stats.StarLevel as RarityStars,
              shards: 0,
              mythicShards: 0,
              activeAbilityLevel: stats.AbilityLevel,
              passiveAbilityLevel: stats.AbilityLevel,
              xpLevel: 0,
          }
        : undefined;
    return {
        unitId: unitSetId,
        displayName: resolvePrimeDisplayName(unitSetId) ?? getUnitDisplayName(unitSetId),
        hp,
        modifierProgress: resolveModifierProgress(encounter.modifiers, hp),
        fakeChar,
        portraitUrl: portraitPath ? getImageUrl(portraitPath) : undefined,
    };
}

/**
 * Resolves what to show in the boss/prime panel on the Overview tab, using the season config to
 * deterministically compute "what's next" instead of guessing from damage history. This means a
 * boss/prime with zero recorded hits still displays correctly (at full HP) rather than the
 * previous boss being shown frozen at 0 HP.
 */
export function resolveBossOverviewDisplay(
    entries: TacticusGuildRaidEntry[],
    seasonConfigId: string
): BossOverviewDisplay | undefined {
    const config = getSeasonConfig(seasonConfigId);
    if (!config) return undefined;

    const sorted = [...entries].toSorted((a, b) => (b.completedOn ?? 0) - (a.completedOn ?? 0));
    const latestBoss = sorted.find(entry => entry.encounterType === TacticusEncounterType.Boss);

    // The moment the current boss/primes became active: the most recent time any boss died.
    // Everything after this point belongs to the current position — including a still-alive boss's
    // earlier prime kills — while anything before it is stale (a prior boss, or an earlier
    // Legendary/Mythic loop through the same unitId).
    const lastBossKill = sorted.find(
        entry => entry.encounterType === TacticusEncounterType.Boss && entry.remainingHp === 0
    );
    const openedAfter = lastBossKill?.completedOn;

    let position: EncounterPosition;
    let bossHp: BossDisplayHp;
    let isNextBoss = false;

    if (!latestBoss) {
        position = { tierIndex: 0, setIndex: 0 };
        bossHp = { kind: 'fullUnknown' };
    } else if (latestBoss.remainingHp > 0) {
        const unitSetId = getUnitSetId(latestBoss.unitId);
        position = findPositionByBossUnitSetId(config, unitSetId, latestBoss.rarity) ?? { tierIndex: 0, setIndex: 0 };
        bossHp = { kind: 'actual', remaining: latestBoss.remainingHp, max: latestBoss.maxHp };
    } else {
        isNextBoss = true;
        const unitSetId = getUnitSetId(latestBoss.unitId);
        const deadPosition = findPositionByBossUnitSetId(config, unitSetId, latestBoss.rarity);
        position = getNextEncounterPosition(config, deadPosition);
        bossHp = { kind: 'fullUnknown' }; // refined below once the new boss's unitId is known
    }

    const { boss, leftPrime, rightPrime } = getEncountersAtPosition(config, position);
    if (!boss) return undefined;

    if (isNextBoss) {
        bossHp = resolveAdvancedBossHp(entries, getUnitSetId(boss.unitId), openedAfter ?? 0);
    }

    const bossUnitSetId = getUnitSetId(boss.unitId);
    const bossUnitSet = getUnitSet(boss.unitId);
    const bossStatsIndex = encounterStatsIndex(boss.unitId);
    const bossStats = bossUnitSet ? getStatsAtIndex(bossUnitSet, bossStatsIndex) : undefined;
    bossHp = withKnownMax(bossHp, bossStats?.Health);
    const tierRarity = getTierRarity(config.tiers[position.tierIndex].tier);
    const bossRarity = (bossStats ? RarityMapper.stringToRarity(bossStats.BaseRarity) : undefined) ?? tierRarity;
    const bossPortraitPath = bossPortraitMap[bossUnitSetId];
    const bossFakeChar: ISnapshotCharacter | undefined = bossStats
        ? {
              id: bossUnitSetId,
              rank: (bossStats.Rank + 1) as Rank,
              rarity: bossRarity,
              stars: bossStats.StarLevel as RarityStars,
              shards: 0,
              mythicShards: 0,
              activeAbilityLevel: bossStats.AbilityLevel,
              passiveAbilityLevel: bossStats.AbilityLevel,
              xpLevel: 0,
          }
        : undefined;

    const bossDisplay: EncounterDisplay = {
        unitId: bossUnitSetId,
        displayName: bossPrefixDisplayNames[getBossPrefix(bossUnitSetId)] ?? getUnitDisplayName(bossUnitSetId),
        hp: bossHp,
        fakeChar: bossFakeChar,
        portraitUrl: bossPortraitPath ? getImageUrl(bossPortraitPath) : undefined,
    };

    return {
        boss: bossDisplay,
        leftPrime: resolvePrimeDisplay(entries, leftPrime, openedAfter),
        rightPrime: resolvePrimeDisplay(entries, rightPrime, openedAfter),
        isNextBoss,
        rarity: tierRarity,
        tierSetIndex: position.setIndex,
    };
}

/**
 * Given a GuildBoss unit ID, returns the best display name:
 * - For main bosses: uses the boss family name from bossPrefixDisplayNames
 * - For primes/minions: extracts the last two CamelCase words (the snowprint ID),
 *   looks up the character, and returns their shortName if found, otherwise the
 *   last-two-words string, otherwise the raw unitId.
 */
export function unitDisplayLabel(unitId: string): string {
    const bossPrefix = /^(GuildBoss\d+)/.exec(unitId)?.[1];

    const primeMatch = /(?:MiniBoss|Minion)\d+(.+)/.exec(unitId);
    if (primeMatch) {
        const tail = primeMatch[1];
        const snowprintId = tail.charAt(0).toLowerCase() + tail.slice(1);
        const character = CharactersService.getUnit(snowprintId);
        if (character) return character.shortName;
        return tail.split(/(?=[A-Z])/).join(' ');
    }

    if (bossPrefix !== undefined) return bossPrefixDisplayNames[bossPrefix] ?? unitId;

    return unitId;
}
