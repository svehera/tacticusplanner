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
import { Rarity } from '@/fsd/5-shared/model';

// ---------------------------------------------------------------------------
// Icon maps — derived from src/assets/visual_mapping/visuals.csv
// ---------------------------------------------------------------------------

/** Round portraits for each boss / prime / minion unitId. */
export const unitRoundIconMap: Record<string, string> = {
    // Boss 1 – Tervigon (portrait only, no RoundPortrait available)
    GuildBoss1Boss1TyranTervigonLeviathan: 'snowprint_assets/characters/ui_image_portrait_guild_tervigon_01.png',
    GuildBoss1Boss2TyranTervigonKronos: 'snowprint_assets/characters/ui_image_portrait_guild_tervigon_02.png',
    GuildBoss1Boss3TyranTervigonGorgon: 'snowprint_assets/characters/ui_image_portrait_guild_tervigon_03.png',
    GuildBoss1MiniBoss1TyranWarriorLeviathan: 'snowprint_assets/characters/ui_image_RoundPortrait_tyran_warrior_01.png',
    GuildBoss1MiniBoss2TyranWarriorKronos: 'snowprint_assets/characters/ui_image_RoundPortrait_tyran_warrior_02.png',
    GuildBoss1MiniBoss3TyranWarriorGorgon: 'snowprint_assets/characters/ui_image_RoundPortrait_tyran_warrior_03.png',
    // Boss 2 – Hive Tyrant
    GuildBoss2Boss1TyranHiveTyrantLeviathan: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_tyrant_01.png',
    GuildBoss2Boss2TyranHiveTyrantKronos: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_tyrant_02.png',
    GuildBoss2Boss3TyranHiveTyrantGorgon: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_tyrant_03.png',
    // Boss 3 – Silent King + Minions
    GuildBoss3Boss1NecroSilentKing: 'snowprint_assets/characters/ui_image_RoundPortrait_necro_silentking_01.png',
    GuildBoss3Minion1NecroMesophet: 'snowprint_assets/characters/ui_image_RoundPortrait_necro_mesophet_01.png',
    GuildBoss3Minion2NecroHapthatra: 'snowprint_assets/characters/ui_image_RoundPortrait_necro_hapthatra_01.png',
    GuildBoss3Minion3NecroMenhir: 'snowprint_assets/characters/ui_image_RoundPortrait_necro_menhir_01.png',
    // Boss 4 – Ghazghkull
    GuildBoss4Boss1OrksGhazghkull: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_ghazghkull_01.png',
    // Boss 5 – Mortarion + Minion
    GuildBoss5Boss1DeathMortarion: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_mortarion_01.png',
    GuildBoss5Minion1DeathBlightlord: 'snowprint_assets/characters/ui_image_RoundPortrait_death_blightlord_01.png',
    // Boss 6 – Screamer-killer
    GuildBoss6Boss1TyranScreamerKiller:
        'snowprint_assets/characters/ui_image_RoundPortrait_guild_screamerkiller_01.png',
    // Boss 7 – Rogaldorn
    GuildBoss7Boss1AstraRogaldorn: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_rogaldorn_01.png',
    // Boss 8 – Avatar of Khaine
    GuildBoss8Boss1EldarAvatar: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_avatar_01.png',
    // Boss 9 – Magnus
    GuildBoss9Boss1ThousMagnus: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_magnus_01.png',
    // Boss 10 – Belisarius Cawl
    GuildBoss10Boss1AdmecBelisarius: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_belisarius_01.png',
    // Boss 11 – Riptide
    GuildBoss11Boss1TauRiptide: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_riptide_01.png',
    // Boss 12 - The Lion
    GuildBoss12Boss1DarkaLion: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_lion_01.png',
};

/** Full (non-round) portraits for main boss unitIds, used in the Overview tab. */
export const bossPortraitMap: Record<string, string> = {
    GuildBoss1Boss1TyranTervigonLeviathan: 'snowprint_assets/characters/ui_image_portrait_guild_tervigon_01.png',
    GuildBoss1Boss2TyranTervigonKronos: 'snowprint_assets/characters/ui_image_portrait_guild_tervigon_02.png',
    GuildBoss1Boss3TyranTervigonGorgon: 'snowprint_assets/characters/ui_image_portrait_guild_tervigon_03.png',
    GuildBoss2Boss1TyranHiveTyrantLeviathan: 'snowprint_assets/characters/ui_image_portrait_guild_tyrant_01.png',
    GuildBoss2Boss2TyranHiveTyrantKronos: 'snowprint_assets/characters/ui_image_portrait_guild_tyrant_02.png',
    GuildBoss2Boss3TyranHiveTyrantGorgon: 'snowprint_assets/characters/ui_image_portrait_guild_tyrant_03.png',
    GuildBoss3Boss1NecroSilentKing: 'snowprint_assets/characters/ui_image_portrait_necro_silentking_01.png',
    GuildBoss4Boss1OrksGhazghkull: 'snowprint_assets/characters/ui_image_portrait_guild_ghazghkull_01.png',
    GuildBoss5Boss1DeathMortarion: 'snowprint_assets/characters/ui_image_portrait_guild_mortarion_01.png',
    GuildBoss6Boss1TyranScreamerKiller: 'snowprint_assets/characters/ui_image_portrait_guild_screamerkiller_01.png',
    GuildBoss7Boss1AstraRogaldorn: 'snowprint_assets/characters/ui_image_portrait_guild_rogaldorn_01.png',
    GuildBoss8Boss1EldarAvatar: 'snowprint_assets/characters/ui_image_portrait_guild_avatar_01.png',
    GuildBoss9Boss1ThousMagnus: 'snowprint_assets/characters/ui_image_portrait_guild_magnus_01.png',
    GuildBoss10Boss1AdmecBelisarius: 'snowprint_assets/characters/ui_image_portrait_guild_belisarius_01.png',
    GuildBoss11Boss1TauRiptide: 'snowprint_assets/characters/ui_image_portrait_guild_riptide_01.png',
    GuildBoss12Boss1DarkaLion: 'snowprint_assets/characters/ui_image_portrait_guild_lion_01.png',
};

/** Full portrait keyed by GuildBoss{N} prefix — first entry per prefix from bossPortraitMap. */
export const bossPrefixPortraitMap: Record<string, string> = (() => {
    const map: Record<string, string> = {};
    for (const unitId of Object.keys(bossPortraitMap)) {
        const prefix = /^(GuildBoss\d+)/.exec(unitId)?.[1];
        if (prefix !== undefined && map[prefix] === undefined) map[prefix] = unitId;
    }
    return map;
})();

// ---------------------------------------------------------------------------
// Damage colour coding
// ---------------------------------------------------------------------------

export function getDamageColorClass(entry: TacticusGuildRaidEntry, avgDamage: number | undefined): string {
    if (entry.damageType === TacticusDamageType.Bomb) return 'text-green-700 dark:text-green-400';
    if (entry.remainingHp === 0) return 'text-gray-400 dark:text-gray-500';
    if (avgDamage === undefined || avgDamage === 0) return 'text-green-700 dark:text-green-400';
    const ratio = entry.damageDealt / avgDamage;
    if (ratio >= 1.2) return 'animate-[shimmer-green_1.5s_ease-in-out_infinite]';
    if (ratio >= 0.8) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
}

// ---------------------------------------------------------------------------
// Average damage map
// ---------------------------------------------------------------------------

/**
 * Builds a map of `unitId:rarity` → average raid-token damage, excluding
 * entries that killed the boss/prime (remainingHp === 0) and bomb entries.
 */
export function buildAvgDamageMap(entries: TacticusGuildRaidEntry[]): Map<string, number> {
    const statsMap = new Map<string, { sum: number; count: number }>();
    for (const entry of entries) {
        if (entry.damageType === TacticusDamageType.Bomb) continue;
        if (entry.remainingHp === 0) continue;
        const key = `${entry.unitId}:${entry.rarity}`;
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

/**
 * Round-portrait icon path for each GuildBoss{N} prefix.
 * Built from unitRoundIconMap by taking the first icon per prefix.
 */
export const bossPrefixRoundIconMap: Record<string, string> = (() => {
    const map: Record<string, string> = {};
    for (const [unitId, icon] of Object.entries(unitRoundIconMap)) {
        const prefix = /^(GuildBoss\d+)/.exec(unitId)?.[1];
        if (prefix !== undefined && map[prefix] === undefined) map[prefix] = icon;
    }
    return map;
})();

/** Extracts the `GuildBoss{N}` prefix from any raid entry unitId. */
export function getBossPrefix(unitId: string): string {
    return /^(GuildBoss\d+)/.exec(unitId)?.[1] ?? unitId;
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

/** Dedupes and sorts GuildBoss{N} prefixes numerically (GuildBoss1, GuildBoss2, …, GuildBoss12). */
export function sortBossPrefixes(prefixes: Iterable<string>): string[] {
    return [...new Set(prefixes)].toSorted((a, b) => {
        const na = Number.parseInt(/GuildBoss(\d+)/.exec(a)?.[1] ?? '0', 10);
        const nb = Number.parseInt(/GuildBoss(\d+)/.exec(b)?.[1] ?? '0', 10);
        return na - nb;
    });
}

/**
 * Returns unique GuildBoss{N} prefixes present in `entries`, sorted
 * numerically (GuildBoss1, GuildBoss2, …, GuildBoss12).
 */
export function getAvailableBossPrefixes(entries: TacticusGuildRaidEntry[]): string[] {
    return sortBossPrefixes(entries.map(entry => getBossPrefix(entry.unitId)));
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
// Boss display resolution for the Overview tab
// ---------------------------------------------------------------------------

export type BossDisplayHp =
    | { kind: 'actual'; remaining: number; max: number }
    | { kind: 'full'; max: number }
    | { kind: 'fullUnknown' };

export interface BossDisplay {
    /** unitId to look up the portrait. */
    unitId: string;
    displayName: string;
    hp: BossDisplayHp;
    /** True when we're showing the upcoming boss rather than the one that just died. */
    isNextBoss?: boolean;
}

interface SeasonLMBossInfo {
    bossPrefix: string;
    rarity: Rarity;
    set: number;
    unitId: string;
    maxHp: number;
}

/**
 * Ordered list of unique (bossPrefix, rarity) pairs for Legendary/Mythic bosses seen in
 * `entries`. Sorted Legendary-first by set number, then Mythic by set number — matching the
 * in-game loop sequence: L1 → L2 → … → Ln → M1 → … → Mm → L1.
 */
function buildSeasonLMBossList(entries: TacticusGuildRaidEntry[]): SeasonLMBossInfo[] {
    const seen = new Map<string, SeasonLMBossInfo>();
    for (const entry of entries) {
        if (entry.encounterType !== TacticusEncounterType.Boss) continue;
        if (entry.rarity < Rarity.Legendary) continue;
        const prefix = getBossPrefix(entry.unitId);
        const key = `${prefix}:${entry.rarity}`;
        if (!seen.has(key)) {
            seen.set(key, {
                bossPrefix: prefix,
                rarity: entry.rarity,
                set: entry.set,
                unitId: entry.unitId,
                maxHp: entry.maxHp,
            });
        }
    }
    return [...seen.values()].toSorted((a, b) => {
        if (a.rarity !== b.rarity) {
            // Legendary (4) before Mythic (5)
            return a.rarity - b.rarity;
        }
        return a.set - b.set;
    });
}

/**
 * Resolves what to show in the "Current Boss" card on the Overview tab.
 *
 * For Epic-or-lower bosses: always show the boss as-is (even at HP 0).
 * For Legendary/Mythic bosses at HP 0:
 *   - If a new encounter has started but only primes have been hit, show the new boss.
 *     Display "HP Full" (unknown max) if we've never seen that boss before, or the known
 *     max HP if we have a previous entry for it.
 *   - If nothing has happened since the boss died and the guild has looped (kill count > 1),
 *     show the next boss in the season sequence at full HP.
 *   - Otherwise show the dead boss at HP 0.
 */
export function resolveBossDisplay(entries: TacticusGuildRaidEntry[]): BossDisplay | undefined {
    if (entries.length === 0) return undefined;

    const nameFor = (unitId: string): string => bossPrefixDisplayNames[getBossPrefix(unitId)] ?? unitId;

    const sorted = [...entries].toSorted((a, b) => (b.completedOn ?? 0) - (a.completedOn ?? 0));

    const latestBoss = sorted.find(entry => entry.encounterType === TacticusEncounterType.Boss);
    if (!latestBoss) return undefined;

    // Epic or lower: show as-is (current behaviour, no next-boss logic).
    if (latestBoss.rarity < Rarity.Legendary) {
        return {
            unitId: latestBoss.unitId,
            displayName: nameFor(latestBoss.unitId),
            hp: { kind: 'actual', remaining: latestBoss.remainingHp, max: latestBoss.maxHp },
        };
    }

    // L/M boss still alive: show normally.
    if (latestBoss.remainingHp > 0) {
        return {
            unitId: latestBoss.unitId,
            displayName: nameFor(latestBoss.unitId),
            hp: { kind: 'actual', remaining: latestBoss.remainingHp, max: latestBoss.maxHp },
        };
    }

    // L/M boss is dead.
    const deadPrefix = getBossPrefix(latestBoss.unitId);
    const deadTime = latestBoss.completedOn ?? 0;

    const killCount = entries.filter(
        entry =>
            entry.encounterType === TacticusEncounterType.Boss &&
            getBossPrefix(entry.unitId) === deadPrefix &&
            entry.rarity === latestBoss.rarity &&
            entry.remainingHp === 0
    ).length;

    // Any SideBoss entries recorded after the boss kill?
    const postKillPrimes = sorted.filter(
        entry => entry.encounterType === TacticusEncounterType.SideBoss && (entry.completedOn ?? 0) > deadTime
    );

    if (postKillPrimes.length > 0) {
        const latestPrime = postKillPrimes[0]!;
        const newPrefix = getBossPrefix(latestPrime.unitId);

        // Guard: same prefix + first kill → likely a trailing prime from the just-completed
        // encounter recorded slightly after the boss kill. Treat as "nothing happened since."
        const isNewEncounter = !(newPrefix === deadPrefix && killCount === 1);

        if (isNewEncounter) {
            const newRarity = latestPrime.rarity;
            const existingBossEntry = entries.find(
                entry =>
                    entry.encounterType === TacticusEncounterType.Boss &&
                    getBossPrefix(entry.unitId) === newPrefix &&
                    entry.rarity === newRarity
            );
            if (existingBossEntry) {
                return {
                    unitId: existingBossEntry.unitId,
                    displayName: nameFor(existingBossEntry.unitId),
                    hp: { kind: 'full', max: existingBossEntry.maxHp },
                    isNextBoss: true,
                };
            }
            // No prior boss entry for this prefix — use a prefix-based portrait unitId.
            const portraitUnitId = bossPrefixPortraitMap[newPrefix] ?? latestPrime.unitId;
            return {
                unitId: portraitUnitId,
                displayName: bossPrefixDisplayNames[newPrefix] ?? newPrefix,
                hp: { kind: 'fullUnknown' },
                isNextBoss: true,
            };
        }
    }

    // Nothing meaningful happened since the boss died.
    if (killCount > 1) {
        // Guild has looped — show the next boss in the season sequence.
        const seasonList = buildSeasonLMBossList(entries);
        const index = seasonList.findIndex(b => b.bossPrefix === deadPrefix && b.rarity === latestBoss.rarity);
        if (index !== -1) {
            const nextInfo = seasonList[(index + 1) % seasonList.length]!;
            const nextEntry = entries.find(
                entry =>
                    entry.encounterType === TacticusEncounterType.Boss &&
                    getBossPrefix(entry.unitId) === nextInfo.bossPrefix &&
                    entry.rarity === nextInfo.rarity
            );
            if (nextEntry) {
                return {
                    unitId: nextEntry.unitId,
                    displayName: nameFor(nextEntry.unitId),
                    hp: { kind: 'full', max: nextEntry.maxHp },
                    isNextBoss: true,
                };
            }
        }
    }

    // Not looped (or fallback): show the dead boss at HP 0.
    return {
        unitId: latestBoss.unitId,
        displayName: nameFor(latestBoss.unitId),
        hp: { kind: 'actual', remaining: 0, max: latestBoss.maxHp },
    };
}
