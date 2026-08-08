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
    buildBossLoopRows,
    buildLoopLadder,
    buildLoopSummary,
    buildMetricView,
    cellDisplayValue,
    efficiencyOf,
    primeOutcome,
    resolveLadderPrimes,
    type BossLoopRow,
    type LoopTokenCounts,
} from './loops-tab.utils';

// Rungs must use *distinct* GuildBoss families: `buildBossLoopRows` groups by `prefix:rarity`, so two
// sets of the same family in one rarity would collapse into a single column. Real ladders never do
// that — each rung is a different boss. (Across rarities they can repeat, which is fine.)
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
        // skipping a rung's primes.
        const ladder = buildLoopLadder(buildBossLoopRows([boss({ remainingHp: 0 })]), tierOf, NOW);
        const cell = ladder.rows[0].cells[0]!;

        expect(ladder.ladder[0].hasPrimes).toBe(false);
        expect(cell.left).toBe('skip');
        expect(cell.right).toBe('skip');
        expect(buildLoopSummary(ladder, tierOf, bossNameOf).primesSkipped).toBe(1);
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
    it('returns rungs in ascending fight order', () => {
        const rows = buildBossLoopRows([
            boss({ unitId: M1_BOSS, rarity: Rarity.Mythic, set: 0, remainingHp: 0 }),
            boss({ unitId: L2_BOSS, rarity: Rarity.Legendary, set: 1, remainingHp: 0 }),
            boss({ unitId: L1_BOSS, rarity: Rarity.Legendary, set: 0, remainingHp: 0 }),
        ]);

        // Declared Mythic-first; must come back L1 → L2 → M1.
        expect(rows.map(row => tierOf(row))).toEqual(['L1', 'L2', 'M1']);
    });
});

/** Loop 1 clears both rungs; loop 2 reaches only the first and leaves its boss alive. */
const ladderEntries = () => [
    boss({ set: 0, remainingHp: 0, completedOn: START + DAY }),
    leftPrime({ set: 0, remainingHp: 0, completedOn: START + DAY }),
    boss({ unitId: L2_BOSS, set: 1, remainingHp: 0, completedOn: START + 3 * DAY }),
    // set drops back to 0 → a new loop
    boss({ set: 0, remainingHp: 700, completedOn: START + 8 * DAY }),
];

/** Two rungs of different sizes, so efficiency has something to normalise. */
const metricEntries = () => [
    boss({ set: 0, remainingHp: 0, maxHp: 20_000_000, userId: 'a' }),
    leftPrime({ set: 0, remainingHp: 0, userId: 'b' }),
    boss({ unitId: L2_BOSS, set: 1, remainingHp: 0, maxHp: 10_000_000, userId: 'a' }),
];

/** A big cheap rung and a small expensive one, plus an unfinished loop. */
const summaryEntries = () => [
    boss({ set: 0, remainingHp: 0, maxHp: 30_000_000, completedOn: START + DAY }),
    boss({ unitId: L2_BOSS, set: 1, remainingHp: 0, maxHp: 10_000_000, completedOn: START + 3 * DAY }),
    boss({ set: 0, remainingHp: 700, completedOn: START + 8 * DAY }),
];

/** Built fresh per test so no suite can mutate anothers ladder. */
const metricLadder = () => buildLoopLadder(buildBossLoopRows(metricEntries()), tierOf, NOW);

const summaryOf = () => {
    const built = buildLoopLadder(buildBossLoopRows(summaryEntries()), tierOf, NOW);
    return { built, summary: buildLoopSummary(built, tierOf, bossNameOf) };
};

describe('buildLoopLadder', () => {
    it('pivots to one row per loop and one column per rung', () => {
        const ladder = buildLoopLadder(buildBossLoopRows(ladderEntries()), tierOf, NOW);

        expect(ladder.ladder).toHaveLength(2);
        expect(ladder.rows.map(row => row.loopNumber)).toEqual([1, 2]);
        expect(ladder.hasOutcomeData).toBe(true);
    });

    it('marks the unfinished loop running and leaves unreached rungs undefined', () => {
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
    it('shows boss tokens in the cell but aggregates all three', () => {
        const built = metricLadder();
        const cell = built.rows[0].cells[0]!;

        expect(cellDisplayValue('tokens', cell, built.ladder[0])).toBe(1); // boss only
        expect(cell.loop.total).toBe(2); // boss + left prime
        expect(buildMetricView(built, 'tokens').loopValues[0]).toBe(3); // whole loop
    });

    it('normalises efficiency by boss HP, so the bigger boss is not automatically the worst', () => {
        const built = metricLadder();
        // Rung L1: 2 tokens on a 20M boss = 1.0 per 10M. Rung L2: 1 token on a 10M boss = 1.0.
        expect(efficiencyOf(built.rows[0].cells[0]!.loop, built.ladder[0].bossMaxHp)).toBeCloseTo(1, 5);
        expect(efficiencyOf(built.rows[0].cells[1]!.loop, built.ladder[1].bossMaxHp)).toBeCloseTo(1, 5);
    });

    it('refuses to invent an efficiency without a boss max HP', () => {
        expect(efficiencyOf({ total: 5 } as LoopTokenCounts, 0)).toBeUndefined();
    });

    it('calls a single-valued column flat and says so in words', () => {
        const view = buildMetricView(metricLadder(), 'tokens');

        expect(view.columns[0].isFlat).toBe(true);
        expect(view.columns[0].rangeLabel).toBe('flat at 2');
    });

    it('sums tokens but peaks players', () => {
        const built = metricLadder();

        expect(buildMetricView(built, 'tokens').columns[0].seasonValue).toBe(2);
        // Two distinct members hit rung L1, so its peak is 2 rather than a sum across loops.
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

/** Rung L1 reached on both loops, rung L2 only on the first — the season ended part-way round. */
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

    it('picks the costliest rung per unit of HP, not the biggest boss', () => {
        // L1 is the 30M boss at 1 token (0.33/10M); L2 is 10M at 1 token (1.0/10M). L2 is worse
        // despite being a third of the size.
        expect(summaryOf().summary.leastEfficient?.tier).toBe('L2');
    });

    it('names a rung whose primes were skipped on every loop', () => {
        expect(summaryOf().summary.alwaysSkippedTier).toBe('L1');
    });

    it('has no running loop once everything is cleared', () => {
        const built = buildLoopLadder(buildBossLoopRows([boss({ set: 0, remainingHp: 0 })]), tierOf, NOW);

        expect(buildLoopSummary(built, tierOf, bossNameOf).nowAt).toBe('');
    });

    it('leaves out the loop a past season ended mid-way through', () => {
        // A historical season carries no HP, so nothing is ever "running" — completeness has to come
        // from whether every rung was reached. Loop 2 stopped at the first rung and must not be
        // averaged in as if the guild had finished it.
        const built = buildLoopLadder(historicalRows(), tierOf, NOW);

        expect(built.hasOutcomeData).toBe(false);
        expect(built.rows.map(row => row.isComplete)).toEqual([true, false]);
        expect(buildLoopSummary(built, tierOf, bossNameOf).loopsCompleted).toBe(1);
        expect(buildLoopSummary(built, tierOf, bossNameOf).tokensPerLoop).toBe(built.rows[0].total);
    });
});
