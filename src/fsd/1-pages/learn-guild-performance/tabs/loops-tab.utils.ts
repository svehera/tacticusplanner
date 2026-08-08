/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import {
    TacticusDamageType,
    TacticusEncounterType,
    type GuildSeasonSummary,
    type TacticusGuildRaidEntry,
} from '@/fsd/5-shared/lib/tacticus-api';
import { Rarity, RarityMapper } from '@/fsd/5-shared/model';

import {
    findPositionByBossUnitSetId,
    getEncountersAtPosition,
    getSeasonConfig,
    getUnitSetId,
} from '@/fsd/4-entities/guild_boss';

import { getBossPrefix } from '../guild-performance.utils';

export interface LoopTokenCounts {
    loopNumber: number;
    boss: number;
    left: number;
    right: number;
    total: number;
    /** Boss HP after the last attack in this loop (0 if killed). Undefined if no boss attacks. */
    finalRemainingHp: number | undefined;
    /** Left prime's HP after the last attack on it in this loop (0 if killed). Undefined if none. */
    leftFinalRemainingHp: number | undefined;
    /** Right prime's HP after the last attack on it in this loop (0 if killed). Undefined if none. */
    rightFinalRemainingHp: number | undefined;
    /** Bomb hits across the boss and both primes. They spend no token, so they are not in the counts above. */
    bombs: number;
    /** Distinct members who hit any slot of this encounter in this loop. */
    players: number;
    /** Earliest / latest `completedOn` in this loop, for loop duration. Undefined when unknown. */
    firstCompletedOn: number | undefined;
    lastCompletedOn: number | undefined;
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

/** `encounterIndex` is 0 for the boss and 1/2 for its left and right primes. */
const LEFT_PRIME_INDEX = 1;
const RIGHT_PRIME_INDEX = 2;

/**
 * Ascending fight order — rarity, then `set`. The guild cannot skip a rung, so this is both the
 * order they meet the bosses in and the ladder's left-to-right axis.
 */
function compareByFightOrder(a: BossLoopRow, b: BossLoopRow): number {
    if (a.rarity !== b.rarity) return a.rarity - b.rarity;
    return a.set - b.set;
}

/**
 * One target's HP at the end of every loop it was attacked in — the `remainingHp` of the
 * chronologically-last attack on it in that loop, so `0` means it died. Bombs are included: they
 * reduce HP and can land the kill.
 *
 * Absent from the map means no attack was recorded, which is not the same as "survived".
 *
 * `completedOn` has second granularity, so two hits on one target can share a timestamp and the API
 * does not promise chronological order. HP only falls within a loop, so a tie is broken by the lower
 * `remainingHp` — otherwise a killing blow sharing its second with an earlier hit could be dropped
 * and the boss reported as still standing.
 */
function finalHpByLoop(
    targetEntries: TacticusGuildRaidEntry[],
    entryLoop: Map<TacticusGuildRaidEntry, number>
): Map<number, number> {
    const latest = new Map<number, { hp: number; completedOn: number }>();
    for (const entry of targetEntries) {
        const loopNumber = entryLoop.get(entry) ?? 1;
        const completedOn = entry.completedOn ?? 0;
        const current = latest.get(loopNumber);
        const isLater =
            current === undefined ||
            completedOn > current.completedOn ||
            (completedOn === current.completedOn && entry.remainingHp < current.hp);
        if (isLater) {
            latest.set(loopNumber, { hp: entry.remainingHp, completedOn });
        }
    }
    return new Map([...latest].map(([loopNumber, { hp }]) => [loopNumber, hp]));
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
 * boss/left/right token counts.
 *
 * Rows come back in **ascending fight order** — rarity, then `set`. That is the order the guild
 * meets them in and the only order the ladder means anything in; the Loops tab uses it directly as
 * its column axis.
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

        // Keyed by fixed encounterIndex, never by which indexes happen to appear: a rung whose left
        // prime is always skipped must not file its right-prime hits under "left". Silent King's twin
        // minions work here too — same unitId, different index.
        const primeUnitByEncIndex = new Map<number, string>();
        for (const entry of primeEntries) {
            if (!primeUnitByEncIndex.has(entry.encounterIndex)) {
                primeUnitByEncIndex.set(entry.encounterIndex, entry.unitId);
            }
        }
        const leftPrimeUnitId = primeUnitByEncIndex.get(LEFT_PRIME_INDEX);
        const rightPrimeUnitId = primeUnitByEncIndex.get(RIGHT_PRIME_INDEX);

        // Aggregate per-loop counts. A bomb spends no token, so it stays out of boss/left/right —
        // but it is still a hit, so it counts toward `bombs`, the player set and the loop time span.
        interface LoopAccumulator {
            boss: number;
            left: number;
            right: number;
            bombs: number;
            players: Set<string>;
            firstCompletedOn: number | undefined;
            lastCompletedOn: number | undefined;
        }
        const loopCounts = new Map<number, LoopAccumulator>();

        for (const entry of [...bossEntries, ...primeEntries]) {
            const loopNumber = entryLoop.get(entry) ?? 1;
            let counts = loopCounts.get(loopNumber);
            if (counts === undefined) {
                counts = {
                    boss: 0,
                    left: 0,
                    right: 0,
                    bombs: 0,
                    players: new Set(),
                    firstCompletedOn: undefined,
                    lastCompletedOn: undefined,
                };
                loopCounts.set(loopNumber, counts);
            }

            counts.players.add(entry.userId);
            const completedOn = entry.completedOn ?? 0;
            if (completedOn > 0) {
                if (counts.firstCompletedOn === undefined || completedOn < counts.firstCompletedOn) {
                    counts.firstCompletedOn = completedOn;
                }
                if (counts.lastCompletedOn === undefined || completedOn > counts.lastCompletedOn) {
                    counts.lastCompletedOn = completedOn;
                }
            }

            if (entry.damageType === TacticusDamageType.Bomb) {
                counts.bombs++;
                continue;
            }

            if (entry.encounterType === TacticusEncounterType.Boss) {
                counts.boss++;
            } else if (entry.encounterIndex === LEFT_PRIME_INDEX) {
                counts.left++;
            } else if (entry.encounterIndex === RIGHT_PRIME_INDEX) {
                counts.right++;
            }
            // A boss has exactly two primes, so a further index is anomalous data, not a third slot.
        }

        if (loopCounts.size === 0) continue;

        const loopFinalHp = finalHpByLoop(bossEntries, entryLoop);
        const leftFinalHp = finalHpByLoop(
            primeEntries.filter(entry => entry.encounterIndex === LEFT_PRIME_INDEX),
            entryLoop
        );
        const rightFinalHp = finalHpByLoop(
            primeEntries.filter(entry => entry.encounterIndex === RIGHT_PRIME_INDEX),
            entryLoop
        );

        const loops: LoopTokenCounts[] = [...loopCounts.entries()]
            .toSorted(([a], [b]) => a - b)
            .map(([loopNumber, counts]) => ({
                loopNumber,
                boss: counts.boss,
                left: counts.left,
                right: counts.right,
                total: counts.boss + counts.left + counts.right,
                finalRemainingHp: loopFinalHp.get(loopNumber),
                leftFinalRemainingHp: leftFinalHp.get(loopNumber),
                rightFinalRemainingHp: rightFinalHp.get(loopNumber),
                bombs: counts.bombs,
                players: counts.players.size,
                firstCompletedOn: counts.firstCompletedOn,
                lastCompletedOn: counts.lastCompletedOn,
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

    return rows.toSorted(compareByFightOrder);
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
        set: number;
        loops: LoopTokenCounts[];
    }
    const groups = new Map<string, GroupAccumulator>();
    for (const loop of summary.loops) {
        const rarity = RarityMapper.stringToNumber[loop.enemyInfo.rarity];
        if (rarity < Rarity.Legendary) continue;
        const key = `${getBossPrefix(loop.enemyInfo.enemyId)}:${rarity}`;
        let group = groups.get(key);
        if (group === undefined) {
            group = {
                rarity,
                bossUnitId: loop.enemyInfo.enemyId,
                bossMaxHp: loop.enemyInfo.maxHp,
                set: loop.enemyInfo.set,
                loops: [],
            };
            groups.set(key, group);
        }
        group.bossMaxHp = Math.max(group.bossMaxHp, loop.enemyInfo.maxHp);
        group.loops.push({
            loopNumber: loop.loopNumber,
            boss: loop.bossTokens,
            left: loop.leftPrimeTokens,
            right: loop.rightPrimeTokens,
            total: loop.bossTokens + loop.leftPrimeTokens + loop.rightPrimeTokens,
            // The aggregate carries no per-target HP, so no outcome is derivable for a past season.
            finalRemainingHp: undefined,
            leftFinalRemainingHp: undefined,
            rightFinalRemainingHp: undefined,
            bombs: 0,
            players: 0,
            firstCompletedOn: undefined,
            lastCompletedOn: undefined,
        });
    }

    const rows: BossLoopRow[] = [];
    for (const [key, group] of groups) {
        const primes = primeLookup.get(key) ?? {};
        rows.push({
            bossPrefix: key.slice(0, key.lastIndexOf(':')),
            rarity: group.rarity,
            set: group.set,
            bossUnitId: group.bossUnitId,
            bossMaxHp: group.bossMaxHp,
            leftPrimeUnitId: primes.left,
            rightPrimeUnitId: primes.right,
            hasPrimes: group.loops.some(loop => loop.left > 0 || loop.right > 0),
            loops: group.loops.toSorted((a, b) => a.loopNumber - b.loopNumber),
        });
    }

    return rows.toSorted(compareByFightOrder);
}

// ---------------------------------------------------------------------------
// Ladder view — loops as rows, the boss ladder as the column axis
// ---------------------------------------------------------------------------

/**
 * What happened to one target in one loop.
 *
 * `skip` applies only to primes. Every boss has exactly two primes and they are optional side
 * bosses that weaken it when killed, so spending nothing on one is a deliberate trade. A boss
 * itself cannot be skipped.
 */
export type Outcome = 'kill' | 'alive' | 'skip';

export function bossOutcome(loop: LoopTokenCounts): Outcome {
    return loop.finalRemainingHp === 0 ? 'kill' : 'alive';
}

/**
 * Zero tokens is a skip whatever the HP says. Note the asymmetry with a *missing* prime: the export
 * simply omits primes nobody hit, so "no data" and "skipped" are the same fact, and both must read
 * as a skip rather than as an absent slot.
 */
export function primeOutcome(tokens: number, finalHp: number | undefined): Outcome {
    if (tokens === 0) return 'skip';
    return finalHp === 0 ? 'kill' : 'alive';
}

/**
 * Fills in prime identities the export never mentioned.
 *
 * `buildBossLoopRows` can only name primes somebody attacked. A guild that skips a rung's primes
 * every single loop therefore has no `leftPrimeUnitId`/`rightPrimeUnitId` at all — yet that is the
 * most interesting thing about their season, so the slots must still be nameable. The season config
 * knows every encounter, so it supplies the missing ids; this is the same lookup Overview uses.
 */
export function resolveLadderPrimes(rows: BossLoopRow[], seasonConfigId: string | undefined): BossLoopRow[] {
    if (seasonConfigId === undefined) return rows;
    const config = getSeasonConfig(seasonConfigId);
    if (!config) return rows;

    return rows.map(row => {
        if (row.leftPrimeUnitId !== undefined && row.rightPrimeUnitId !== undefined) return row;
        const position = findPositionByBossUnitSetId(config, getUnitSetId(row.bossUnitId), row.rarity);
        if (position === undefined) return row;
        const { leftPrime, rightPrime } = getEncountersAtPosition(config, position);
        return {
            ...row,
            leftPrimeUnitId: row.leftPrimeUnitId ?? leftPrime?.unitId,
            rightPrimeUnitId: row.rightPrimeUnitId ?? rightPrime?.unitId,
        };
    });
}

export interface LadderCell {
    loop: LoopTokenCounts;
    boss: Outcome;
    left: Outcome;
    right: Outcome;
}

export interface LadderRow {
    loopNumber: number;
    /** One slot per ladder column; `undefined` where the loop never reached that boss. */
    cells: (LadderCell | undefined)[];
    total: number;
    bossTotal: number;
    primeTotal: number;
    /** A loop is still running if any rung was missed or any boss is still standing. */
    isRunning: boolean;
    /**
     * Whether the guild got all the way round. With outcome data that means every boss died; without
     * it (a past season stores no HP) the only available signal is whether every rung was reached,
     * which still excludes the partial loop a season ended on.
     */
    isComplete: boolean;
    /** Tier of the furthest rung this loop reached; empty when the loop reached nothing. */
    reachedTier: string;
    /** Elapsed days — closed loops end at their last hit, the running loop at `nowSeconds`. */
    durationDays: number | undefined;
    /** "Cleared in 5.2d" / "Day 2.1 · at L3" — empty when outcomes are unavailable. */
    paceLabel: string;
}

export interface LoopLadder {
    /** Column axis, ascending fight order. */
    ladder: BossLoopRow[];
    rows: LadderRow[];
    grandTotal: number;
    /**
     * False for a historical season: the aggregate carries no per-target HP, so kill state cannot be
     * derived. The view must then hide the outcome dots rather than render every boss as "still
     * standing", which would be a fabrication.
     */
    hasOutcomeData: boolean;
}

const SECONDS_PER_DAY = 86_400;

/** Labels a ladder rung — `tierLabel(rarity, set)` in practice, injected to keep this file pure. */
type TierOf = (row: BossLoopRow) => string;

/**
 * Pivots `BossLoopRow[]` (one row per boss, loops nested) into the ladder matrix (one row per loop,
 * one column per boss).
 *
 * `rows` must already be in fight order — both builders return it that way. `nowSeconds` dates the
 * running loop; it is a parameter rather than a `Date.now()` call so the result stays testable.
 */
export function buildLoopLadder(rows: BossLoopRow[], tierOf: TierOf, nowSeconds: number): LoopLadder {
    const ladder = rows;
    const loopNumbers = [...new Set(rows.flatMap(row => row.loops.map(loop => loop.loopNumber)))].toSorted(
        (a, b) => a - b
    );
    const hasOutcomeData = rows.some(row => row.loops.some(loop => loop.finalRemainingHp !== undefined));

    const ladderRows: LadderRow[] = loopNumbers.map(loopNumber => {
        const cells = ladder.map((column): LadderCell | undefined => {
            const loop = column.loops.find(candidate => candidate.loopNumber === loopNumber);
            if (loop === undefined) return undefined;
            return {
                loop,
                boss: bossOutcome(loop),
                left: primeOutcome(loop.left, loop.leftFinalRemainingHp),
                right: primeOutcome(loop.right, loop.rightFinalRemainingHp),
            };
        });

        let total = 0;
        let bossTotal = 0;
        let lastReached = -1;
        let firstCompletedOn: number | undefined;
        let lastCompletedOn: number | undefined;
        for (const [index, cell] of cells.entries()) {
            if (cell === undefined) continue;
            lastReached = index;
            total += cell.loop.total;
            bossTotal += cell.loop.boss;
            const { firstCompletedOn: first, lastCompletedOn: last } = cell.loop;
            if (first !== undefined && (firstCompletedOn === undefined || first < firstCompletedOn)) {
                firstCompletedOn = first;
            }
            if (last !== undefined && (lastCompletedOn === undefined || last > lastCompletedOn)) {
                lastCompletedOn = last;
            }
        }

        const isComplete = hasOutcomeData
            ? cells.every(cell => cell !== undefined && cell.boss === 'kill')
            : cells.every(cell => cell !== undefined);
        const isRunning = hasOutcomeData && !isComplete;
        const reachedTier = lastReached >= 0 ? tierOf(ladder[lastReached]) : '';
        const endSeconds = isRunning ? nowSeconds : lastCompletedOn;
        const durationDays =
            firstCompletedOn === undefined || endSeconds === undefined || endSeconds < firstCompletedOn
                ? undefined
                : (endSeconds - firstCompletedOn) / SECONDS_PER_DAY;

        return {
            loopNumber,
            cells,
            total,
            bossTotal,
            primeTotal: total - bossTotal,
            isRunning,
            isComplete,
            reachedTier,
            durationDays,
            paceLabel: paceLabelFor({ hasOutcomeData, isRunning, reachedTier, durationDays }),
        };
    });

    return {
        ladder,
        rows: ladderRows,
        grandTotal: ladderRows.reduce((sum, row) => sum + row.total, 0),
        hasOutcomeData,
    };
}

function paceLabelFor({
    hasOutcomeData,
    isRunning,
    reachedTier,
    durationDays,
}: {
    hasOutcomeData: boolean;
    isRunning: boolean;
    reachedTier: string;
    durationDays: number | undefined;
}): string {
    if (!hasOutcomeData) return '';
    if (durationDays === undefined) return isRunning ? `At ${reachedTier}` : 'Cleared';
    const days = durationDays.toFixed(1);
    return isRunning ? `Day ${days} · at ${reachedTier}` : `Cleared in ${days}d`;
}

// ---------------------------------------------------------------------------
// Metric switcher
// ---------------------------------------------------------------------------

export type LoopMetric = 'tokens' | 'efficiency' | 'players' | 'bombs';

/** How the trailing loop column and the footer roll a metric up across a loop or a column. */
type Aggregate = 'sum' | 'mean' | 'peak';

export interface MetricDefinition {
    value: LoopMetric;
    label: string;
    title: string;
    explanation: string;
    /** Heading for the trailing loop column — it means something different per metric. */
    totalLabel: string;
    aggregate: Aggregate;
    /** Derived from per-hit entries, so a historical aggregate cannot supply it. */
    liveOnly: boolean;
}

export const LOOP_METRICS: MetricDefinition[] = [
    {
        value: 'tokens',
        label: 'Tokens',
        title: 'Tokens spent',
        explanation: 'Boss tokens large, with each prime beneath.',
        totalLabel: 'Loop tokens',
        aggregate: 'sum',
        liveOnly: false,
    },
    {
        value: 'efficiency',
        label: 'Efficiency',
        title: 'Tokens per 10M HP',
        explanation: 'Cost normalised by boss size — whether a rung is genuinely hard or merely large.',
        totalLabel: 'Loop avg',
        aggregate: 'mean',
        liveOnly: false,
    },
    {
        value: 'players',
        label: 'Players',
        title: 'Distinct members',
        explanation: 'How many people took part in the encounter.',
        totalLabel: 'Loop peak',
        aggregate: 'peak',
        liveOnly: true,
    },
    {
        value: 'bombs',
        label: 'Bombs',
        title: 'Bomb hits',
        explanation: 'Bombs deal damage without spending a raid token — invisible everywhere else.',
        totalLabel: 'Loop bombs',
        aggregate: 'sum',
        liveOnly: true,
    },
];

export function metricDefinition(metric: LoopMetric): MetricDefinition {
    return LOOP_METRICS.find(definition => definition.value === metric) ?? LOOP_METRICS[0];
}

const HP_UNIT = 10_000_000;

/** Tokens per 10M of boss HP. Undefined when the boss's max HP is unknown, so it can't be faked. */
export function efficiencyOf(loop: LoopTokenCounts, bossMaxHp: number): number | undefined {
    if (bossMaxHp <= 0) return undefined;
    return loop.total / (bossMaxHp / HP_UNIT);
}

/**
 * The big number in the cell. Tokens is the one metric where this differs from the aggregated value:
 * the cell shows *boss* tokens because the primes are printed beneath it, while the loop total and the
 * footer have to count all three.
 */
export function cellDisplayValue(metric: LoopMetric, cell: LadderCell, column: BossLoopRow): number | undefined {
    if (metric === 'tokens') return cell.loop.boss;
    return cellAggregateValue(metric, cell, column);
}

/** The value that feeds loop totals, column totals and the sparkline. */
export function cellAggregateValue(metric: LoopMetric, cell: LadderCell, column: BossLoopRow): number | undefined {
    switch (metric) {
        case 'tokens': {
            return cell.loop.total;
        }
        case 'efficiency': {
            return efficiencyOf(cell.loop, column.bossMaxHp);
        }
        case 'players': {
            return cell.loop.players;
        }
        case 'bombs': {
            return cell.loop.bombs;
        }
    }
}

function rollUp(values: number[], aggregate: Aggregate): number | undefined {
    if (values.length === 0) return undefined;
    switch (aggregate) {
        case 'sum': {
            return values.reduce((sum, value) => sum + value, 0);
        }
        case 'mean': {
            return values.reduce((sum, value) => sum + value, 0) / values.length;
        }
        case 'peak': {
            return Math.max(...values);
        }
    }
}

export interface ColumnSeries {
    /** One value per loop that reached this rung, in loop order — the sparkline's points. */
    values: number[];
    seasonValue: number | undefined;
    min: number | undefined;
    max: number | undefined;
    /** True when every loop cost the same. A flat column is itself a finding, so it is said in words. */
    isFlat: boolean;
    rangeLabel: string;
    kills: number;
    leftTotal: number;
    rightTotal: number;
}

export interface MetricView {
    metric: LoopMetric;
    columns: ColumnSeries[];
    /** Trailing-column value per ladder row, in row order. */
    loopValues: (number | undefined)[];
    grandValue: number | undefined;
}

const formatMetric = (value: number, metric: LoopMetric): string =>
    metric === 'efficiency' ? value.toFixed(1) : String(Math.round(value));

export function buildMetricView(ladder: LoopLadder, metric: LoopMetric): MetricView {
    const definition = metricDefinition(metric);

    const columns: ColumnSeries[] = ladder.ladder.map((column, index) => {
        const values: number[] = [];
        let kills = 0;
        let leftTotal = 0;
        let rightTotal = 0;
        for (const row of ladder.rows) {
            const cell = row.cells[index];
            if (cell === undefined) continue;
            const value = cellAggregateValue(metric, cell, column);
            if (value !== undefined) values.push(value);
            if (cell.boss === 'kill') kills++;
            leftTotal += cell.loop.left;
            rightTotal += cell.loop.right;
        }
        const min = values.length > 0 ? Math.min(...values) : undefined;
        const max = values.length > 0 ? Math.max(...values) : undefined;
        const isFlat = min !== undefined && max !== undefined && min === max;
        return {
            values,
            seasonValue: rollUp(values, definition.aggregate),
            min,
            max,
            isFlat,
            rangeLabel: rangeLabelFor(min, max, isFlat, metric),
            kills,
            leftTotal,
            rightTotal,
        };
    });

    const loopValues = ladder.rows.map(row => {
        const values: number[] = [];
        for (const [index, cell] of row.cells.entries()) {
            if (cell === undefined) continue;
            const value = cellAggregateValue(metric, cell, ladder.ladder[index]);
            if (value !== undefined) values.push(value);
        }
        return rollUp(values, definition.aggregate);
    });

    const present = loopValues.filter((value): value is number => value !== undefined);
    return {
        metric,
        columns,
        loopValues,
        grandValue: definition.aggregate === 'sum' ? rollUp(present, 'sum') : rollUp(present, definition.aggregate),
    };
}

function rangeLabelFor(min: number | undefined, max: number | undefined, isFlat: boolean, metric: LoopMetric): string {
    if (min === undefined || max === undefined) return '';
    if (isFlat) return `flat at ${formatMetric(min, metric)}`;
    return `${formatMetric(min, metric)}–${formatMetric(max, metric)} per loop`;
}

// ---------------------------------------------------------------------------
// Summary tiles — the only part of the tab that states a verdict rather than a number
// ---------------------------------------------------------------------------

export interface LoopSummary {
    /** Loops where every rung was reached and every boss died. */
    loopsCompleted: number;
    /** Mean days per completed loop. */
    daysPerLoop: number | undefined;
    /** Tier the running loop has reached; empty when nothing is running. */
    nowAt: string;
    /** Mean loop total over completed loops only — a partial loop would drag it down. */
    tokensPerLoop: number | undefined;
    firstLoopTotal: number | undefined;
    lastLoopTotal: number | undefined;
    /** Costliest rung per unit of HP, which is not simply the biggest. */
    leastEfficient: { tier: string; bossName: string; value: number } | undefined;
    /** Encounters (loop × boss) where at least one prime went un-attacked. */
    primesSkipped: number;
    /**
     * A rung where at least one prime went un-attacked on *every* loop that reached it — a standing
     * habit, not a slip. Deliberately not "both primes": a guild that clears the right prime every
     * loop and never touches the left one has exactly the habit this is meant to surface, and the
     * same "at least one" reading as {@link LoopSummary.primesSkipped}.
     */
    alwaysSkippedTier: string;
}

/** Every value derives from the same arrays the matrix renders, so the two cannot disagree. */
export function buildLoopSummary(
    ladder: LoopLadder,
    tierOf: TierOf,
    bossNameOf: (row: BossLoopRow) => string
): LoopSummary {
    // `isComplete`, not `!isRunning` — nothing is ever "running" in a past season.
    const completed = ladder.rows.filter(row => row.isComplete && row.total > 0);
    const completedTotals = completed.map(row => row.total);
    const durations = completed
        .map(row => row.durationDays)
        .filter((days): days is number => days !== undefined && days > 0);

    const runningRow = ladder.rows.find(row => row.isRunning);

    // Efficiency over completed loops only: a partial loop has spent tokens without a kill to show
    // for them, which would make its rung look worse than it is.
    let leastEfficient: LoopSummary['leastEfficient'] = undefined;
    for (const [index, column] of ladder.ladder.entries()) {
        const values: number[] = [];
        for (const row of completed) {
            const cell = row.cells[index];
            if (cell === undefined) continue;
            const value = efficiencyOf(cell.loop, column.bossMaxHp);
            if (value !== undefined) values.push(value);
        }
        const mean = rollUp(values, 'mean');
        if (mean === undefined) continue;
        if (leastEfficient === undefined || mean > leastEfficient.value) {
            leastEfficient = { tier: tierOf(column), bossName: bossNameOf(column), value: mean };
        }
    }

    let primesSkipped = 0;
    for (const row of ladder.rows) {
        for (const cell of row.cells) {
            if (cell !== undefined && (cell.left === 'skip' || cell.right === 'skip')) primesSkipped++;
        }
    }

    let alwaysSkippedTier = '';
    for (const [index, column] of ladder.ladder.entries()) {
        const reached = ladder.rows
            .map(row => row.cells[index])
            .filter((cell): cell is LadderCell => cell !== undefined);
        if (reached.length === 0) continue;
        if (reached.every(cell => cell.left === 'skip' || cell.right === 'skip')) {
            alwaysSkippedTier = tierOf(column);
            break;
        }
    }

    return {
        loopsCompleted: completed.length,
        daysPerLoop: rollUp(durations, 'mean'),
        nowAt: runningRow?.reachedTier ?? '',
        tokensPerLoop: rollUp(completedTotals, 'mean'),
        firstLoopTotal: completedTotals[0],
        lastLoopTotal: completedTotals.at(-1),
        leastEfficient,
        primesSkipped,
        alwaysSkippedTier,
    };
}
