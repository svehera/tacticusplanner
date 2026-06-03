/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import {
    TacticusDamageType,
    TacticusEncounterType,
    type GuildSeasonSummary,
    type TacticusGuildRaidEntry,
} from '@/fsd/5-shared/lib/tacticus-api';
import { Rarity, RarityMapper } from '@/fsd/5-shared/model';

import { getBossPrefix } from '../guild-performance.utils';

export interface LoopTokenCounts {
    loopNumber: number;
    boss: number;
    left: number;
    right: number;
    total: number;
    /** Boss HP after the last attack in this loop (0 if killed). Undefined if no boss attacks. */
    finalRemainingHp: number | undefined;
}

export interface BossLoopRow {
    bossPrefix: string;
    rarity: Rarity;
    /** `set` from the API — sorts boss families within a rarity tier in game order. */
    set: number;
    bossUnitId: string;
    bossMaxHp: number;
    leftPrimeUnitId: string | undefined;
    rightPrimeUnitId: string | undefined;
    hasPrimes: boolean;
    loops: LoopTokenCounts[];
}

function maxMaxHp(entries: TacticusGuildRaidEntry[]): number {
    let max = 0;
    for (const entry of entries) {
        if (entry.maxHp > max) max = entry.maxHp;
    }
    return max;
}

/**
 * Assigns a global loop number to every legendary/mythic entry.
 *
 * Within a single loop, the guild fights bosses in increasing order — rarities
 * are non-decreasing (Legendary then Mythic) and within a rarity, sets advance
 * 0, 1, 2, …. A new loop has started when either:
 *   - rarity drops (e.g. Mythic → Legendary, looping back to the lowest tier), OR
 *   - rarity stays the same but `set` drops (Legendary-only loop wrapping back
 *     to set 0 after the last set was killed).
 *
 * Robust against cross-rarity unitId collisions and handles both Legendary-only
 * and Legendary+Mythic loop structures without needing to detect individual kills.
 */
function assignGlobalLoops(entries: TacticusGuildRaidEntry[]): Map<TacticusGuildRaidEntry, number> {
    const sorted = entries.toSorted((a, b) => (a.completedOn ?? 0) - (b.completedOn ?? 0));

    let globalLoop = 1;
    const result = new Map<TacticusGuildRaidEntry, number>();
    let lastEntry: TacticusGuildRaidEntry | undefined = undefined;

    for (const entry of sorted) {
        if (
            lastEntry !== undefined &&
            (entry.rarity < lastEntry.rarity || (entry.rarity === lastEntry.rarity && entry.set < lastEntry.set))
        ) {
            ++globalLoop;
        }
        result.set(entry, globalLoop);
        lastEntry = entry;
    }

    return result;
}

/**
 * Builds per-boss loop rows for the Loops tab.
 *
 * Only legendary/mythic entries are included. Bombs are kept for loop boundary
 * detection (via rarity/set ordering) but excluded from the displayed
 * boss/left/right token counts. Rows are sorted by boss max HP descending.
 */
export function buildBossLoopRows(entries: TacticusGuildRaidEntry[]): BossLoopRow[] {
    const legendaryAll = entries.filter(entry => entry.rarity >= Rarity.Legendary);
    if (legendaryAll.length === 0) return [];
    if (legendaryAll.every(entry => entry.damageType === TacticusDamageType.Bomb)) return [];

    const entryLoop = assignGlobalLoops(legendaryAll);

    // Group by GuildBoss{N} prefix + rarity (includes bombs for icon/prime detection)
    type GroupData = { bossEntries: TacticusGuildRaidEntry[]; primeEntries: TacticusGuildRaidEntry[] };
    const groups = new Map<string, GroupData>();

    for (const entry of legendaryAll) {
        const prefix = /^(GuildBoss\d+)/.exec(entry.unitId)?.[1] ?? entry.unitId;
        const key = `${prefix}:${entry.rarity}`;
        let group = groups.get(key);
        if (group === undefined) {
            group = { bossEntries: [], primeEntries: [] };
            groups.set(key, group);
        }
        if (entry.encounterType === TacticusEncounterType.Boss) {
            group.bossEntries.push(entry);
        } else {
            group.primeEntries.push(entry);
        }
    }

    const rows: BossLoopRow[] = [];

    for (const [key, { bossEntries, primeEntries }] of groups) {
        const colonIndex = key.lastIndexOf(':');
        const bossPrefix = key.slice(0, colonIndex);

        const anyEntry = bossEntries[0] ?? primeEntries[0];
        if (anyEntry === undefined) continue;

        const rarity = anyEntry.rarity;
        const bossUnitId =
            bossEntries.find(entry => entry.damageType !== TacticusDamageType.Bomb)?.unitId ??
            bossEntries[0]?.unitId ??
            '';
        const bossMaxHp = maxMaxHp(bossEntries);

        // Determine prime slots by encounterIndex (1 = left, 2 = right, ...). This
        // correctly handles cases like Silent King where left and right primes share
        // a unitId — they're separate slots in the encounter.
        const primeUnitByEncIndex = new Map<number, string>();
        for (const entry of primeEntries) {
            if (!primeUnitByEncIndex.has(entry.encounterIndex)) {
                primeUnitByEncIndex.set(entry.encounterIndex, entry.unitId);
            }
        }
        const sortedEncIdxs = [...primeUnitByEncIndex.keys()].toSorted((a, b) => a - b);
        const leftEncIndex = sortedEncIdxs[0];
        const rightEncIndex = sortedEncIdxs[1];
        const leftPrimeUnitId = leftEncIndex === undefined ? undefined : primeUnitByEncIndex.get(leftEncIndex);
        const rightPrimeUnitId = rightEncIndex === undefined ? undefined : primeUnitByEncIndex.get(rightEncIndex);

        // Aggregate non-bomb token counts by global loop number
        const loopCounts = new Map<number, { boss: number; left: number; right: number }>();

        for (const entry of [...bossEntries, ...primeEntries]) {
            if (entry.damageType === TacticusDamageType.Bomb) continue;

            const loopNumber = entryLoop.get(entry) ?? 1;
            let counts = loopCounts.get(loopNumber);
            if (counts === undefined) {
                counts = { boss: 0, left: 0, right: 0 };
                loopCounts.set(loopNumber, counts);
            }

            if (entry.encounterType === TacticusEncounterType.Boss) {
                counts.boss++;
            } else if (entry.encounterIndex === leftEncIndex) {
                counts.left++;
            } else {
                counts.right++;
            }
        }

        if (loopCounts.size === 0) continue;

        // Track boss HP at end of each loop using the chronologically-last boss
        // attack in that loop (bombs included — they reduce HP and can land kills)
        const loopFinalHp = new Map<number, { hp: number; t: number }>();
        for (const entry of bossEntries) {
            const loopNumber = entryLoop.get(entry) ?? 1;
            const t = entry.completedOn ?? 0;
            const current = loopFinalHp.get(loopNumber);
            if (current === undefined || t > current.t) {
                loopFinalHp.set(loopNumber, { hp: entry.remainingHp, t });
            }
        }

        const loops: LoopTokenCounts[] = [...loopCounts.entries()]
            .toSorted(([a], [b]) => a - b)
            .map(([loopNumber, { boss, left, right }]) => ({
                loopNumber,
                boss,
                left,
                right,
                total: boss + left + right,
                finalRemainingHp: loopFinalHp.get(loopNumber)?.hp,
            }));

        rows.push({
            bossPrefix,
            rarity,
            set: anyEntry.set,
            bossUnitId,
            bossMaxHp,
            leftPrimeUnitId,
            rightPrimeUnitId,
            hasPrimes: primeUnitByEncIndex.size > 0,
            loops,
        });
    }

    // Graphs are sorted descending: highest rarity / latest set first
    return rows.toSorted((a, b) => {
        if (a.rarity !== b.rarity) return b.rarity - a.rarity;
        return b.set - a.set;
    });
}

/**
 * Builds boss loop rows from a historical season aggregate. The aggregate stores per-loop token
 * counts directly (`summary.loops`), so no kill/loop-boundary inference is needed. Like the live
 * tab, only legendary/mythic encounters are shown.
 *
 * Two fields aren't in the aggregate: prime unit identities (cross-referenced from the per-enemy
 * `guildEntries`, which covers the top-2 rarities = the legendary/mythic shown here) and per-loop
 * final boss HP (omitted — historical rows don't show the "remaining" readout).
 */
export function buildBossLoopRowsFromSummary(summary: GuildSeasonSummary): BossLoopRow[] {
    // Prime unitIds keyed by `${bossPrefix}:${numericRarity}` (same key shape as the loop groups).
    const primeLookup = new Map<string, { left?: string; right?: string }>();
    for (const entry of summary.damageSummary.guildEntries) {
        const { enemyId, rarity, encounterIndex } = entry.enemyInfo;
        if (encounterIndex === 0) continue;
        const key = `${getBossPrefix(enemyId)}:${RarityMapper.stringToNumber[rarity]}`;
        const slot = primeLookup.get(key) ?? {};
        if (encounterIndex === 1) slot.left = enemyId;
        else if (encounterIndex === 2) slot.right = enemyId;
        primeLookup.set(key, slot);
    }

    interface GroupAccumulator {
        rarity: Rarity;
        bossUnitId: string;
        bossMaxHp: number;
        loops: LoopTokenCounts[];
    }
    const groups = new Map<string, GroupAccumulator>();
    for (const loop of summary.loops) {
        const rarity = RarityMapper.stringToNumber[loop.enemyInfo.rarity];
        if (rarity < Rarity.Legendary) continue;
        const key = `${getBossPrefix(loop.enemyInfo.enemyId)}:${rarity}`;
        let group = groups.get(key);
        if (group === undefined) {
            group = { rarity, bossUnitId: loop.enemyInfo.enemyId, bossMaxHp: loop.enemyInfo.maxHp, loops: [] };
            groups.set(key, group);
        }
        group.bossMaxHp = Math.max(group.bossMaxHp, loop.enemyInfo.maxHp);
        group.loops.push({
            loopNumber: loop.loopNumber,
            boss: loop.bossTokens,
            left: loop.leftPrimeTokens,
            right: loop.rightPrimeTokens,
            total: loop.bossTokens + loop.leftPrimeTokens + loop.rightPrimeTokens,
            finalRemainingHp: undefined,
        });
    }

    const rows: BossLoopRow[] = [];
    for (const [key, group] of groups) {
        const primes = primeLookup.get(key) ?? {};
        rows.push({
            bossPrefix: key.slice(0, key.lastIndexOf(':')),
            rarity: group.rarity,
            // No `set` in the aggregate; sort within a rarity by boss max HP instead.
            set: group.bossMaxHp,
            bossUnitId: group.bossUnitId,
            bossMaxHp: group.bossMaxHp,
            leftPrimeUnitId: primes.left,
            rightPrimeUnitId: primes.right,
            hasPrimes: group.loops.some(loop => loop.left > 0 || loop.right > 0),
            loops: group.loops.toSorted((a, b) => a.loopNumber - b.loopNumber),
        });
    }

    return rows.toSorted((a, b) => {
        if (a.rarity !== b.rarity) return b.rarity - a.rarity;
        return b.set - a.set;
    });
}
