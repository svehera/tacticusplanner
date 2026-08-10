import { PortalDialog } from '@/fsd/5-shared/ui';
import { RarityIcon } from '@/fsd/5-shared/ui/icons';

import {
    CaptureButton,
    CardGrid,
    EncounterIcon,
    ReadinessTile,
    SectionHeader,
    TableCard,
} from '../guild-performance.components';
import { captureFileName, useSectionCapture } from '../guild-performance.hook';
import { ROW_ZEBRA } from '../guild-performance.styles';

import {
    cellTitle,
    compactNumber,
    formatMetricValue,
    metricDefinition,
    OUTCOME_WORD,
    primeEffectCaption,
    primeName,
    primeTitle,
    type BoardBar,
    type BoardBoss,
    type BoardSegments,
    type BossDetail,
    type BossLoopDetail,
    type BossLoopRow,
    type LoopBoard,
    type LoopMetric,
    type Outcome,
} from './loops-tab.utils';

// ---------------------------------------------------------------------------
// Outcome dots — three distinct shapes, so colour is never the only signal
// ---------------------------------------------------------------------------

/** 10px, not 7px: below that a 2px ring and a 1px dashed ring are the same smudge and only colour reads. */
const DOT_BASE = 'inline-flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full text-[8px] leading-none';

/** One class set per outcome. Shape carries the meaning; colour only reinforces it. */
const DOT_STATE: Record<Outcome, string> = {
    kill: 'bg-(--success) font-extrabold text-(--success-fg)',
    alive: 'border-2 border-(--warning)',
    skip: 'border border-dashed border-(--fg)/55',
};

/** `aria-hidden`: the enclosing cell's `aria-label` already states every outcome in words. */
export const Dot = ({ outcome, title }: { outcome: Outcome; title?: string }) => (
    <span className={`${DOT_BASE} ${DOT_STATE[outcome]}`} title={title} aria-hidden="true">
        {outcome === 'kill' ? '✓' : ''}
    </span>
);

/** Which of a boss's two optional side bosses a value belongs to. */
type PrimeSide = 'left' | 'right';

/** Single letter per side, so a value reads without consulting the legend. */
const PRIME_MARKER: Record<PrimeSide, string> = { left: 'L', right: 'R' };

/**
 * One prime's spend. Side is carried by two signals, since it is the thing a reader most needs to
 * tell apart: position (`justify-between` pins each prime to its own edge, mirroring the encounter)
 * and an explicit `L`/`R` marker, so a cell reads without consulting the legend.
 *
 * The internal order is deliberately *not* mirrored — pointing both halves outward puts the two
 * outcome dots side by side in the middle, where they are easy to misattribute.
 */
export const PrimeValue = ({
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

// ---------------------------------------------------------------------------
// Season cards — one card per boss, its loops stacked on a shared baseline
//
// A grid rather than one wide table: the trend a guild reads a season by is per boss, and only a
// shared left edge makes it a shape instead of a subtraction. The card template is static, so unlike
// the board it needs no inline geometry at all.
// ---------------------------------------------------------------------------

/** Hover text for one loop's bar: the whole encounter in words, whatever the switcher is showing. */
const barTitle = (bar: BoardBar, column: BossLoopRow, metric: LoopMetric, hasOutcomeData: boolean): string => {
    if (bar.cell === undefined || bar.value === undefined) return `Loop ${bar.loopNumber}: not reached`;
    if (metric !== 'tokens') {
        const label = metricDefinition(metric).label.toLowerCase();
        const outcome = bar.outcome === undefined ? '' : ` · boss ${OUTCOME_WORD[bar.outcome]}`;
        return `Loop ${bar.loopNumber}: ${formatMetricValue(bar.value, metric)} ${label}${outcome}`;
    }
    // The row's own detail line already carries most of this; the hover repeats it in words so the
    // whole encounter reads without decoding `L 4 R 6`.
    const { finalRemainingHp } = bar.cell.loop;
    const hp =
        hasOutcomeData && finalRemainingHp !== undefined && finalRemainingHp > 0
            ? ` · ${compactNumber(finalRemainingHp)} HP left`
            : '';
    return `Loop ${bar.loopNumber}: ${cellTitle(bar.cell, column, hasOutcomeData)}${hp}`;
};

/**
 * `--warning-accent` while the boss is still standing, `--fg/55` once it is dead.
 *
 * Neither is the handout's choice, and both are measurements rather than taste. The handout's
 * `--primary` was specified for an unsegmented cell bar where nothing else was blue; here the right
 * prime is `--chart-1`, which is `blue-700` — the value `--primary` itself takes in light mode — so
 * the two would render as one block. `--warning` (amber-400) avoids that but measures ~1.24:1
 * against the `--fg/12` track in light mode, under WCAG 1.4.11's 3:1 for a graphical object
 * carrying meaning. `--warning-accent` is amber-800 in light and amber-400 in dark: ~5.9:1 and
 * legible in both. `--fg/38` had the same problem at ~2.14:1; `--fg/55` measures ~3.1:1.
 *
 * It also puts the boss between two hues rather than beside a near-neighbour: violet, amber, blue
 * never touch a colour they can be confused with.
 */
const bossBarFill = (isStanding: boolean) => (isStanding ? 'bg-(--warning-accent)' : 'bg-(--fg)/55');

/** {@link bossBarFill} for a bar, reading the standing/dead state off its own outcome. */
const bossFill = (bar: BoardBar) => bossBarFill(bar.outcome === 'alive');

/**
 * The gauge's parts in encounter order — left prime, boss, right prime — with anything unspent
 * dropped. Ordering the boss between the two primes is what keeps violet and blue from ever
 * touching, and dropping empties is what stops a skipped prime leaving a stray divider.
 */
const drawnSegments = (segments: BoardSegments, bossClassName: string) =>
    [
        { key: 'left', width: segments.left, className: 'bg-(--chart-2)' },
        { key: 'boss', width: segments.boss, className: bossClassName },
        { key: 'right', width: segments.right, className: 'bg-(--chart-1)' },
    ].filter(segment => segment.width > 0);

/** The card header's accessible name: the season figure, the loops behind it, and what opening it does. */
const bossAriaLabel = (
    boss: BoardBoss,
    tier: string,
    bossName: string,
    metric: LoopMetric,
    hasOutcomeData: boolean
): string => {
    const value = `${formatMetricValue(boss.seasonValue, metric)} ${metricDefinition(metric).label.toLowerCase()}`;
    const loops = `over ${boss.reached} ${boss.reached === 1 ? 'loop' : 'loops'}`;
    const kills = hasOutcomeData ? `, ${boss.kills} killed` : '';
    return `${tier} ${bossName} — ${value} ${loops}${kills}. Open the full breakdown.`;
};

/**
 * The card's season figures in one string, for the header's hover. The footer prints them too; this
 * is so the header — the click target — says what opening it would tell you.
 */
const bossSummary = (
    boss: BoardBoss,
    tier: string,
    bossName: string,
    metric: LoopMetric,
    hasOutcomeData: boolean
): string => {
    const parts = [`${formatMetricValue(boss.seasonValue, metric)} ${metricDefinition(metric).label.toLowerCase()}`];
    if (boss.rangeLabel !== '') parts.push(boss.rangeLabel);
    if (metric === 'tokens') parts.push(`L ${boss.leftTotal} · R ${boss.rightTotal}`);
    if (hasOutcomeData) parts.push(`${boss.kills} of ${boss.reached} killed`);
    return `${tier} ${bossName} — ${parts.join(' · ')}`;
};

/**
 * Split left prime / boss / right prime, the shape the old per-boss card had.
 *
 * The handout rejects that split *inside a matrix cell*, and its reasoning is a measurement: at the
 * ~40px a cell allows, each segment lands at 8–20px, and a prime capped at 9 tokens against a boss
 * ceiling of 47 is an invisible sliver every time. A card's bar runs the card's full width, so the
 * objection does not carry across — the split is legible here in a way it never was in a cell.
 *
 * Only Tokens splits. Efficiency, Players and Bombs are per-encounter figures with no left/right
 * component, so segmenting them would draw one number three times.
 */
const BarFill = ({
    percent,
    segments,
    bossClassName,
    split,
}: {
    percent: number;
    segments: BoardSegments | undefined;
    bossClassName: string;
    split: boolean;
}) => (
    // Square, not `rounded-sm`: at 10px tall the radius is most of the bar, and a rounded gauge reads
    // as a pill rather than an instrument. SNIPPETS § Bars for the track — `--fg/12`, never
    // `--neutral`, which equals the card surface in dark mode.
    <span className="h-2.5 w-full overflow-hidden bg-(--fg)/12">
        <span className="flex h-full transition-all duration-200" style={{ width: `${percent}%` }}>
            {split && segments !== undefined ? (
                // Only the parts actually spent, so a skipped prime contributes no segment — and the
                // divider goes on the *leading* edge of every segment after the first, so a zero-width
                // part can never leave a stray 1px line at either end.
                drawnSegments(segments, bossClassName).map((segment, index) => (
                    <span
                        key={segment.key}
                        className={`h-full ${segment.className} ${index === 0 ? '' : 'border-l border-(--card)'}`}
                        style={{ width: `${segment.width}%` }}
                    />
                ))
            ) : (
                <span className={`h-full w-full ${bossClassName}`} />
            )}
        </span>
    </span>
);

/**
 * One loop: a bar line, then a detail line.
 *
 * Every bar shares one baseline and they stack in loop order, which is what makes a trend a *shape*.
 * Give each loop its own track and its own left edge instead — as a wide matrix must — and telling
 * loop 1 from loop 6 means reading the two numbers and subtracting.
 *
 * Two lines rather than one because a five-up card is ~317px, which fits a bar and its figure and
 * nothing else. The second line is what a one-line row had to push into the dialog: the outcome, both
 * primes, remaining HP, bombs and members. Bars stay evenly spaced, so the staircase reads the same —
 * with more room per bar, not less.
 */
const CardLoopRow = ({
    bar,
    column,
    metric,
    hasOutcomeData,
}: {
    bar: BoardBar;
    column: BossLoopRow;
    metric: LoopMetric;
    hasOutcomeData: boolean;
}) => {
    const { cell } = bar;
    // A fact the bar already encodes must not be repeated beneath it — `12 bombs` under a bomb bar
    // reads as two different numbers until you check. Primes are token counts whatever the switcher
    // says, so under any other metric they would be mistaken for that metric's value.
    const showPrimes = metric === 'tokens';
    const showBombs = metric !== 'bombs' && hasOutcomeData && (cell?.loop.bombs ?? 0) > 0;
    const showPlayers = metric !== 'players' && hasOutcomeData && (cell?.loop.players ?? 0) > 0;
    const showHp =
        hasOutcomeData && cell !== undefined && cell.boss !== 'kill' && cell.loop.finalRemainingHp !== undefined;
    // Past seasons carry no outcome data at all, so under a non-token metric there is nothing to put
    // on the second line. Collapsing it then is safe: every row in the card collapses together, so the
    // bars stay evenly spaced and the staircase is unaffected.
    const hasDetail =
        cell === undefined ||
        (hasOutcomeData && metric === 'tokens') ||
        showPrimes ||
        showBombs ||
        showPlayers ||
        showHp;

    return (
        <div className={`px-3 py-1.5 ${ROW_ZEBRA}`} title={barTitle(bar, column, metric, hasOutcomeData)}>
            <div className="grid grid-cols-[20px_minmax(0,1fr)_34px] items-center gap-2">
                {/* The running loop is marked on its own number — a filled chip, since a 20px track
                    has no room to spell out a `Now` badge. */}
                <span
                    className={`text-center text-[11px] font-bold tabular-nums ${
                        bar.isRunning ? 'rounded bg-(--primary) text-(--primary-fg)' : 'text-(--soft-fg)'
                    }`}>
                    {bar.loopNumber}
                </span>
                <BarFill
                    percent={bar.percent}
                    segments={bar.segments}
                    bossClassName={bossFill(bar)}
                    split={metric === 'tokens'}
                />
                <span
                    className={`text-right text-xs font-bold tabular-nums ${
                        bar.value === undefined ? 'text-(--soft-fg) opacity-45' : 'text-(--fg)'
                    }`}>
                    {bar.value === undefined ? '·' : formatMetricValue(bar.value, metric)}
                </span>
            </div>
            {/* Indented to the bar's own track, so the detail reads as belonging to the bar above it
                rather than as a row of its own. A loop that never got this far still gets a line, so
                a gap in the staircase stays visible instead of closing up. */}
            {hasDetail && (
                <div className="mt-0.5 ml-[28px] flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-(--soft-fg)">
                    {cell === undefined ? (
                        <span>not reached</span>
                    ) : (
                        <>
                            {/* Kill is implied by having reached this boss; only "still alive" is news. */}
                            {hasOutcomeData && cell.boss === 'alive' && (
                                <Dot outcome={cell.boss} title={`Boss ${OUTCOME_WORD[cell.boss]}`} />
                            )}
                            {showPrimes && (
                                <>
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
                                        title={primeTitle(
                                            column.rightPrimeUnitId,
                                            'right',
                                            cell.right,
                                            cell.loop.right
                                        )}
                                        hasOutcomeData={hasOutcomeData}
                                    />
                                </>
                            )}
                            {showHp && (
                                <span className="text-(--warning) tabular-nums">
                                    {compactNumber(cell.loop.finalRemainingHp!)} HP left
                                </span>
                            )}
                            {showBombs && (
                                <span className="tabular-nums">
                                    {cell.loop.bombs} bomb{cell.loop.bombs === 1 ? '' : 's'}
                                </span>
                            )}
                            {/* Spelled out, and worded exactly as the dialog does — an abbreviation
                                here saves ~20px and costs the reader a guess. */}
                            {showPlayers && (
                                <span className="tabular-nums">
                                    {cell.loop.players} member{cell.loop.players === 1 ? '' : 's'}
                                </span>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

/** One boss: a clickable header, a bar per loop on a shared baseline, and the season figures. */
const BossCard = ({
    boss,
    column,
    tier,
    bossName,
    metric,
    hasOutcomeData,
    onOpen,
}: {
    boss: BoardBoss;
    column: BossLoopRow;
    tier: string;
    bossName: string;
    metric: LoopMetric;
    hasOutcomeData: boolean;
    onOpen: () => void;
}) => (
    // `flex flex-col`: with the grid stretching every card in a row to the same height, the extra
    // room has to go somewhere. It goes to the loop list (`flex-1`) rather than the header or
    // footer, so those two sit at the same height on every card and only the list — already the
    // part that varies bar to bar — absorbs the difference.
    <TableCard className="flex flex-col">
        {/* The header is the control, not the whole card: the rows below hold selectable numbers, and
            a click target wrapping them would fight text selection on every drag. */}
        <button
            type="button"
            aria-haspopup="dialog"
            aria-label={bossAriaLabel(boss, tier, bossName, metric, hasOutcomeData)}
            title={bossSummary(boss, tier, bossName, metric, hasOutcomeData)}
            onClick={onOpen}
            className="flex w-full cursor-pointer items-center gap-2 border-b border-(--border) bg-(--soft) px-3 py-2 text-left hover:bg-(--primary)/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--ring)">
            <EncounterIcon unitId={column.bossUnitId} size={20} />
            <span className="text-xs font-extrabold text-(--fg) tabular-nums">{tier}</span>
            <span className="min-w-0 truncate text-xs text-(--fg)">{bossName}</span>
            {column.bossMaxHp > 0 && (
                <span className="shrink-0 text-[10px] text-(--soft-fg) tabular-nums">
                    {compactNumber(column.bossMaxHp)}
                </span>
            )}
            <span className="ml-auto shrink-0 text-sm font-extrabold text-(--fg) tabular-nums">
                {formatMetricValue(boss.seasonValue, metric)}
            </span>
        </button>
        <div className="flex-1 py-1">
            {boss.bars.map(bar => (
                <CardLoopRow
                    key={bar.loopNumber}
                    bar={bar}
                    column={column}
                    metric={metric}
                    hasOutcomeData={hasOutcomeData}
                />
            ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-(--hairline) px-3 py-1.5 text-[11px] text-(--soft-fg)">
            {boss.rangeLabel !== '' && <span className="tabular-nums">{boss.rangeLabel}</span>}
            {metric === 'tokens' && (
                <span className="tabular-nums">
                    L {boss.leftTotal} · R {boss.rightTotal}
                </span>
            )}
        </div>
        {boss.primeEffect !== undefined && (
            <div className="border-t border-(--hairline) px-3 py-1 text-[11px] text-(--soft-fg)">
                {primeEffectCaption(boss.primeEffect)}
            </div>
        )}
    </TableCard>
);

/** The tab's main view — every boss as a small multiple, so trends read side by side. */
export const SeasonCards = ({
    board,
    ladder,
    metric,
    hasOutcomeData,
    tierOf,
    bossNameOf,
    onOpenBoss,
}: {
    board: LoopBoard;
    /** Column axis, so a card can name its own boss — `BoardBoss` carries only the index. */
    ladder: BossLoopRow[];
    metric: LoopMetric;
    hasOutcomeData: boolean;
    tierOf: (row: BossLoopRow) => string;
    bossNameOf: (row: BossLoopRow) => string;
    /** Column index of the boss to open in the detail dialog. */
    onOpenBoss: (columnIndex: number) => void;
}) => {
    const capture = useSectionCapture<HTMLDivElement>(captureFileName('guild-loops-board'));

    return (
        <section className="flex flex-col gap-2">
            <SectionHeader
                title="Season at a glance"
                note="One bar per loop, oldest first. Select a boss for the full breakdown."
                meta={<CaptureButton onCapture={capture.onCapture} isCapturing={capture.isCapturing} />}
            />
            {/* 300px floor, not 430. A boss ladder is five rungs, and five is the count an auto-fit
                grid handles worst: only one or five columns divide it without leaving a hole, and a
                430px floor gives three columns at 1920 — so row two held two cards and a 536px gap.
                At 300 the same screen fits all five on one row in either sidebar state, and a phone
                still collapses to one column via the `min(…,100%)`. Cards stay equal width at every
                size, which the All-bosses scale needs: same value, same bar length, any card. */}
            <CardGrid ref={capture.ref} min={300} align="stretch">
                {board.bosses.map(boss => (
                    <BossCard
                        key={boss.columnIndex}
                        boss={boss}
                        column={ladder[boss.columnIndex]}
                        tier={tierOf(ladder[boss.columnIndex])}
                        bossName={bossNameOf(ladder[boss.columnIndex])}
                        metric={metric}
                        hasOutcomeData={hasOutcomeData}
                        onOpen={() => onOpenBoss(boss.columnIndex)}
                    />
                ))}
            </CardGrid>
        </section>
    );
};

// ---------------------------------------------------------------------------
// Boss dialog — one ladder column, in full
// ---------------------------------------------------------------------------

/** The loop's number in the dialog, chipped and badged while that loop is still running. */
const LoopBadge = ({ loop }: { loop: BossLoopDetail }) => (
    <span className="flex flex-col items-center gap-1">
        <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-extrabold ${
                loop.isRunning ? 'bg-(--primary) text-(--primary-fg)' : 'bg-(--success)/20 text-(--success)'
            }`}>
            {loop.loopNumber}
        </span>
        {loop.isRunning && (
            <span className="rounded-full bg-(--primary) px-1.5 text-[10px] font-extrabold tracking-[.14em] text-(--primary-fg) uppercase">
                Now
            </span>
        )}
    </span>
);

/** One loop of the open boss, in full: boss spend and bar, both primes, HP, bombs, members, efficiency. */
const LoopDetailRow = ({ loop, detail }: { loop: BossLoopDetail; detail: BossDetail }) => {
    const { cell } = loop;
    const { column, hasOutcomeData } = detail;

    return (
        <div className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-3 border-b border-(--hairline) py-2 last:border-b-0">
            <LoopBadge loop={loop} />
            {cell === undefined ? (
                <span className="text-xs text-(--soft-fg)">Not reached in this loop</span>
            ) : (
                <span className="flex min-w-0 flex-col gap-1.5">
                    <span className="flex items-center gap-2.5">
                        <span className="w-8 text-right text-lg font-extrabold text-(--fg) tabular-nums">
                            {cell.loop.boss}
                        </span>
                        <span className="h-3 flex-1 overflow-hidden rounded-sm bg-(--fg)/12">
                            <span
                                className={`block h-full ${bossBarFill(hasOutcomeData && cell.boss === 'alive')}`}
                                style={{ width: `${loop.percent}%` }}
                            />
                        </span>
                        {/* Kill implied, never shown — see the matching card-row comment above. */}
                        {hasOutcomeData && cell.boss === 'alive' && (
                            <Dot outcome={cell.boss} title={`Boss ${OUTCOME_WORD[cell.boss]}`} />
                        )}
                        {loop.paceLabel !== '' && (
                            <span className="shrink-0 text-xs text-(--soft-fg)">{loop.paceLabel}</span>
                        )}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
                        <span aria-hidden="true" className="h-3 w-px bg-(--border)" />
                        <span className="text-xs text-(--soft-fg) tabular-nums">{cell.loop.total} tokens</span>
                        {/* Everything below needs per-hit data, which a past season's aggregate
                            doesn't carry — showing a zero would assert something it cannot support. */}
                        {hasOutcomeData && cell.loop.finalRemainingHp !== undefined && cell.boss !== 'kill' && (
                            <span className="text-xs text-(--warning) tabular-nums">
                                {compactNumber(cell.loop.finalRemainingHp)} HP left
                            </span>
                        )}
                        {hasOutcomeData && cell.loop.bombs > 0 && (
                            <span className="text-xs text-(--soft-fg) tabular-nums">
                                {cell.loop.bombs} bomb{cell.loop.bombs === 1 ? '' : 's'}
                            </span>
                        )}
                        {hasOutcomeData && cell.loop.players > 0 && (
                            <span className="text-xs text-(--soft-fg) tabular-nums">
                                {cell.loop.players} member{cell.loop.players === 1 ? '' : 's'}
                            </span>
                        )}
                        {loop.efficiency !== undefined && (
                            <span className="text-xs text-(--soft-fg) tabular-nums">
                                {loop.efficiency.toFixed(1)} tok/10M
                            </span>
                        )}
                    </span>
                </span>
            )}
        </div>
    );
};

/** One ladder column in full, always framed in tokens — see the section note above {@link BossDetail}. */
export const BossDialog = ({
    detail,
    tier,
    bossName,
    onClose,
}: {
    detail: BossDetail;
    tier: string;
    bossName: string;
    onClose: () => void;
}) => {
    const { column, hasOutcomeData } = detail;

    return (
        <PortalDialog open onClose={onClose} aria-label={`${tier} — ${bossName}`} size="2xl">
            <PortalDialog.Header className="p-4">
                {/* Same [left prime] [BOSS] [right prime] arrangement as the matrix column header. */}
                <span className="flex items-end gap-1">
                    <EncounterIcon
                        unitId={column.leftPrimeUnitId}
                        size={20}
                        tooltip={`${primeName(column.leftPrimeUnitId, 'left')} — left prime (optional)`}
                    />
                    <EncounterIcon unitId={column.bossUnitId} size={34} />
                    <EncounterIcon
                        unitId={column.rightPrimeUnitId}
                        size={20}
                        tooltip={`${primeName(column.rightPrimeUnitId, 'right')} — right prime (optional)`}
                    />
                </span>
                <span className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-1.5">
                        <RarityIcon rarity={column.rarity} />
                        <span className="truncate text-base font-extrabold text-(--fg)">
                            {tier} — {bossName}
                        </span>
                    </span>
                    <span className="text-xs font-normal text-(--soft-fg)">
                        {column.bossMaxHp > 0 && `${column.bossMaxHp.toLocaleString()} HP · `}
                        {primeName(column.leftPrimeUnitId, 'left')} / {primeName(column.rightPrimeUnitId, 'right')}
                    </span>
                </span>
            </PortalDialog.Header>
            <PortalDialog.Body className="gap-3 pb-4 sm:pb-6">
                <div>
                    {detail.loops.map(loop => (
                        <LoopDetailRow key={loop.loopNumber} loop={loop} detail={detail} />
                    ))}
                </div>
                <CardGrid min={148} gap="gap-2.5">
                    <ReadinessTile
                        label="Season tokens"
                        value={String(detail.total)}
                        caption={detail.rangeLabel === '' ? undefined : detail.rangeLabel}
                    />
                    <ReadinessTile
                        label="Boss vs primes"
                        value={String(detail.bossTotal)}
                        caption={`${detail.leftTotal} left · ${detail.rightTotal} right`}
                    />
                    {hasOutcomeData && (
                        <ReadinessTile
                            label="Killed"
                            value={`${detail.kills} / ${detail.reached}`}
                            valueClass={detail.kills === detail.reached ? 'text-(--success)' : 'text-(--warning)'}
                            caption={
                                detail.bombs > 0 || detail.peakPlayers > 0
                                    ? `${detail.bombs} bombs · up to ${detail.peakPlayers} members a loop`
                                    : undefined
                            }
                        />
                    )}
                    {detail.efficiencyMean !== undefined && (
                        <ReadinessTile
                            label="Efficiency"
                            value={detail.efficiencyMean.toFixed(1)}
                            caption="Mean tokens per 10M of boss HP"
                        />
                    )}
                </CardGrid>
                {!hasOutcomeData && (
                    <p className="text-xs text-(--soft-fg)">
                        Kill and prime outcomes aren&apos;t stored for past seasons — token counts only.
                    </p>
                )}
                {detail.primeEffect !== undefined && (
                    <p className="text-xs text-(--soft-fg)">{primeEffectCaption(detail.primeEffect)}</p>
                )}
            </PortalDialog.Body>
        </PortalDialog>
    );
};
