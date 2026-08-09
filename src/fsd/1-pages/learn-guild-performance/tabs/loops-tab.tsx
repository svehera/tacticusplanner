/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useMemo, useState, type ReactNode } from 'react';

import { type GuildSeasonHistoryResponse, type TacticusGuildRaidResponse } from '@/fsd/5-shared/lib/tacticus-api';
import { Segmented } from '@/fsd/5-shared/ui';

import { CaptureButton, CardGrid, ReadinessTile, SectionHeader } from '../guild-performance.components';
import { captureFileName, useSectionCapture } from '../guild-performance.hook';
import { tierLabel, unitDisplayLabel } from '../guild-performance.utils';

import { BossDialog, Dot, SeasonCards } from './loops-tab.components';
import {
    buildBossDetail,
    buildBossLoopRows,
    buildBossLoopRowsFromSummary,
    buildLoopBoard,
    buildLoopLadder,
    buildLoopSummary,
    buildMetricView,
    LOOP_METRICS,
    metricDefinition,
    resolveLadderPrimes,
    type BarScale,
    type BossLoopRow,
    type LoopMetric,
    type LoopSummary,
} from './loops-tab.utils';

const tierOf = (row: BossLoopRow) => tierLabel(row.rarity, row.set);
const bossNameOf = (row: BossLoopRow) => unitDisplayLabel(row.bossUnitId);

// ---------------------------------------------------------------------------
// Legend — one bar holding the metric switcher and the colour key
// ---------------------------------------------------------------------------

const LegendItem = ({ swatch, children }: { swatch: ReactNode; children: ReactNode }) => (
    <span className="flex items-center gap-1.5 text-xs text-(--soft-fg)">
        {swatch}
        {children}
    </span>
);

/**
 * Swatches rather than the handout's coloured wording: it specified words-in-their-own-colour because
 * nothing in the cell was a colour patch, only numerals. The board's bar segments are patches, so a
 * patch is what the key has to show.
 */
const BarSwatch = ({ className }: { className: string }) => (
    <span aria-hidden="true" className={`inline-block h-3 w-3 rounded-sm ${className}`} />
);

/**
 * Both labels name a scope, and both complete the "Bar scale" label into a phrase — "Bar scale: all
 * bosses", "Bar scale: per boss". The default sits first.
 *
 * Not "This boss": nothing is selected in a grid of cards, so "this" points at nothing. Not
 * "relative"/"absolute" either — that is the right distinction in the wrong vocabulary, and would
 * send the reader to the explanation before the control meant anything.
 */
const SCALE_OPTIONS: { value: BarScale; label: string }[] = [
    { value: 'board', label: 'All bosses' },
    { value: 'boss', label: 'Per boss' },
];

const SCALE_EXPLANATION: Record<BarScale, string> = {
    boss: 'Each card against its own busiest loop — shows whether that boss is getting cheaper.',
    board: 'Every bar against the busiest loop anywhere — lengths compare between cards.',
};

const Legend = ({
    metric,
    onMetric,
    available,
    hasOutcomeData,
    scale,
    onScale,
}: {
    metric: LoopMetric;
    onMetric: (next: LoopMetric) => void;
    available: typeof LOOP_METRICS;
    hasOutcomeData: boolean;
    scale: BarScale;
    onScale: (next: BarScale) => void;
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
                {/* No capture button: the board and the tiles each carry their own, over the section
                    they actually export. */}
            </div>
            <div className="flex flex-wrap items-center gap-4 px-4 py-2">
                {/* Sits with the bars rather than with the metric: it changes what a bar's *length*
                    means, which is a different question from what the number counts. */}
                <span className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-[.14em] text-(--soft-fg) uppercase">Bar scale</span>
                    <Segmented options={SCALE_OPTIONS} value={scale} onChange={onScale} />
                </span>
                <span className="text-xs text-(--soft-fg)">{SCALE_EXPLANATION[scale]}</span>
                {/* Keys the board's split bar. Tokens only — the other three metrics draw one solid
                    fill, so naming prime colours under them would key something not on screen. */}
                {metric === 'tokens' && (
                    <>
                        <span className="h-4 w-px bg-(--border)" />
                        <LegendItem swatch={<BarSwatch className="bg-(--chart-2)" />}>Left prime</LegendItem>
                        <LegendItem swatch={<BarSwatch className="bg-(--fg)/55" />}>Boss</LegendItem>
                        <LegendItem swatch={<BarSwatch className="bg-(--chart-1)" />}>Right prime</LegendItem>
                    </>
                )}
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
// Summary tiles — fixed, not driven by the metric switcher. They are the season verdict.
// ---------------------------------------------------------------------------

/** A boss skipped on every single loop is a standing habit worth naming, not a one-off. */
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
                        label="Least efficient boss"
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
    /** All bosses by default: one scale is the only setting where a bar length means the same thing
     *  in every card, so the grid reads as one chart rather than as several unrelated ones. Switch to
     *  per boss to give a cheap boss's own trend the full width of its card. */
    const [scale, setScale] = useState<BarScale>('board');
    /** Ladder column index of the boss shown in the detail dialog. */
    const [openBoss, setOpenBoss] = useState<number>();

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
    const board = useMemo(() => buildLoopBoard(ladder, view, scale), [ladder, view, scale]);

    // Bounds-checked rather than cleared on season change: switching season swaps the ladder under a
    // held index, and an out-of-range one would otherwise open a dialog on a boss that isn't there.
    const bossDetail = useMemo(
        () =>
            openBoss === undefined || openBoss >= ladder.ladder.length ? undefined : buildBossDetail(ladder, openBoss),
        [ladder, openBoss]
    );

    if (currentData === undefined && seasonHistory === undefined) {
        return <p className="text-sm text-(--soft-fg)">Loading…</p>;
    }

    if (rows.length === 0) {
        return (
            <div className="flex flex-col gap-3.5">
                {/* Same title the populated board carries, so the empty state reads as this screen
                    with nothing in it rather than as a different feature. */}
                <SectionHeader title="Season at a glance" />
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
                scale={scale}
                onScale={setScale}
            />
            {/* One card per boss, its loops stacked on a shared baseline so a season's trend is a
                shape rather than numbers to subtract. A boss's full breakdown — prime outcomes,
                remaining HP, bombs, members — lives in the dialog its header opens. */}
            <SeasonCards
                board={board}
                ladder={ladder.ladder}
                metric={view.metric}
                hasOutcomeData={ladder.hasOutcomeData}
                tierOf={tierOf}
                bossNameOf={bossNameOf}
                onOpenBoss={setOpenBoss}
            />
            <SummaryTiles summary={summary} hasOutcomeData={ladder.hasOutcomeData} />
            {bossDetail !== undefined && (
                <BossDialog
                    detail={bossDetail}
                    tier={tierOf(bossDetail.column)}
                    bossName={bossNameOf(bossDetail.column)}
                    onClose={() => setOpenBoss(undefined)}
                />
            )}
        </div>
    );
};
