/* eslint-disable import-x/no-internal-modules -- matches loops-tab.utils.ts's own import style */
import { describe, expect, it } from 'vitest';

import {
    TacticusDamageType,
    TacticusEncounterType,
    type TacticusGuildRaidEntry,
} from '@/fsd/5-shared/lib/tacticus-api';
import { Rarity } from '@/fsd/5-shared/model';

import { tierLabel } from '../guild-performance.utils';

import {
    bossOutcome,
    buildBossDetail,
    buildBossLoopRows,
    buildLoopBoard,
    buildLoopLadder,
    buildLoopSummary,
    buildMetricView,
    efficiencyOf,
    primeEffectFor,
    primeOutcome,
    resolveLadderPrimes,
    restrictToCurrentLoopRange,
    type BarScale,
    type BossLoopRow,
    type LadderCell,
    type LoopMetric,
    type LoopTokenCounts,
    type Outcome,
} from './loops-tab.utils';

// Bosses must use *distinct* GuildBoss families: `buildBossLoopRows` groups by `prefix:rarity`, so two
// sets of the same family in one rarity would collapse into a single column. Real ladders never do
// that — every slot is a different family. (Across rarities they can repeat, which is fine.)
const L1_BOSS = 'GuildBoss7Boss1AstraRogaldorn';
const L1_LEFT = 'GuildBoss7MiniBoss1AstraPrimarisPsy';
const L1_RIGHT = 'GuildBoss7MiniBoss2AstraOrdnance';
const L2_BOSS = 'GuildBoss8Boss1EldarAvatar';
const M1_BOSS = 'GuildBoss9Boss1ThousMagnus';

const DAY = 86_400;
const START = 1_700_000_000;
/** Fixed "now" so pace assertions don't depend on the wall clock. */
const NOW = START + 10 * DAY;

const tierOf = (row: BossLoopRow) => tierLabel(row.rarity, row.set);
const bossNameOf = (row: BossLoopRow) => row.bossPrefix;

let tick = 0;

/** `completedOn` auto-increments so entries land in the order they're declared. */
function entry(overrides: Partial<TacticusGuildRaidEntry> & Pick<TacticusGuildRaidEntry, 'unitId'>) {
    tick += 60;
    const at = START + tick;
    return {
        userId: 'user-1',
        tier: 0,
        set: 0,
        encounterIndex: 0,
        remainingHp: 500,
        maxHp: 1000,
        encounterType: TacticusEncounterType.Boss,
        type: 'test',
        rarity: Rarity.Legendary,
        damageDealt: 100,
        damageType: TacticusDamageType.Battle,
        startedOn: at,
        completedOn: at,
        heroDetails: [],
        globalConfigHash: 'hash',
        ...overrides,
    } satisfies TacticusGuildRaidEntry;
}

const boss = (extra: Partial<TacticusGuildRaidEntry> = {}) =>
    entry({ unitId: L1_BOSS, encounterType: TacticusEncounterType.Boss, encounterIndex: 0, ...extra });
const leftPrime = (extra: Partial<TacticusGuildRaidEntry> = {}) =>
    entry({ unitId: L1_LEFT, encounterType: TacticusEncounterType.SideBoss, encounterIndex: 1, ...extra });
const rightPrime = (extra: Partial<TacticusGuildRaidEntry> = {}) =>
    entry({ unitId: L1_RIGHT, encounterType: TacticusEncounterType.SideBoss, encounterIndex: 2, ...extra });

function onlyLoop(entries: TacticusGuildRaidEntry[]): LoopTokenCounts {
    const rows = buildBossLoopRows(entries);
    expect(rows).toHaveLength(1);
    expect(rows[0].loops).toHaveLength(1);
    return rows[0].loops[0];
}

describe('per-prime final HP', () => {
    it('takes the chronologically last attack on each prime slot', () => {
        const loop = onlyLoop([
            boss(),
            leftPrime({ remainingHp: 400 }),
            leftPrime({ remainingHp: 0 }),
            rightPrime({ remainingHp: 250 }),
        ]);

        expect(loop.leftFinalRemainingHp).toBe(0);
        expect(loop.rightFinalRemainingHp).toBe(250);
    });

    it('breaks a same-second tie by the lower HP, whatever order the API sent', () => {
        // `completedOn` has second granularity and the response is not promised to be chronological,
        // so the killing blow can share its timestamp with an earlier hit and arrive after it.
        const at = START + 5 * DAY;
        const loop = onlyLoop([boss({ remainingHp: 0, completedOn: at }), boss({ remainingHp: 900, completedOn: at })]);

        expect(loop.finalRemainingHp).toBe(0);
        expect(bossOutcome(loop)).toBe('kill');
    });

    it('counts a bomb that lands the killing blow', () => {
        const loop = onlyLoop([
            boss(),
            leftPrime({ remainingHp: 300 }),
            leftPrime({ remainingHp: 0, damageType: TacticusDamageType.Bomb }),
        ]);

        expect(loop.left).toBe(1); // the bomb spent no token
        expect(loop.bombs).toBe(1);
        expect(primeOutcome(loop.left, loop.leftFinalRemainingHp)).toBe('kill');
    });

    it('keeps left and right separate when both slots share a unitId', () => {
        // Silent King's twin minions: same unitId, different encounterIndex.
        const twin = 'GuildBoss7MiniBoss1AstraTwin';
        const loop = onlyLoop([
            boss(),
            entry({ unitId: twin, encounterType: TacticusEncounterType.SideBoss, encounterIndex: 1, remainingHp: 0 }),
            entry({ unitId: twin, encounterType: TacticusEncounterType.SideBoss, encounterIndex: 2, remainingHp: 900 }),
        ]);

        expect(loop.leftFinalRemainingHp).toBe(0);
        expect(loop.rightFinalRemainingHp).toBe(900);
    });

    it('still files the right prime as right when the left one was never fought', () => {
        // The slot is fixed by encounterIndex, not by which primes happen to appear: a guild that
        // skips the left prime every loop must not have its right-prime hits relabelled "left".
        const loop = onlyLoop([boss(), rightPrime({ remainingHp: 120 }), rightPrime({ remainingHp: 0 })]);

        expect(loop.left).toBe(0);
        expect(loop.right).toBe(2);
        expect(loop.leftFinalRemainingHp).toBeUndefined();
        expect(loop.rightFinalRemainingHp).toBe(0);
    });
});

describe('bombs and players', () => {
    it('counts bombs without letting them spend a token', () => {
        const loop = onlyLoop([
            boss(),
            boss({ damageType: TacticusDamageType.Bomb }),
            boss({ damageType: TacticusDamageType.Bomb }),
        ]);

        expect(loop.boss).toBe(1);
        expect(loop.total).toBe(1);
        expect(loop.bombs).toBe(2);
    });

    it('counts distinct members, including bombers', () => {
        const loop = onlyLoop([
            boss({ userId: 'a' }),
            boss({ userId: 'b' }),
            boss({ userId: 'a' }),
            leftPrime({ userId: 'c', damageType: TacticusDamageType.Bomb }),
        ]);

        expect(loop.players).toBe(3);
    });

    it('spans the loop from its first hit to its last', () => {
        const loop = onlyLoop([boss({ completedOn: START + DAY }), boss({ completedOn: START + 3 * DAY })]);

        expect(loop.firstCompletedOn).toBe(START + DAY);
        expect(loop.lastCompletedOn).toBe(START + 3 * DAY);
    });
});

describe('outcome derivation', () => {
    it('reads a boss as killed only at exactly zero HP', () => {
        expect(bossOutcome({ finalRemainingHp: 0 } as LoopTokenCounts)).toBe('kill');
        expect(bossOutcome({ finalRemainingHp: 1 } as LoopTokenCounts)).toBe('alive');
    });

    it('reads zero tokens as a skip regardless of HP', () => {
        // The explicit `undefined` is the case under test — "no attack recorded" — not a redundant
        // trailing argument, so the usual no-useless-undefined rule doesn't apply here.
        // eslint-disable-next-line unicorn/no-useless-undefined
        expect(primeOutcome(0, undefined)).toBe('skip');
        expect(primeOutcome(0, 0)).toBe('skip');
        expect(primeOutcome(2, 0)).toBe('kill');
        expect(primeOutcome(2, 50)).toBe('alive');
    });

    it('treats a prime absent from the export as skipped, not as a missing slot', () => {
        // Every boss has exactly two primes, so nothing in the export means nobody hit it. Suppressing
        // this would hide the single most interesting thing the tab can show: a standing habit of
        // skipping a boss's primes.
        const ladder = buildLoopLadder(buildBossLoopRows([boss({ remainingHp: 0 })]), tierOf, NOW);
        const cell = ladder.rows[0].cells[0]!;

        expect(ladder.ladder[0].hasPrimes).toBe(false);
        expect(cell.left).toBe('skip');
        expect(cell.right).toBe('skip');
        expect(buildLoopSummary(ladder, tierOf, bossNameOf).primesSkipped).toBe(1);
    });
});

const finalCell = (bossTokens: number, left: Outcome): LadderCell => ({
    loop: { boss: bossTokens } as LoopTokenCounts,
    boss: 'kill',
    left,
    right: 'skip',
});

describe('primeEffectFor', () => {
    it('ignores the still-running loop, whose boss cost is not final yet', () => {
        const finalized: LadderCell[] = [
            finalCell(10, 'kill'),
            finalCell(10, 'kill'),
            finalCell(10, 'skip'),
            finalCell(10, 'skip'),
        ];
        // Cheap only because the fight isn't over — folded into the killed group unfiltered, its 1
        // token would drop that mean to 7, clearing the 15% threshold against the finalized 10 and
        // reporting a false "lower".
        const withRunningLoop: LadderCell[] = [
            ...finalized,
            { loop: { boss: 1 } as LoopTokenCounts, boss: 'alive', left: 'kill', right: 'skip' },
        ];

        expect(primeEffectFor(finalized)?.effect).toBe('none');
        expect(primeEffectFor(withRunningLoop)).toEqual(primeEffectFor(finalized));
    });
});

describe('resolveLadderPrimes', () => {
    it('names primes the export never mentioned, from the season config', () => {
        const rows = buildBossLoopRows([boss({ unitId: M1_BOSS, rarity: Rarity.Mythic, set: 0, remainingHp: 0 })]);
        expect(rows[0].leftPrimeUnitId).toBeUndefined();

        const resolved = resolveLadderPrimes(rows, 'guild_boss_season_config_5');

        expect(resolved[0].leftPrimeUnitId).toBeDefined();
        expect(resolved[0].rightPrimeUnitId).toBeDefined();
        expect(resolved[0].leftPrimeUnitId).not.toBe(resolved[0].rightPrimeUnitId);
    });

    it('leaves rows untouched without a config', () => {
        const rows = buildBossLoopRows([boss({ remainingHp: 0 })]);
        // The explicit `undefined` is the case under test: a season with no config id.
        // eslint-disable-next-line unicorn/no-useless-undefined
        expect(resolveLadderPrimes(rows, undefined)).toEqual(rows);
    });
});

describe('ladder ordering', () => {
    it('returns bosses in ascending fight order', () => {
        const rows = buildBossLoopRows([
            boss({ unitId: M1_BOSS, rarity: Rarity.Mythic, set: 0, remainingHp: 0 }),
            boss({ unitId: L2_BOSS, rarity: Rarity.Legendary, set: 1, remainingHp: 0 }),
            boss({ unitId: L1_BOSS, rarity: Rarity.Legendary, set: 0, remainingHp: 0 }),
        ]);

        // Declared Mythic-first; must come back L1 → L2 → M1.
        expect(rows.map(row => tierOf(row))).toEqual(['L1', 'L2', 'M1']);
    });
});

/** Loop 1 clears both bosses; loop 2 reaches only the first and leaves its boss alive. */
const ladderEntries = () => [
    boss({ set: 0, remainingHp: 0, completedOn: START + DAY }),
    leftPrime({ set: 0, remainingHp: 0, completedOn: START + DAY }),
    boss({ unitId: L2_BOSS, set: 1, remainingHp: 0, completedOn: START + 3 * DAY }),
    // set drops back to 0 → a new loop
    boss({ set: 0, remainingHp: 700, completedOn: START + 8 * DAY }),
];

/** Two bosses of different sizes, so efficiency has something to normalise. */
const metricEntries = () => [
    boss({ set: 0, remainingHp: 0, maxHp: 20_000_000, userId: 'a' }),
    leftPrime({ set: 0, remainingHp: 0, userId: 'b' }),
    boss({ unitId: L2_BOSS, set: 1, remainingHp: 0, maxHp: 10_000_000, userId: 'a' }),
];

/**
 * A big cheap boss and a small expensive one, cleared identically on two full loops, plus a third,
 * unfinished loop. Two completed loops (not one) so `leastEfficient` has an actual pair of samples
 * per boss to compare rather than crowning a verdict off a single data point.
 */
const summaryEntries = () => [
    boss({ set: 0, remainingHp: 0, maxHp: 30_000_000, completedOn: START + DAY }),
    boss({ unitId: L2_BOSS, set: 1, remainingHp: 0, maxHp: 10_000_000, completedOn: START + 2 * DAY }),
    // set drops back to 0 → loop 2, cleared the same way
    boss({ set: 0, remainingHp: 0, maxHp: 30_000_000, completedOn: START + 3 * DAY }),
    boss({ unitId: L2_BOSS, set: 1, remainingHp: 0, maxHp: 10_000_000, completedOn: START + 4 * DAY }),
    // loop 3 — still running, only the cheap boss reached so far
    boss({ set: 0, remainingHp: 700, completedOn: START + 8 * DAY }),
];

/** Built fresh per test so no suite can mutate anothers ladder. */
const metricLadder = () => buildLoopLadder(buildBossLoopRows(metricEntries()), tierOf, NOW);

const summaryOf = () => {
    const built = buildLoopLadder(buildBossLoopRows(summaryEntries()), tierOf, NOW);
    return { built, summary: buildLoopSummary(built, tierOf, bossNameOf) };
};

describe('buildLoopLadder', () => {
    it('pivots to one row per loop and one column per boss', () => {
        const ladder = buildLoopLadder(buildBossLoopRows(ladderEntries()), tierOf, NOW);

        expect(ladder.ladder).toHaveLength(2);
        expect(ladder.rows.map(row => row.loopNumber)).toEqual([1, 2]);
        expect(ladder.hasOutcomeData).toBe(true);
    });

    it('marks the unfinished loop running and leaves unreached bosses undefined', () => {
        const [loop1, loop2] = buildLoopLadder(buildBossLoopRows(ladderEntries()), tierOf, NOW).rows;

        expect(loop1.isRunning).toBe(false);
        expect(loop2.isRunning).toBe(true);
        expect(loop2.cells[1]).toBeUndefined();
        expect(loop2.reachedTier).toBe('L1');
    });

    it('dates a closed loop from its own hits and the running loop from now', () => {
        const [loop1, loop2] = buildLoopLadder(buildBossLoopRows(ladderEntries()), tierOf, NOW).rows;

        expect(loop1.durationDays).toBeCloseTo(2, 5); // day 1 → day 3
        expect(loop1.paceLabel).toBe('Cleared in 2.0d');
        expect(loop2.durationDays).toBeCloseTo(2, 5); // day 8 → now (day 10)
        expect(loop2.paceLabel).toBe('Day 2.0 · at L1');
    });

    it('reconciles loop totals and the grand total with the cells', () => {
        const ladder = buildLoopLadder(buildBossLoopRows(ladderEntries()), tierOf, NOW);

        for (const row of ladder.rows) {
            const summed = row.cells.reduce((sum, cell) => sum + (cell?.loop.total ?? 0), 0);
            expect(row.total).toBe(summed);
            expect(row.bossTotal + row.primeTotal).toBe(row.total);
        }
        expect(ladder.grandTotal).toBe(ladder.rows.reduce((sum, row) => sum + row.total, 0));
    });
});

describe('metric view', () => {
    it('aggregates the whole encounter, not just the boss', () => {
        const built = metricLadder();

        expect(built.rows[0].cells[0]!.loop.boss).toBe(1);
        expect(built.rows[0].cells[0]!.loop.total).toBe(2); // boss + left prime
        expect(buildMetricView(built, 'tokens').loopValues[0]).toBe(3); // whole loop, both bosses
    });

    it('normalises efficiency by boss HP, so the bigger boss is not automatically the worst', () => {
        const built = metricLadder();
        // Boss L1: 2 tokens on a 20M boss = 1.0 per 10M. Boss L2: 1 token on a 10M boss = 1.0.
        expect(efficiencyOf(built.rows[0].cells[0]!.loop, built.ladder[0].bossMaxHp)).toBeCloseTo(1, 5);
        expect(efficiencyOf(built.rows[0].cells[1]!.loop, built.ladder[1].bossMaxHp)).toBeCloseTo(1, 5);
    });

    it('refuses to invent an efficiency without a boss max HP', () => {
        expect(efficiencyOf({ total: 5 } as LoopTokenCounts, 0)).toBeUndefined();
    });

    it('calls a column flat once two loops repeat the same cost, and says so in words', () => {
        // A single loop is excluded on purpose: one data point calling itself "flat" overclaims a
        // trend from a sample of one. Two loops costing the same is the smallest real repeat.
        const flatEntries = [
            boss({ set: 0, remainingHp: 0, maxHp: 20_000_000, completedOn: START + DAY }),
            leftPrime({ set: 0, remainingHp: 0, completedOn: START + DAY }),
            boss({ unitId: L2_BOSS, set: 1, remainingHp: 0, maxHp: 10_000_000, completedOn: START + 2 * DAY }),
            // set drops back to 0 → a new loop, L1 costing the same again
            boss({ set: 0, remainingHp: 0, maxHp: 20_000_000, completedOn: START + 3 * DAY }),
            leftPrime({ set: 0, remainingHp: 0, completedOn: START + 3 * DAY }),
        ];
        const view = buildMetricView(buildLoopLadder(buildBossLoopRows(flatEntries), tierOf, NOW), 'tokens');

        expect(view.columns[0].isFlat).toBe(true);
        expect(view.columns[0].rangeLabel).toBe('flat at 2');
    });

    it('gives a single-loop column no range label at all', () => {
        // Same shape as the flat case above but with only the first loop — nothing to range over yet.
        const view = buildMetricView(metricLadder(), 'tokens');

        expect(view.columns[0].isFlat).toBe(true);
        expect(view.columns[0].rangeLabel).toBe('');
    });

    it('sums tokens but peaks players', () => {
        const built = metricLadder();

        expect(buildMetricView(built, 'tokens').columns[0].seasonValue).toBe(2);
        // Two distinct members hit boss L1, so its peak is 2 rather than a sum across loops.
        expect(buildMetricView(built, 'players').columns[0].seasonValue).toBe(2);
    });
});

/** A past season's shape: per-loop token counts but no HP anywhere, so no outcome is derivable. */
function historicalLoop(loopNumber: number, boss: number): LoopTokenCounts {
    return {
        loopNumber,
        boss,
        left: 0,
        right: 0,
        total: boss,
        finalRemainingHp: undefined,
        leftFinalRemainingHp: undefined,
        rightFinalRemainingHp: undefined,
        bombs: 0,
        players: 0,
        firstCompletedOn: undefined,
        lastCompletedOn: undefined,
    };
}

/** Boss L1 reached on both loops, boss L2 only on the first — the season ended part-way round. */
const historicalRows = (): BossLoopRow[] => [
    {
        bossPrefix: 'GuildBoss7',
        rarity: Rarity.Legendary,
        set: 0,
        bossUnitId: L1_BOSS,
        bossMaxHp: 30_000_000,
        leftPrimeUnitId: L1_LEFT,
        rightPrimeUnitId: L1_RIGHT,
        hasPrimes: true,
        loops: [historicalLoop(1, 3), historicalLoop(2, 4)],
    },
    {
        bossPrefix: 'GuildBoss8',
        rarity: Rarity.Legendary,
        set: 1,
        bossUnitId: L2_BOSS,
        bossMaxHp: 10_000_000,
        leftPrimeUnitId: undefined,
        rightPrimeUnitId: undefined,
        hasPrimes: true,
        loops: [historicalLoop(1, 2)],
    },
];

describe('buildLoopSummary', () => {
    it('averages completed loops only, so a partial loop cannot drag it down', () => {
        const { built, summary: result } = summaryOf();
        const completed = built.rows.filter(row => !row.isRunning);

        expect(result.loopsCompleted).toBe(completed.length);
        expect(result.tokensPerLoop).toBe(completed[0].total);
        expect(result.tokensPerLoop).not.toBe(built.grandTotal / built.rows.length);
    });

    it('reports where the running loop has got to', () => {
        expect(summaryOf().summary.nowAt).toBe('L1');
    });

    it('picks the costliest boss per unit of HP, not the biggest boss', () => {
        // L1 is the 30M boss at 1 token (0.33/10M); L2 is 10M at 1 token (1.0/10M). L2 is worse
        // despite being a third of the size.
        expect(summaryOf().summary.leastEfficient?.tier).toBe('L2');
    });

    it('names a boss whose primes were skipped on every loop', () => {
        expect(summaryOf().summary.alwaysSkippedTier).toBe('L1');
    });

    it('has no running loop once everything is cleared', () => {
        const built = buildLoopLadder(buildBossLoopRows([boss({ set: 0, remainingHp: 0 })]), tierOf, NOW);

        expect(buildLoopSummary(built, tierOf, bossNameOf).nowAt).toBe('');
    });

    it('leaves out the loop a past season ended mid-way through', () => {
        // A historical season carries no HP, so nothing is ever "running" — completeness has to come
        // from whether every boss was reached. Loop 2 stopped at the first boss and must not be
        // averaged in as if the guild had finished it.
        const built = buildLoopLadder(historicalRows(), tierOf, NOW);

        expect(built.hasOutcomeData).toBe(false);
        expect(built.rows.map(row => row.isComplete)).toEqual([true, false]);
        expect(buildLoopSummary(built, tierOf, bossNameOf).loopsCompleted).toBe(1);
        expect(buildLoopSummary(built, tierOf, bossNameOf).tokensPerLoop).toBe(built.rows[0].total);
    });
});

/**
 * A cheap boss that moves (1 → 2) beside an expensive one that does not (4), and a second loop that
 * stops before reaching the expensive boss. Per-boss scaling, gaps and outcomes all need this shape.
 */
const boardEntries = () => [
    boss({ set: 0, remainingHp: 0 }), // loop 1 · L1 · 1 token · killed
    boss({ unitId: L2_BOSS, set: 1, remainingHp: 700 }),
    boss({ unitId: L2_BOSS, set: 1, remainingHp: 500 }),
    boss({ unitId: L2_BOSS, set: 1, remainingHp: 200 }),
    boss({ unitId: L2_BOSS, set: 1, remainingHp: 0 }), // loop 1 · L2 · 4 tokens · killed
    boss({ set: 0, remainingHp: 500 }), // set drops back to 0 → loop 2
    boss({ set: 0, remainingHp: 300 }), // loop 2 · L1 · 2 tokens · still alive
];

const boardOf = (metric: LoopMetric = 'tokens', scale: BarScale = 'boss') => {
    const ladder = buildLoopLadder(buildBossLoopRows(boardEntries()), tierOf, NOW);
    return { ladder, board: buildLoopBoard(ladder, buildMetricView(ladder, metric), scale) };
};

describe('buildLoopBoard', () => {
    it('scales each boss to its own busiest loop, never to the board', () => {
        const [cheap, expensive] = boardOf().board.bosses;

        expect(cheap.bars.map(bar => bar.value)).toEqual([1, 2]);
        // Scaled to the board's max of 4, this boss's own doubling would read 25% → 50% and the whole
        // row would look like a flat stub next to the expensive one. That was the original complaint.
        expect(cheap.bars.map(bar => bar.percent)).toEqual([50, 100]);
        expect(expensive.bars[0].percent).toBe(100);
    });

    it('leaves a gap where a loop never reached the boss', () => {
        const { board } = boardOf();
        const [, expensive] = board.bosses;

        // Every loop keeps a slot, so a boss's bars stay aligned under the loop columns.
        expect(board.loops.map(loop => loop.loopNumber)).toEqual([1, 2]);
        expect(expensive.bars).toHaveLength(2);
        expect(expensive.bars[1].value).toBeUndefined();
        expect(expensive.bars[1].percent).toBe(0);
        expect(expensive.bars[1].outcome).toBeUndefined();
        expect(expensive.reached).toBe(1);
    });

    it('carries the boss outcome, so a boss still standing can be marked', () => {
        expect(boardOf().board.bosses[0].bars.map(bar => bar.outcome)).toEqual(['kill', 'alive']);
    });

    it('follows the metric switcher rather than fixing on tokens', () => {
        expect(boardOf('tokens').board.bosses[0].bars.map(bar => bar.value)).toEqual([1, 2]);
        // One member did all of it, so the same two loops read 1 and 1 under Players.
        expect(boardOf('players').board.bosses[0].bars.map(bar => bar.value)).toEqual([1, 1]);
    });

    it('leaves a genuine zero at zero rather than lifting it to the visibility floor', () => {
        const { board } = boardOf('bombs');

        expect(board.bosses[0].bars.map(bar => bar.value)).toEqual([0, 0]);
        expect(board.bosses[0].bars.map(bar => bar.percent)).toEqual([0, 0]);
    });

    it('keeps a real but tiny value visible', () => {
        // 1 against 40 is 2.5% of the track — under a pixel at any sane row width, so it is floored.
        const rows: BossLoopRow[] = [{ ...historicalRows()[0], loops: [historicalLoop(1, 40), historicalLoop(2, 1)] }];
        const ladder = buildLoopLadder(rows, tierOf, NOW);
        const { percent } = buildLoopBoard(ladder, buildMetricView(ladder, 'tokens'), 'boss').bosses[0].bars[1];

        expect(percent).toBeGreaterThan((1 / 40) * 100);
        expect(percent).toBeLessThan(15);
    });
});

describe('buildBossDetail', () => {
    it('totals one boss across every loop that reached it', () => {
        const { ladder } = boardOf();
        const detail = buildBossDetail(ladder, 0);

        expect(detail.reached).toBe(2);
        expect(detail.bossTotal).toBe(3); // 1 + 2
        expect(detail.total).toBe(3); // no primes were fought on this boss
        expect(detail.kills).toBe(1); // loop 2 left it standing
        expect(detail.rangeLabel).toBe('1–2 per loop');
    });

    it('keeps one entry per loop, so the dialog matches the board it opened from', () => {
        const { ladder } = boardOf();
        const detail = buildBossDetail(ladder, 1);

        expect(detail.loops).toHaveLength(ladder.rows.length);
        expect(detail.loops[1].cell).toBeUndefined();
        expect(detail.loops[1].percent).toBe(0);
        expect(detail.reached).toBe(1);
    });

    it('peaks members rather than summing them', () => {
        const detail = buildBossDetail(boardOf().ladder, 0);

        // The same member hit this boss on both loops. A sum would report two people.
        expect(detail.reached).toBe(2);
        expect(detail.peakPlayers).toBe(1);
    });

    it('reports a past season as carrying no outcomes', () => {
        const detail = buildBossDetail(buildLoopLadder(historicalRows(), tierOf, NOW), 0);

        expect(detail.hasOutcomeData).toBe(false);
        expect(detail.total).toBe(7); // 3 + 4
        expect(detail.rangeLabel).toBe('3–4 per loop');
    });
});

describe('board bar segments', () => {
    it('splits the fill into left prime, boss and right prime', () => {
        // 2 boss + 1 left + 1 right = 4 tokens → 25 / 50 / 25.
        const ladder = buildLoopLadder(
            buildBossLoopRows([
                boss({ set: 0 }),
                boss({ set: 0, remainingHp: 0 }),
                leftPrime({ set: 0, remainingHp: 0 }),
                rightPrime({ set: 0, remainingHp: 0 }),
            ]),
            tierOf,
            NOW
        );
        const { segments } = buildLoopBoard(ladder, buildMetricView(ladder, 'tokens'), 'boss').bosses[0].bars[0];

        expect(segments).toEqual({ left: 25, boss: 50, right: 25 });
    });

    it('sums the three segments to the whole fill wherever anything was spent', () => {
        const { board } = boardOf();

        for (const boss of board.bosses) {
            for (const bar of boss.bars) {
                if (bar.segments === undefined) continue;
                expect(bar.segments.left + bar.segments.boss + bar.segments.right).toBeCloseTo(100, 10);
            }
        }
    });

    it('leaves an unreached loop with nothing to split', () => {
        const [, expensive] = boardOf().board.bosses;

        expect(expensive.bars[1].segments).toBeUndefined();
    });

    it('splits on tokens regardless of the selected metric, since the view decides whether to draw it', () => {
        // The composition is a fact about the encounter, not a reading of the metric, so it is always
        // computed — `BoardBarCell` is what withholds it outside Tokens.
        expect(boardOf('players').board.bosses[0].bars[0].segments).toEqual({ left: 0, boss: 100, right: 0 });
    });
});

describe('bar scale switch', () => {
    it('measures each boss against itself in per-boss mode', () => {
        const [cheap] = boardOf().board.bosses;

        // L1 costs 1 then 2; its own busiest loop is 2, so the heavier loop fills the track.
        expect(cheap.bars.map(bar => bar.percent)).toEqual([50, 100]);
    });

    it('measures every boss against the whole board when asked', () => {
        const ladder = buildLoopLadder(buildBossLoopRows(boardEntries()), tierOf, NOW);
        const view = buildMetricView(ladder, 'tokens');
        const [cheap, expensive] = buildLoopBoard(ladder, view, 'board').bosses;

        // Board max is L2's 4. L1's 1 and 2 now read against that, not against its own 2.
        expect(cheap.bars.map(bar => bar.percent)).toEqual([25, 50]);
        // The boss holding the board max still fills its track, so the two scales agree there.
        expect(expensive.bars[0].percent).toBe(100);
    });

    it('leaves an unreached loop empty under either scale', () => {
        const ladder = buildLoopLadder(buildBossLoopRows(boardEntries()), tierOf, NOW);
        const view = buildMetricView(ladder, 'tokens');

        for (const scale of ['boss', 'board'] as const) {
            const [, expensive] = buildLoopBoard(ladder, view, scale).bosses;
            expect(expensive.bars[1].value).toBeUndefined();
            expect(expensive.bars[1].percent).toBe(0);
        }
    });
});

/** Minimal row — only `rarity`/`set` matter to `restrictToCurrentLoopRange`. */
const rowAt = (rarity: Rarity, set: number): BossLoopRow => ({
    bossPrefix: `GuildBossFake${rarity}-${set}`,
    rarity,
    set,
    bossUnitId: 'fake',
    bossMaxHp: 1000,
    leftPrimeUnitId: undefined,
    rightPrimeUnitId: undefined,
    hasPrimes: false,
    loops: [],
});

describe('restrictToCurrentLoopRange', () => {
    it('drops Legendary rows below set 3 (L1-L3), keeps L4/L5 and every Mythic row', () => {
        const rows = [
            rowAt(Rarity.Legendary, 0), // L1
            rowAt(Rarity.Legendary, 1), // L2
            rowAt(Rarity.Legendary, 2), // L3
            rowAt(Rarity.Legendary, 3), // L4
            rowAt(Rarity.Legendary, 4), // L5
            rowAt(Rarity.Mythic, 0), // M1
            rowAt(Rarity.Mythic, 1), // M2
            rowAt(Rarity.Mythic, 2), // M3
        ];

        const kept = restrictToCurrentLoopRange(rows).map(row => tierLabel(row.rarity, row.set));

        expect(kept).toEqual(['L4', 'L5', 'M1', 'M2', 'M3']);
    });
});
