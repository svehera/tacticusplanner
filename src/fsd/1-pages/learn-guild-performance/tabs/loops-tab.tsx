/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useMemo, useState, type ReactNode } from 'react';

import { type GuildSeasonHistoryResponse, type TacticusGuildRaidResponse } from '@/fsd/5-shared/lib/tacticus-api';
import { Segmented } from '@/fsd/5-shared/ui';
import { RarityIcon } from '@/fsd/5-shared/ui/icons';

import {
    CaptureButton,
    CardGrid,
    EncounterIcon,
    ReadinessTile,
    ScrollX,
    SectionHeader,
    TableCard,
} from '../guild-performance.components';
import { captureFileName, useSectionCapture } from '../guild-performance.hook';
import { tierLabel, unitDisplayLabel } from '../guild-performance.utils';

import {
    buildBossLoopRows,
    buildBossLoopRowsFromSummary,
    buildLoopLadder,
    buildLoopSummary,
    buildMetricView,
    cellDisplayValue,
    LOOP_METRICS,
    metricDefinition,
    resolveLadderPrimes,
    type BossLoopRow,
    type ColumnSeries,
    type LadderCell,
    type LadderRow,
    type LoopLadder,
    type LoopMetric,
    type LoopSummary,
    type MetricView,
    type Outcome,
} from './loops-tab.utils';

// ---------------------------------------------------------------------------
// Geometry
//
// The column count is a runtime value, so the template must be an inline style — Tailwind's JIT
// cannot generate `grid-cols-[150px_repeat(7,...)_118px]`. Same reason `ScrollX` takes `minWidth` as
// a prop. Geometry inline is fine; colour never is.
// ---------------------------------------------------------------------------

const LEAD_COLUMN = 150;
const SLOT_MIN = 92;
const TRAIL_COLUMN = 118;

const ladderTemplate = (slots: number) =>
    `${LEAD_COLUMN}px repeat(${slots}, minmax(${SLOT_MIN}px, 1fr)) ${TRAIL_COLUMN}px`;

/** Derived, not a constant — a 7-rung ladder is typical but the length varies by season and progress. */
const ladderMinWidth = (slots: number) => LEAD_COLUMN + slots * SLOT_MIN + TRAIL_COLUMN;

const tierOf = (row: BossLoopRow) => tierLabel(row.rarity, row.set);
const bossNameOf = (row: BossLoopRow) => unitDisplayLabel(row.bossUnitId);

const compact = (n: number) => n.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 1 });

const gridRule = 'border-l border-(--hairline)';
const microHeader = 'px-2.5 py-1.5 text-xs font-bold tracking-widest text-(--soft-fg) uppercase';

// No category colour anywhere in this tab: position and the `L`/`R` marker already carry left vs
// right, so the only colour inside the matrix is state — `--success`/`--warning` for an outcome and
// `--primary` for the loop in flight.

const formatMetricValue = (value: number | undefined, metric: LoopMetric): string => {
    if (value === undefined) return '–';
    if (metric === 'efficiency') return value.toFixed(1);
    return String(Math.round(value));
};

// ---------------------------------------------------------------------------
// Outcome dots — three distinct shapes, so colour is never the only signal
// ---------------------------------------------------------------------------

/** 10px, not 7px: below that a 2px ring and a 1px dashed ring are the same smudge and only the colour reads. */
const DOT_BASE = 'inline-flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full text-[8px] leading-none';

const DOT_STATE: Record<Outcome, string> = {
    kill: 'bg-(--success) font-extrabold text-(--success-fg)',
    alive: 'border-2 border-(--warning)',
    skip: 'border border-dashed border-(--fg)/55',
};

/** `aria-hidden`: the enclosing cell's `aria-label` already states every outcome in words. */
const Dot = ({ outcome, title }: { outcome: Outcome; title?: string }) => (
    <span className={`${DOT_BASE} ${DOT_STATE[outcome]}`} title={title} aria-hidden="true">
        {outcome === 'kill' ? '✓' : ''}
    </span>
);

const OUTCOME_WORD: Record<Outcome, string> = { kill: 'killed', alive: 'still alive', skip: 'skipped' };

const primeTitle = (unitId: string | undefined, side: string, outcome: Outcome, tokens: number): string => {
    const label = unitId === undefined ? `${side} prime` : `${unitDisplayLabel(unitId)} — ${side} prime`;
    return `${label}: ${tokens} ${tokens === 1 ? 'token' : 'tokens'}, ${OUTCOME_WORD[outcome]}`;
};

// ---------------------------------------------------------------------------
// Legend — one bar holding the metric switcher and the colour key
// ---------------------------------------------------------------------------

const LegendItem = ({ swatch, children }: { swatch: ReactNode; children: ReactNode }) => (
    <span className="flex items-center gap-1.5 text-xs text-(--soft-fg)">
        {swatch}
        {children}
    </span>
);

const Legend = ({
    metric,
    onMetric,
    available,
    hasOutcomeData,
    onCapture,
    isCapturing,
}: {
    metric: LoopMetric;
    onMetric: (next: LoopMetric) => void;
    available: typeof LOOP_METRICS;
    hasOutcomeData: boolean;
    onCapture: () => void;
    isCapturing: boolean;
}) => {
    const definition = metricDefinition(metric);
    return (
        <div className="overflow-hidden rounded-xl border border-(--border) bg-(--overlay)">
            <div className="flex flex-wrap items-center gap-3 border-b border-(--border) px-4 py-2.5">
                <Segmented
                    options={available.map(entry => ({ value: entry.value, label: entry.label }))}
                    value={metric}
                    onChange={onMetric}
                />
                <span className="flex flex-1 flex-wrap items-baseline justify-end gap-2">
                    <span className="text-xs font-bold text-(--fg)">{definition.title}</span>
                    <span className="text-xs text-(--soft-fg)">{definition.explanation}</span>
                </span>
                {/* The ladder is the shareable artefact here, so the button sits with the control
                    that decides what the ladder shows. */}
                <CaptureButton onCapture={onCapture} isCapturing={isCapturing} />
            </div>
            <div className="flex flex-wrap items-center gap-4 px-4 py-2">
                {/* One line where there were three swatches. The large number is self-evidently the
                    boss, and with no category colour left there is nothing to key — only the two
                    markers need naming. */}
                <span className="text-xs text-(--soft-fg)">
                    <span className="text-[10px] font-extrabold">L</span> /{' '}
                    <span className="text-[10px] font-extrabold">R</span> mark the left and right prime
                </span>
                {hasOutcomeData ? (
                    <>
                        <span className="h-4 w-px bg-(--border)" />
                        <LegendItem swatch={<Dot outcome="kill" />}>Killed</LegendItem>
                        <LegendItem swatch={<Dot outcome="alive" />}>Still alive</LegendItem>
                        <LegendItem swatch={<Dot outcome="skip" />}>Skipped</LegendItem>
                    </>
                ) : (
                    <span className="text-xs text-(--soft-fg)">
                        Kill and prime outcomes aren&apos;t stored for past seasons — token counts only.
                    </span>
                )}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Cell
//
// No bar. Measured down a column on real season data, a board-scaled bar travels 0–12px, so it draws
// a near-flat line every loop; what it does show is boss size, which is already in the header.
// ---------------------------------------------------------------------------

/** A prime the export never named still has a slot, so it gets a positional label. */
const primeName = (unitId: string | undefined, side: string) =>
    unitId === undefined ? `${side} prime` : unitDisplayLabel(unitId);

const cellTitle = (cell: LadderCell, column: BossLoopRow, hasOutcomeData: boolean): string => {
    const { loop } = cell;
    const state = (outcome: Outcome) => (hasOutcomeData ? ` (${OUTCOME_WORD[outcome]})` : '');
    const parts = [
        `boss ${loop.boss}${state(cell.boss)}`,
        `${primeName(column.leftPrimeUnitId, 'left')} ${loop.left}${state(cell.left)}`,
        `${primeName(column.rightPrimeUnitId, 'right')} ${loop.right}${state(cell.right)}`,
    ];
    const extra = loop.bombs > 0 ? ` · ${loop.bombs} bomb${loop.bombs === 1 ? '' : 's'}` : '';
    return `${loop.total} tokens · ${parts.join(' · ')}${extra}`;
};

type PrimeSide = 'left' | 'right';

const PRIME_MARKER: Record<PrimeSide, string> = { left: 'L', right: 'R' };

/**
 * One prime's spend. Side is carried by two signals, since it is the thing a reader most needs to
 * tell apart: position (`justify-between` pins each prime to its own edge, mirroring the encounter)
 * and an explicit `L`/`R` marker, so a cell reads without consulting the legend.
 *
 * The internal order is deliberately *not* mirrored — pointing both halves outward puts the two
 * outcome dots side by side in the middle, where they are easy to misattribute.
 */
const PrimeValue = ({
    side,
    tokens,
    outcome,
    title,
    hasOutcomeData,
}: {
    side: PrimeSide;
    tokens: number;
    outcome: Outcome;
    title: string;
    hasOutcomeData: boolean;
}) => (
    <span className="flex items-center gap-1" title={title}>
        {/* The marker is a label, so it sits at label weight and colour. */}
        <span className="text-[10px] font-extrabold text-(--soft-fg)">{PRIME_MARKER[side]}</span>
        {/* A skipped prime is a dash, never a zero — nobody spent, which is a choice, not a nil
            result. Full `--soft-fg`: at /60 it composited to 3.4:1 and the tab's headline finding
            was the least legible thing on screen. */}
        <span className={`text-xs font-bold ${tokens === 0 ? 'text-(--soft-fg)' : 'text-(--fg)'}`}>
            {tokens === 0 ? '–' : tokens}
        </span>
        {hasOutcomeData && <Dot outcome={outcome} />}
    </span>
);

const Cell = ({
    cell,
    column,
    metric,
    hasOutcomeData,
}: {
    cell: LadderCell | undefined;
    column: BossLoopRow;
    metric: LoopMetric;
    hasOutcomeData: boolean;
}) => {
    if (cell === undefined) {
        return (
            <span
                role="cell"
                className={`flex items-center justify-center ${gridRule} text-xs text-(--soft-fg) opacity-45`}
                title="Not reached in this loop"
                aria-label="Not reached in this loop">
                ·
            </span>
        );
    }

    const isStanding = hasOutcomeData && cell.boss !== 'kill';
    const value = cellDisplayValue(metric, cell, column);

    const description = cellTitle(cell, column, hasOutcomeData);

    return (
        <span
            role="cell"
            className={`flex flex-col justify-center gap-[5px] px-3 py-2.5 ${gridRule} ${
                isStanding ? 'bg-(--primary)/10' : ''
            }`}
            title={description}
            aria-label={description}>
            {/* Centred, so the boss sits above the gap between its two primes and the cell echoes
                the header's [left prime] [BOSS] [right prime] arrangement. */}
            <span className="flex items-center justify-center gap-1.5">
                <span
                    className={`text-lg font-extrabold tabular-nums ${isStanding ? 'text-(--primary)' : 'text-(--fg)'}`}>
                    {formatMetricValue(value, metric)}
                </span>
                {hasOutcomeData && <Dot outcome={cell.boss} title={`Boss ${OUTCOME_WORD[cell.boss]}`} />}
            </span>
            {/* Both primes always render. Every boss has exactly two, so a missing one was skipped. */}
            {metric === 'tokens' && (
                <span className="flex items-center justify-between border-t border-(--border)/40 pt-1">
                    <PrimeValue
                        side="left"
                        tokens={cell.loop.left}
                        outcome={cell.left}
                        title={primeTitle(column.leftPrimeUnitId, 'left', cell.left, cell.loop.left)}
                        hasOutcomeData={hasOutcomeData}
                    />
                    <PrimeValue
                        side="right"
                        tokens={cell.loop.right}
                        outcome={cell.right}
                        title={primeTitle(column.rightPrimeUnitId, 'right', cell.right, cell.loop.right)}
                        hasOutcomeData={hasOutcomeData}
                    />
                </span>
            )}
        </span>
    );
};

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

/** No ring: size already separates a 17px prime from the 30px boss. */
const PrimePortrait = ({ unitId, side }: { unitId: string | undefined; side: string }) => (
    <span className="inline-flex">
        <EncounterIcon
            unitId={unitId}
            size={17}
            tooltip={
                unitId === undefined
                    ? `${side} prime (optional)`
                    : `${unitDisplayLabel(unitId)} — ${side} prime (optional)`
            }
        />
    </span>
);

const LadderHeader = ({ ladder, metric }: { ladder: BossLoopRow[]; metric: LoopMetric }) => (
    <div
        role="row"
        className="grid border-b border-(--border) bg-(--soft)"
        style={{ gridTemplateColumns: ladderTemplate(ladder.length) }}>
        <span role="columnheader" className={`${microHeader} self-end`}>
            Loop
        </span>
        {ladder.map(column => (
            <span
                role="columnheader"
                aria-label={`${tierOf(column)} — ${bossNameOf(column)}`}
                key={`${column.bossPrefix}:${column.rarity}`}
                className={`flex flex-col items-center gap-[3px] px-1 py-1.5 ${gridRule}`}>
                <span className="flex items-end gap-[3px]">
                    <PrimePortrait unitId={column.leftPrimeUnitId} side="left" />
                    <EncounterIcon unitId={column.bossUnitId} size={30} />
                    <PrimePortrait unitId={column.rightPrimeUnitId} side="right" />
                </span>
                <span className="flex items-center gap-1">
                    <RarityIcon rarity={column.rarity} />
                    <span className="text-xs font-bold text-(--fg)">{tierOf(column)}</span>
                </span>
                {column.bossMaxHp > 0 && (
                    <span className="text-xs text-(--soft-fg) tabular-nums">{compact(column.bossMaxHp)}</span>
                )}
            </span>
        ))}
        {/* The trailing column means something different per metric, so it is labelled from the
            metric rather than fixed. */}
        <span role="columnheader" className={`${microHeader} ${gridRule} self-end text-right`}>
            {metricDefinition(metric).totalLabel}
        </span>
    </div>
);

// ---------------------------------------------------------------------------
// Body row
//
// The accent stripe sits on the first cell *inside* the grid, not on the row wrapper: on the wrapper
// its 3px border shifts the whole grid and the `minmax` tracks absorb it unevenly, skewing the
// separators against the header.
// ---------------------------------------------------------------------------

const LadderBodyRow = ({
    row,
    ladder,
    view,
    rowIndex,
}: {
    row: LadderRow;
    ladder: LoopLadder;
    view: MetricView;
    rowIndex: number;
}) => (
    <div
        role="row"
        className={`grid items-stretch border-b border-(--hairline) hover:bg-(--primary)/12 ${
            row.isRunning ? 'bg-(--primary)/4' : ''
        }`}
        style={{ gridTemplateColumns: ladderTemplate(ladder.ladder.length) }}>
        <span
            role="rowheader"
            className={`flex items-center gap-2 border-l-[3px] px-2.5 py-2 ${
                row.isRunning ? 'border-l-(--primary)' : 'border-l-transparent'
            }`}>
            <span
                className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${
                    row.isRunning ? 'bg-(--primary) text-(--primary-fg)' : 'bg-(--success)/20 text-(--success)'
                }`}>
                {row.loopNumber}
            </span>
            <span className="flex min-w-0 flex-col">
                {/* A tint alone is too quiet for the single most important row. */}
                {row.isRunning && (
                    <span className="w-fit rounded-full bg-(--primary) px-1.5 text-[10px] font-extrabold tracking-[.14em] text-(--primary-fg) uppercase">
                        Now
                    </span>
                )}
                {row.paceLabel !== '' && (
                    <span
                        className={`truncate text-xs font-semibold ${
                            row.isRunning ? 'text-(--primary)' : 'text-(--soft-fg)'
                        }`}>
                        {row.paceLabel}
                    </span>
                )}
            </span>
        </span>
        {row.cells.map((cell, index) => (
            <Cell
                key={`${ladder.ladder[index].bossPrefix}:${ladder.ladder[index].rarity}`}
                cell={cell}
                column={ladder.ladder[index]}
                metric={view.metric}
                hasOutcomeData={ladder.hasOutcomeData}
            />
        ))}
        <span role="cell" className={`flex flex-col items-end justify-center px-2.5 py-2 ${gridRule}`}>
            <span className="text-sm font-extrabold text-(--fg) tabular-nums">
                {formatMetricValue(view.loopValues[rowIndex], view.metric)}
            </span>
            {view.metric === 'tokens' && (
                <span className="text-xs text-(--soft-fg) tabular-nums">
                    {row.bossTotal} boss · {row.primeTotal} prime
                </span>
            )}
        </span>
    </div>
);

// ---------------------------------------------------------------------------
// Footer sparkline
//
// Autoscaled to its own column — that is the whole point. A season's cost per boss barely moves, so
// a board-scaled line would be flat; scaled to the column, 44→47 becomes a readable shape.
// ---------------------------------------------------------------------------

const SPARK_WIDTH = 74;
const SPARK_HEIGHT = 22;
const SPARK_PAD = 3;

const Sparkline = ({ series, metric }: { series: ColumnSeries; metric: LoopMetric }) => {
    const { values, min, max, isFlat } = series;
    if (values.length === 0 || min === undefined || max === undefined) {
        return <span className="block" style={{ width: SPARK_WIDTH, height: SPARK_HEIGHT }} />;
    }

    const label = `${metric}: ${values.map(value => formatMetricValue(value, metric)).join(', ')}`;
    const span = SPARK_WIDTH - SPARK_PAD * 2;
    const xOf = (index: number) =>
        values.length === 1 ? SPARK_WIDTH / 2 : SPARK_PAD + (index / (values.length - 1)) * span;
    const yOf = (value: number) => {
        if (isFlat) return SPARK_HEIGHT / 2;
        const usable = SPARK_HEIGHT - SPARK_PAD * 2;
        return SPARK_PAD + (1 - (value - min) / (max - min)) * usable;
    };

    // A zero-variance column draws a dashed guide instead of a solid line, which would read as a
    // real trend that happens to be flat rather than as "there is nothing to see here".
    if (isFlat) {
        return (
            <svg width={SPARK_WIDTH} height={SPARK_HEIGHT} role="img" aria-label={label}>
                <line
                    x1={SPARK_PAD}
                    y1={SPARK_HEIGHT / 2}
                    x2={SPARK_WIDTH - SPARK_PAD}
                    y2={SPARK_HEIGHT / 2}
                    className="stroke-(--fg)/38"
                    strokeWidth={1.6}
                    strokeDasharray="3 3"
                />
            </svg>
        );
    }

    return (
        <svg width={SPARK_WIDTH} height={SPARK_HEIGHT} role="img" aria-label={label}>
            <polyline
                points={values.map((value, index) => `${xOf(index)},${yOf(value)}`).join(' ')}
                fill="none"
                className="stroke-(--primary)"
                strokeWidth={1.6}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            {values.map((value, index) => (
                <circle key={index} cx={xOf(index)} cy={yOf(value)} r={1.9} className="fill-(--primary)" />
            ))}
        </svg>
    );
};

const LadderFooter = ({ ladder, view }: { ladder: LoopLadder; view: MetricView }) => (
    <div
        role="row"
        className="grid items-end bg-(--soft)"
        style={{ gridTemplateColumns: ladderTemplate(ladder.ladder.length) }}>
        <span role="rowheader" className={microHeader}>
            Season total
        </span>
        {view.columns.map((series, index) => (
            <span
                role="cell"
                key={`${ladder.ladder[index].bossPrefix}:${ladder.ladder[index].rarity}`}
                className={`flex flex-col items-center gap-0.5 px-1 py-1.5 ${gridRule}`}>
                <Sparkline series={series} metric={view.metric} />
                {/* Only when flat: otherwise this restates the shape the sparkline already draws.
                    A flat column is the one case the dashed line cannot express, so it gets words. */}
                {series.isFlat && <span className="text-xs text-(--soft-fg)">{series.rangeLabel}</span>}
                <span className="text-sm font-extrabold text-(--fg) tabular-nums">
                    {formatMetricValue(series.seasonValue, view.metric)}
                </span>
                {/* Same L/R structure as the cells, so the two read as one system. */}
                {view.metric === 'tokens' && (
                    <span className="flex w-full items-center justify-between text-xs font-bold text-(--soft-fg) tabular-nums">
                        <span>L {series.leftTotal}</span>
                        <span>R {series.rightTotal}</span>
                    </span>
                )}
                {/* Only when a loop reached this rung without killing it: otherwise the count equals
                    the sparkline's own point count and says nothing new. */}
                {ladder.hasOutcomeData && series.kills < series.values.length && (
                    <span className="text-xs text-(--soft-fg) tabular-nums">{series.kills}× killed</span>
                )}
            </span>
        ))}
        <span
            role="cell"
            className={`px-2.5 py-1.5 text-right text-sm font-extrabold text-(--fg) tabular-nums ${gridRule}`}>
            {formatMetricValue(view.grandValue, view.metric)}
        </span>
    </div>
);

// ---------------------------------------------------------------------------
// Summary tiles — fixed, not driven by the metric switcher. They are the season verdict.
// ---------------------------------------------------------------------------

/** A rung skipped on every single loop is a standing habit worth naming, not a one-off. */
const skippedCaption = (summary: LoopSummary): string => {
    if (summary.alwaysSkippedTier !== '') {
        return `${summary.alwaysSkippedTier} skipped every loop — deliberate, or forgotten?`;
    }
    if (summary.primesSkipped > 0) return 'Skipping primes saves tokens but leaves the boss at full strength';
    return 'Every boss met at reduced strength';
};

const SummaryTiles = ({ summary, hasOutcomeData }: { summary: LoopSummary; hasOutcomeData: boolean }) => {
    const capture = useSectionCapture<HTMLElement>(captureFileName('guild-loops-summary'));
    const pace = summary.daysPerLoop === undefined ? undefined : `${summary.daysPerLoop.toFixed(1)} days per loop`;
    const trendNote =
        summary.firstLoopTotal !== undefined &&
        summary.lastLoopTotal !== undefined &&
        summary.lastLoopTotal < summary.firstLoopTotal
            ? `Down from ${summary.firstLoopTotal} on loop 1 — the roster is improving`
            : summary.lastLoopTotal === undefined
              ? 'Needs one completed loop'
              : `Latest full loop cost ${summary.lastLoopTotal}`;

    return (
        // The heading both names the verdict and gives the capture button somewhere to live.
        <section ref={capture.ref} className="flex flex-col gap-2">
            <SectionHeader
                title="Season summary"
                meta={<CaptureButton onCapture={capture.onCapture} isCapturing={capture.isCapturing} />}
            />
            <CardGrid min={255} gap="gap-2.5">
                <ReadinessTile
                    label="Loops completed"
                    value={String(summary.loopsCompleted)}
                    valueClass="text-(--success)"
                    caption={
                        summary.nowAt === ''
                            ? pace
                            : `Now at ${summary.nowAt}${pace === undefined ? '' : ` · ${pace} so far`}`
                    }
                />
                <ReadinessTile
                    label="Tokens per loop"
                    value={summary.tokensPerLoop === undefined ? '—' : summary.tokensPerLoop.toFixed(1)}
                    caption={trendNote}
                />
                {summary.leastEfficient !== undefined && (
                    <ReadinessTile
                        label="Least efficient rung"
                        value={summary.leastEfficient.tier}
                        valueClass="text-(--warning)"
                        caption={`${summary.leastEfficient.bossName} — costliest per unit of HP, not simply the biggest`}
                    />
                )}
                {/* Needs prime outcomes, which a past season doesn't store. */}
                {hasOutcomeData && (
                    <ReadinessTile
                        label="Primes skipped"
                        value={String(summary.primesSkipped)}
                        valueClass={summary.primesSkipped > 0 ? 'text-(--warning)' : 'text-(--success)'}
                        caption={skippedCaption(summary)}
                    />
                )}
            </CardGrid>
        </section>
    );
};

// ---------------------------------------------------------------------------
// LoopsTab
// ---------------------------------------------------------------------------

const EmptyState = ({ children }: { children: ReactNode }) => (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-(--border) bg-(--soft) py-12 text-center text-sm text-(--soft-fg)">
        {children}
    </div>
);

export const LoopsTab = ({
    currentData,
    seasonHistory,
    selectedSeason,
}: {
    currentData: TacticusGuildRaidResponse | undefined;
    seasonHistory?: GuildSeasonHistoryResponse;
    /** Page-level sticky season selection. */
    selectedSeason: number | undefined;
}) => {
    const [metric, setMetric] = useState<LoopMetric>('tokens');
    const capture = useSectionCapture(captureFileName('guild-loops-ladder'));

    // A historical season reads per-loop counts straight from the aggregate; the live season derives
    // them from raw per-hit entries.
    const historySummary = useMemo(
        () =>
            selectedSeason === currentData?.season
                ? undefined
                : seasonHistory?.seasonData.find(entry => entry.season === selectedSeason)?.summary,
        [selectedSeason, currentData, seasonHistory]
    );

    // Both builders already return fight order, so the ladder axis is the array as-is. The season
    // config then names any prime the export never mentioned, i.e. one skipped on every loop.
    const rows = useMemo(
        () =>
            resolveLadderPrimes(
                historySummary
                    ? buildBossLoopRowsFromSummary(historySummary)
                    : buildBossLoopRows(currentData?.entries ?? []),
                currentData?.seasonConfigId
            ),
        [historySummary, currentData]
    );

    // `Date.now()` is read inside the memo so the running loop is dated once per data change rather
    // than on every render, which would make its elapsed time jitter.
    const ladder = useMemo(() => buildLoopLadder(rows, tierOf, Math.floor(Date.now() / 1000)), [rows]);
    const summary = useMemo(() => buildLoopSummary(ladder, tierOf, bossNameOf), [ladder]);

    const availableMetrics = useMemo(
        () => LOOP_METRICS.filter(definition => ladder.hasOutcomeData || !definition.liveOnly),
        [ladder.hasOutcomeData]
    );
    const effectiveMetric = availableMetrics.some(definition => definition.value === metric) ? metric : 'tokens';
    const view = useMemo(() => buildMetricView(ladder, effectiveMetric), [ladder, effectiveMetric]);

    if (currentData === undefined && seasonHistory === undefined) {
        return <p className="text-sm text-(--soft-fg)">Loading…</p>;
    }

    if (rows.length === 0) {
        return (
            <div className="flex flex-col gap-3.5">
                <SectionHeader title="Ladder progress per loop" />
                <EmptyState>No legendary or mythic boss encounters recorded for this season yet.</EmptyState>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3.5">
            <Legend
                metric={effectiveMetric}
                onMetric={setMetric}
                available={availableMetrics}
                hasOutcomeData={ladder.hasOutcomeData}
                onCapture={capture.onCapture}
                isCapturing={capture.isCapturing}
            />
            <TableCard ref={capture.ref}>
                <ScrollX minWidth={ladderMinWidth(ladder.ladder.length)}>
                    {/* The matrix is CSS grid rather than a <table> because the cells are flex
                        columns, so the row/column association has to be restored with roles —
                        without them a screen reader gets a flat run of numbers. */}
                    <div role="table" aria-label="Token spend per loop, by ladder rung">
                        <LadderHeader ladder={ladder.ladder} metric={view.metric} />
                        {ladder.rows.map((row, index) => (
                            <LadderBodyRow
                                key={row.loopNumber}
                                row={row}
                                ladder={ladder}
                                view={view}
                                rowIndex={index}
                            />
                        ))}
                        <LadderFooter ladder={ladder} view={view} />
                    </div>
                </ScrollX>
            </TableCard>
            <SummaryTiles summary={summary} hasOutcomeData={ladder.hasOutcomeData} />
        </div>
    );
};
