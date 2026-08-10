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

import { getBossPrefix, unitDisplayLabel } from '../guild-performance.utils';

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
 * Ascending fight order — rarity, then `set`. The guild cannot skip a boss, so this is both the
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

        // Keyed by fixed encounterIndex, never by which indexes happen to appear: a boss whose left
        // prime is always skipped must not file its right-prime hits under "left". Silent King's twin
        // minions work here too — same unitId, different index.
        const primeUnitByEncIndex = new Map<number, string>();
        for (const entry of primeEntries) {
            // A boss has exactly two primes, so a further index is anomalous data rather than a third
            // slot. Filtering here and not just at the lookups is what keeps `hasPrimes` honest: it
            // reads this map's size, and an unsupported index alone would have claimed primes exist
            // while both slots stayed undefined.
            if (entry.encounterIndex !== LEFT_PRIME_INDEX && entry.encounterIndex !== RIGHT_PRIME_INDEX) continue;
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
 * `buildBossLoopRows` can only name primes somebody attacked. A guild that skips a boss's primes
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
    /** A loop is still running if any boss was missed or any boss is still standing. */
    isRunning: boolean;
    /**
     * Whether the guild got all the way round. With outcome data that means every boss died; without
     * it (a past season stores no HP) the only available signal is whether every boss was reached,
     * which still excludes the partial loop a season ended on.
     */
    isComplete: boolean;
    /** Tier of the furthest boss this loop reached; empty when the loop reached nothing. */
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

/** Labels a ladder boss — `tierLabel(rarity, set)` in practice, injected to keep this file pure. */
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
// Prime effect — does killing a prime actually lower what the boss itself costs, for this guild
// ---------------------------------------------------------------------------

/** Below this fraction cheaper, a killed-loop boss cost reads as noise, not an effect. */
const PRIME_EFFECT_THRESHOLD = 0.15;
/** Minimum loops needed in each group — else one fluke loop decides the verdict. */
const PRIME_EFFECT_MIN_SAMPLE = 2;

const mean = (values: number[]): number => values.reduce((sum, value) => sum + value, 0) / values.length;

export interface PrimeEffect {
    effect: 'lower' | 'none';
    killedMean: number;
    unkilledMean: number;
}

/** Compares a boss's own token cost between loops where a prime died and loops where neither did. */
export function primeEffectFor(cells: LadderCell[]): PrimeEffect | undefined {
    const killedBoss: number[] = [];
    const unkilledBoss: number[] = [];
    for (const cell of cells) {
        (cell.left === 'kill' || cell.right === 'kill' ? killedBoss : unkilledBoss).push(cell.loop.boss);
    }
    if (killedBoss.length < PRIME_EFFECT_MIN_SAMPLE || unkilledBoss.length < PRIME_EFFECT_MIN_SAMPLE) {
        return undefined;
    }

    const killedMean = mean(killedBoss);
    const unkilledMean = mean(unkilledBoss);
    const effect = unkilledMean > 0 && killedMean <= unkilledMean * (1 - PRIME_EFFECT_THRESHOLD) ? 'lower' : 'none';
    return { effect, killedMean, unkilledMean };
}

/** {@link primeEffectFor} for every ladder column. Every entry is undefined for a season with no outcome data. */
export function buildPrimeEffects(ladder: LoopLadder): (PrimeEffect | undefined)[] {
    if (!ladder.hasOutcomeData) return Array.from<PrimeEffect | undefined>({ length: ladder.ladder.length });
    return ladder.ladder.map((_, index) => {
        const cells = ladder.rows.map(row => row.cells[index]).filter((cell): cell is LadderCell => cell !== undefined);
        return primeEffectFor(cells);
    });
}

/** The card/dialog caption for one boss's {@link PrimeEffect}. */
export function primeEffectCaption(result: PrimeEffect | undefined): string | undefined {
    if (result === undefined) return undefined;
    return result.effect === 'lower'
        ? `Prime kills cut boss cost: ${result.killedMean.toFixed(1)} vs ${result.unkilledMean.toFixed(1)} tokens/loop`
        : 'Prime kills showed no clear effect on boss cost';
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
        explanation: 'Cost normalised by boss size — whether a boss is genuinely hard or merely large.',
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

const SEASON_LABEL = { sum: 'Season total', mean: 'Season average', peak: 'Season peak' } as const;

/**
 * Heading for a season-wide roll-up. It is a sum for some metrics and a mean or peak for others, so
 * the column says which rather than calling a mean a "total".
 */
export function seasonLabel(metric: LoopMetric): string {
    return SEASON_LABEL[metricDefinition(metric).aggregate];
}

const HP_UNIT = 10_000_000;

/** Tokens per 10M of boss HP. Undefined when the boss's max HP is unknown, so it can't be faked. */
export function efficiencyOf(loop: LoopTokenCounts, bossMaxHp: number): number | undefined {
    if (bossMaxHp <= 0) return undefined;
    return loop.total / (bossMaxHp / HP_UNIT);
}

/** The value behind every figure and gauge on the board, and behind both of its totals. */
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
    /** One value per loop that reached this boss, in loop order — the sparkline's points. */
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
        // Range and L/R totals are season-verdict numbers, so both skip the still-running boss's
        // partial spend — only "final" loops count (killed, or all of them for a past season).
        const finalValues: number[] = [];
        let kills = 0;
        let finalLeftTotal = 0;
        let finalRightTotal = 0;
        for (const row of ladder.rows) {
            const cell = row.cells[index];
            if (cell === undefined) continue;
            const value = cellAggregateValue(metric, cell, column);
            if (value !== undefined) values.push(value);
            if (cell.boss === 'kill') kills++;
            const isFinal = !ladder.hasOutcomeData || cell.boss === 'kill';
            if (isFinal) {
                if (value !== undefined) finalValues.push(value);
                finalLeftTotal += cell.loop.left;
                finalRightTotal += cell.loop.right;
            }
        }
        // `min`/`max` stay unfiltered: they scale the bars, and the running loop's bar must still fit.
        const min = values.length > 0 ? Math.min(...values) : undefined;
        const max = values.length > 0 ? Math.max(...values) : undefined;
        const finalMin = finalValues.length > 0 ? Math.min(...finalValues) : undefined;
        const finalMax = finalValues.length > 0 ? Math.max(...finalValues) : undefined;
        const isFlat = finalMin !== undefined && finalMax !== undefined && finalMin === finalMax;
        return {
            values,
            seasonValue: rollUp(values, definition.aggregate),
            min,
            max,
            isFlat,
            rangeLabel: rangeLabelFor(finalMin, finalMax, isFlat, metric, finalValues.length),
            kills,
            leftTotal: finalLeftTotal,
            rightTotal: finalRightTotal,
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

/** `count < 2` guards "flat at X" — one data point isn't a trend. */
function rangeLabelFor(
    min: number | undefined,
    max: number | undefined,
    isFlat: boolean,
    metric: LoopMetric,
    count: number
): string {
    if (min === undefined || max === undefined || count < 2) return '';
    if (isFlat) return `flat at ${formatMetric(min, metric)}`;
    return `${formatMetric(min, metric)}–${formatMetric(max, metric)} per loop`;
}

// ---------------------------------------------------------------------------
// Season board — the same series as the matrix, read as bars instead of numbers
//
// The matrix answers "what did this loop cost on this boss". Answering "how is the season going"
// from it means scanning every cell, which is the one thing a glance cannot do. The board is that
// second question in a single screen: a row per boss, a bar per loop.
//
// Every bar is scaled to its own boss's busiest loop, never board-wide. That is the whole point — a
// board-wide scale pins the season's single most expensive boss at full width and flattens the rest
// to stubs, which says only "mythic bosses are bigger", a fact the boss's own HP figure already
// states. Per-boss, a 44→47 move stays visible, and that is what "are we improving" means.
// ---------------------------------------------------------------------------

/** A non-zero value never renders as an empty track — below this it reads as a sliver, not nothing. */
const MIN_VISIBLE_PERCENT = 6;

export function barPercent(value: number | undefined, max: number): number {
    if (value === undefined || value <= 0 || max <= 0) return 0;
    return Math.max((value / max) * 100, MIN_VISIBLE_PERCENT);
}

/**
 * Composition of a bar's filled portion, as percentages of that fill — so the three sum to 100
 * whenever anything was spent, and the bar reads left prime → boss → right prime, the same
 * arrangement as the ladder header and the cell.
 */
export interface BoardSegments {
    left: number;
    boss: number;
    right: number;
}

export interface BoardBar {
    loopNumber: number;
    /** Marks the loop in flight, so a card row can chip its own number without consulting the axis. */
    isRunning: boolean;
    /** Undefined where the loop never reached this boss, which is not the same as spending nothing. */
    value: number | undefined;
    /** Share of this boss's own busiest loop, 0–100. */
    percent: number;
    /** Boss outcome. Undefined for an unreached boss, and for a past season that stores no HP. */
    outcome: Outcome | undefined;
    /**
     * Always the token split, whatever the metric — it is a fact about the encounter, not a view of
     * the selected measure. Only the Tokens view draws it; the rest have nothing to split.
     * Undefined when the boss was unreached or nothing was spent.
     */
    segments: BoardSegments | undefined;
    /** Carried so a bar can reuse {@link cellTitle} rather than restate the breakdown. */
    cell: LadderCell | undefined;
}

function segmentsOf(loop: LoopTokenCounts): BoardSegments | undefined {
    if (loop.total <= 0) return undefined;
    // Floor each non-zero part before normalising. A single token beside a 47-token boss is 2% of the
    // fill, which at the narrowest track is under a pixel — the same sliver the split was rejected
    // for inside a cell. Renormalising afterwards keeps the three summing to 100.
    const parts = [loop.left, loop.boss, loop.right].map(tokens =>
        tokens <= 0 ? 0 : Math.max((tokens / loop.total) * 100, MIN_VISIBLE_PERCENT)
    );
    const sum = parts[0] + parts[1] + parts[2];
    return { left: (parts[0] / sum) * 100, boss: (parts[1] / sum) * 100, right: (parts[2] / sum) * 100 };
}

export interface BoardBoss {
    /** Index into {@link LoopLadder.ladder} — the column a click on this row opens. */
    columnIndex: number;
    bars: BoardBar[];
    seasonValue: number | undefined;
    /** Loops that got this far; the denominator {@link BoardBoss.kills} is out of. */
    reached: number;
    kills: number;
    /** "5–9 per loop" / "flat at 42" — the trend in words, which a bar strip cannot state. */
    rangeLabel: string;
    leftTotal: number;
    rightTotal: number;
    /** Undefined when there's nothing to compare — see {@link primeEffectFor}. */
    primeEffect: PrimeEffect | undefined;
}

export interface BoardLoop {
    loopNumber: number;
    /** Compact pace: `5.2d` once cleared, `Day 2.1` while running, empty when undated. */
    paceLabel: string;
    isRunning: boolean;
    /** The metric's roll-up across this loop's bosses. */
    value: number | undefined;
}

export interface LoopBoard {
    /** Column axis, ascending. */
    loops: BoardLoop[];
    bosses: BoardBoss[];
    /** Season-wide roll-up across every loop. */
    grandValue: number | undefined;
}

/**
 * `Cleared in 5.2d` / `Day 2.1 · at L3` are both too long for a card row's trailing slot. The boss is
 * the card here, so "at L3" is already on screen, and the running loop is marked on its number rather
 * than spelled out.
 */
function boardPaceLabel(row: LadderRow): string {
    if (row.durationDays === undefined) return '';
    const days = row.durationDays.toFixed(1);
    return row.isRunning ? `Day ${days}` : `${days}d`;
}

/**
 * What a bar's length is measured against.
 *
 * `boss` answers "are we getting better at this boss" — each card runs its own scale, so a boss whose
 * cost never moves reads flat and one that swings reads as a swing, whatever the boss beside it
 * costs. `board` answers "which boss eats the season" — one scale everywhere, so bar lengths are
 * comparable between cards but a cheap boss is compressed to a stub.
 *
 * Neither is a superset of the other, which is why it is a switch rather than a default.
 */
export type BarScale = 'boss' | 'board';

/**
 * Pivots the ladder into one bar strip per boss, valuing cells through the same
 * {@link cellAggregateValue} the metric view uses so the two can never encode different things
 * under one switcher.
 */
export function buildLoopBoard(ladder: LoopLadder, view: MetricView, scale: BarScale): LoopBoard {
    // The busiest single loop anywhere on the board, for the shared scale.
    const boardMax = Math.max(0, ...view.columns.map(series => series.max ?? 0));
    // Metric-independent, so computed once rather than per metric.
    const primeEffects = buildPrimeEffects(ladder);

    return {
        loops: ladder.rows.map((row, index) => ({
            loopNumber: row.loopNumber,
            paceLabel: boardPaceLabel(row),
            isRunning: row.isRunning,
            value: view.loopValues[index],
        })),
        grandValue: view.grandValue,
        bosses: ladder.ladder.map((column, index) => {
            const series = view.columns[index];
            const max = scale === 'board' ? boardMax : (series.max ?? 0);
            const bars = ladder.rows.map((row): BoardBar => {
                const cell = row.cells[index];
                const value = cell === undefined ? undefined : cellAggregateValue(view.metric, cell, column);
                return {
                    loopNumber: row.loopNumber,
                    isRunning: row.isRunning,
                    value,
                    percent: barPercent(value, max),
                    outcome: cell === undefined || !ladder.hasOutcomeData ? undefined : cell.boss,
                    segments: cell === undefined ? undefined : segmentsOf(cell.loop),
                    cell,
                };
            });
            return {
                columnIndex: index,
                bars,
                seasonValue: series.seasonValue,
                // Counted from cells, not from bars: a metric can legitimately have no value for a
                // cell that exists (efficiency without a known max HP), and "loops that got this
                // far" must not shift with the switcher.
                reached: ladder.rows.filter(row => row.cells[index] !== undefined).length,
                kills: series.kills,
                rangeLabel: series.rangeLabel,
                leftTotal: series.leftTotal,
                rightTotal: series.rightTotal,
                primeEffect: primeEffects[index],
            };
        }),
    };
}

// ---------------------------------------------------------------------------
// Boss detail — one ladder column, opened from a board row
//
// Always framed in tokens, whatever the switcher says: this is the full breakdown of one encounter,
// so every field is present at once and there is nothing left for a metric to select between. It is
// also the only place with the width for what a matrix cell has to drop — remaining HP, bombs,
// members and efficiency.
// ---------------------------------------------------------------------------

export interface BossLoopDetail {
    loopNumber: number;
    isRunning: boolean;
    paceLabel: string;
    /** Undefined when this loop never reached the boss. */
    cell: LadderCell | undefined;
    /** Boss tokens as a share of this boss's busiest loop, 0–100. */
    percent: number;
    /** Tokens per 10M of boss HP; undefined when the boss's max HP is unknown. */
    efficiency: number | undefined;
}

export interface BossDetail {
    columnIndex: number;
    column: BossLoopRow;
    loops: BossLoopDetail[];
    total: number;
    bossTotal: number;
    leftTotal: number;
    rightTotal: number;
    bombs: number;
    /** Most members in a single loop. Summing would count the regulars once per loop. */
    peakPlayers: number;
    kills: number;
    reached: number;
    efficiencyMean: number | undefined;
    /** Range of encounter totals across the loops that reached this boss. */
    rangeLabel: string;
    hasOutcomeData: boolean;
    /** Undefined when there's nothing to compare — see {@link primeEffectFor}. */
    primeEffect: PrimeEffect | undefined;
}

export function buildBossDetail(ladder: LoopLadder, columnIndex: number): BossDetail {
    const column = ladder.ladder[columnIndex];
    const reachedCells = ladder.rows
        .map(row => row.cells[columnIndex])
        .filter((cell): cell is LadderCell => cell !== undefined);

    const efficiencies: number[] = [];
    let total = 0;
    let bossTotal = 0;
    let leftTotal = 0;
    let rightTotal = 0;
    let bombs = 0;
    let peakPlayers = 0;
    let kills = 0;

    for (const cell of reachedCells) {
        total += cell.loop.total;
        bossTotal += cell.loop.boss;
        leftTotal += cell.loop.left;
        rightTotal += cell.loop.right;
        bombs += cell.loop.bombs;
        if (cell.loop.players > peakPlayers) peakPlayers = cell.loop.players;
        if (cell.boss === 'kill') kills++;
        const efficiency = efficiencyOf(cell.loop, column.bossMaxHp);
        if (efficiency !== undefined) efficiencies.push(efficiency);
    }

    // The bar scales on boss tokens, matching the number it sits beside — the rail beneath carries
    // the primes separately, so folding them into the same bar would count them twice over.
    const bossValues = reachedCells.map(cell => cell.loop.boss);
    const bossMax = bossValues.length > 0 ? Math.max(...bossValues) : 0;

    const encounterTotals = reachedCells.map(cell => cell.loop.total);
    const min = encounterTotals.length > 0 ? Math.min(...encounterTotals) : undefined;
    const max = encounterTotals.length > 0 ? Math.max(...encounterTotals) : undefined;

    return {
        columnIndex,
        column,
        loops: ladder.rows.map((row): BossLoopDetail => {
            const cell = row.cells[columnIndex];
            return {
                loopNumber: row.loopNumber,
                isRunning: row.isRunning,
                paceLabel: row.paceLabel,
                cell,
                percent: barPercent(cell?.loop.boss, bossMax),
                efficiency: cell === undefined ? undefined : efficiencyOf(cell.loop, column.bossMaxHp),
            };
        }),
        total,
        bossTotal,
        leftTotal,
        rightTotal,
        bombs,
        peakPlayers,
        kills,
        reached: reachedCells.length,
        efficiencyMean: rollUp(efficiencies, 'mean'),
        rangeLabel: rangeLabelFor(min, max, min === max, 'tokens', encounterTotals.length),
        hasOutcomeData: ladder.hasOutcomeData,
        primeEffect: ladder.hasOutcomeData ? primeEffectFor(reachedCells) : undefined,
    };
}

// ---------------------------------------------------------------------------
// Cell and value labels
//
// Shared by the matrix, the board and the boss dialog, so they live here rather than in any one of
// them. They are also plain logic, which belongs in a `.ts` — and a `.tsx` that exports components
// cannot export them anyway (`react-refresh/only-export-components`).
// ---------------------------------------------------------------------------

export const OUTCOME_WORD: Record<Outcome, string> = { kill: 'killed', alive: 'still alive', skip: 'skipped' };

export const compactNumber = (value: number): string =>
    value.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 1 });

export function formatMetricValue(value: number | undefined, metric: LoopMetric): string {
    if (value === undefined) return '–';
    if (metric === 'efficiency') return value.toFixed(1);
    return String(Math.round(value));
}

/** A prime the export never named still has a slot, so it gets a positional label. */
export function primeName(unitId: string | undefined, side: string): string {
    return unitId === undefined ? `${side} prime` : unitDisplayLabel(unitId);
}

export function primeTitle(unitId: string | undefined, side: string, outcome: Outcome, tokens: number): string {
    const label = unitId === undefined ? `${side} prime` : `${unitDisplayLabel(unitId)} — ${side} prime`;
    return `${label}: ${tokens} ${tokens === 1 ? 'token' : 'tokens'}, ${OUTCOME_WORD[outcome]}`;
}

/** The full breakdown of one encounter, for a cell's `title` and `aria-label`. */
export function cellTitle(cell: LadderCell, column: BossLoopRow, hasOutcomeData: boolean): string {
    const { loop } = cell;
    const state = (outcome: Outcome) => (hasOutcomeData ? ` (${OUTCOME_WORD[outcome]})` : '');
    const parts = [
        `boss ${loop.boss}${state(cell.boss)}`,
        `${primeName(column.leftPrimeUnitId, 'left')} ${loop.left}${state(cell.left)}`,
        `${primeName(column.rightPrimeUnitId, 'right')} ${loop.right}${state(cell.right)}`,
    ];
    const extra = loop.bombs > 0 ? ` · ${loop.bombs} bomb${loop.bombs === 1 ? '' : 's'}` : '';
    return `${loop.total} tokens · ${parts.join(' · ')}${extra}`;
}

// ---------------------------------------------------------------------------
// Summary tiles — the only part of the tab that states a verdict rather than a number
// ---------------------------------------------------------------------------

export interface LoopSummary {
    /** Loops where every boss was reached and every boss died. */
    loopsCompleted: number;
    /** Mean days per completed loop. */
    daysPerLoop: number | undefined;
    /** Tier the running loop has reached; empty when nothing is running. */
    nowAt: string;
    /** Mean loop total over completed loops only — a partial loop would drag it down. */
    tokensPerLoop: number | undefined;
    firstLoopTotal: number | undefined;
    lastLoopTotal: number | undefined;
    /** Costliest boss per unit of HP, which is not simply the biggest. */
    leastEfficient: { tier: string; bossName: string; value: number } | undefined;
    /** Encounters (loop × boss) where at least one prime went un-attacked. */
    primesSkipped: number;
    /**
     * A boss where at least one prime went un-attacked on *every* loop that reached it — a standing
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

    // Completed loops only, and at least two — one loop is no data point to average.
    let leastEfficient: LoopSummary['leastEfficient'] = undefined;
    for (const [index, column] of ladder.ladder.entries()) {
        const values: number[] = [];
        for (const row of completed) {
            const cell = row.cells[index];
            if (cell === undefined) continue;
            const value = efficiencyOf(cell.loop, column.bossMaxHp);
            if (value !== undefined) values.push(value);
        }
        if (values.length < 2) continue;
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

    // At least two loops reaching the boss — "skipped every loop" needs more than one loop.
    let alwaysSkippedTier = '';
    for (const [index, column] of ladder.ladder.entries()) {
        const reached = ladder.rows
            .map(row => row.cells[index])
            .filter((cell): cell is LadderCell => cell !== undefined);
        if (reached.length < 2) continue;
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
