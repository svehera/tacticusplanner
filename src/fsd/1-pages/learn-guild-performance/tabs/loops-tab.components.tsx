import { PortalDialog } from '@/fsd/5-shared/ui';
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
import { ROW_ZEBRA } from '../guild-performance.styles';

import {
    cellTitle,
    compactNumber,
    formatMetricValue,
    metricDefinition,
    OUTCOME_WORD,
    primeName,
    primeTitle,
    seasonLabel,
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
// Season board
//
// Geometry is an inline style for the same reason the matrix's is: the loop count is a runtime value
// and Tailwind's JIT cannot generate `grid-cols-[184px_repeat(5,...)_104px]`. Geometry inline is
// fine; colour never is.
// ---------------------------------------------------------------------------

const BOARD_LEAD = 176;
/** Wide enough that a three-segment gauge still separates at the board's narrowest. */
const BAR_MIN = 56;
const BOARD_TRAIL = 96;

const boardTemplate = (loops: number) => `${BOARD_LEAD}px repeat(${loops}, minmax(${BAR_MIN}px, 1fr)) ${BOARD_TRAIL}px`;

const boardMinWidth = (loops: number) => BOARD_LEAD + loops * BAR_MIN + BOARD_TRAIL;

const gridRule = 'border-l border-(--hairline)';
const microHeader = 'px-2.5 py-1.5 text-xs font-bold tracking-widest text-(--soft-fg) uppercase';

const barTitle = (bar: BoardBar, column: BossLoopRow, metric: LoopMetric, hasOutcomeData: boolean): string => {
    if (bar.cell === undefined || bar.value === undefined) return `Loop ${bar.loopNumber}: not reached`;
    if (metric !== 'tokens') {
        const label = metricDefinition(metric).label.toLowerCase();
        const outcome = bar.outcome === undefined ? '' : ` · boss ${OUTCOME_WORD[bar.outcome]}`;
        return `Loop ${bar.loopNumber}: ${formatMetricValue(bar.value, metric)} ${label}${outcome}`;
    }
    // The old card printed remaining HP beside every loop. It stays off the row — a number per bar is
    // exactly the scanning the board exists to remove — but it belongs on the hover.
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
 * Holds what the row no longer prints: the range, the prime totals and the kill count. The dialog
 * shows all three properly; this is so a desktop reader doesn't have to open it for a passing look.
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
 * ceiling of 47 is an invisible sliver every time. A board track is several times a cell's width, so
 * the objection does not carry across — the split is legible here in a way it never was in a cell.
 *
 * Only Tokens splits. Efficiency, Players and Bombs are per-encounter figures with no left/right
 * component, so segmenting them would draw one number three times.
 */
const BoardBarCell = ({
    bar,
    column,
    metric,
    hasOutcomeData,
}: {
    bar: BoardBar;
    column: BossLoopRow;
    metric: LoopMetric;
    hasOutcomeData: boolean;
}) => (
    // Twin rail: the reading sits above its gauge, both on the same track. Printing the figure means
    // a value no longer depends on a hover, which is the only way it was reachable on a phone.
    <span
        className={`flex flex-col justify-center gap-1 px-1.5 py-1.5 ${gridRule}`}
        title={barTitle(bar, column, metric, hasOutcomeData)}>
        <span
            className={`text-center text-xs font-bold tabular-nums ${
                bar.value === undefined ? 'text-(--soft-fg) opacity-45' : 'text-(--fg)'
            }`}>
            {bar.value === undefined ? '·' : formatMetricValue(bar.value, metric)}
        </span>
        {/* Square, not `rounded-sm`: at 10px tall the radius is most of the bar, and a rounded gauge
            reads as a pill rather than an instrument. SNIPPETS § Bars for the track — `--fg/12`,
            never `--neutral`, which equals the card surface in dark mode. */}
        <span className="h-2.5 w-full overflow-hidden bg-(--fg)/12">
            {/* Two levels, as the old card had: the outer width is this loop's share of the boss's
                busiest loop, and the segments inside are what that spend was made of. The only change
                is that the outer scale is per boss rather than board-wide. */}
            <span className="flex h-full transition-all duration-200" style={{ width: `${bar.percent}%` }}>
                {metric === 'tokens' && bar.segments !== undefined ? (
                    // Only the parts that were actually spent, so a skipped prime contributes no
                    // segment — and the divider goes on the *leading* edge of every segment after the
                    // first, so a zero-width part can never leave a stray 1px line at either end.
                    drawnSegments(bar.segments, bossFill(bar)).map((segment, index) => (
                        <span
                            key={segment.key}
                            className={`h-full ${segment.className} ${index === 0 ? '' : 'border-l border-(--card)'}`}
                            style={{ width: `${segment.width}%` }}
                        />
                    ))
                ) : (
                    <span className={`h-full w-full ${bossFill(bar)}`} />
                )}
            </span>
        </span>
    </span>
);

const BoardRow = ({
    boss,
    column,
    tier,
    bossName,
    loops,
    metric,
    hasOutcomeData,
    onOpen,
}: {
    boss: BoardBoss;
    column: BossLoopRow;
    tier: string;
    bossName: string;
    loops: number;
    metric: LoopMetric;
    hasOutcomeData: boolean;
    onOpen: () => void;
}) => (
    // A real button, so Tab reaches it and Enter/Space opens it without re-implementing either. It is
    // also the grid, which keeps every cell on the same tracks as the header above.
    <button
        type="button"
        aria-haspopup="dialog"
        aria-label={bossAriaLabel(boss, tier, bossName, metric, hasOutcomeData)}
        title={bossSummary(boss, tier, bossName, metric, hasOutcomeData)}
        onClick={onOpen}
        style={{ gridTemplateColumns: boardTemplate(loops) }}
        // `min-h-11` is the 44px touch minimum: the row is the only way into the breakdown on a
        // phone. Zebra rather than per-row hairlines, matching `ROW_ZEBRA` — on a table wide enough
        // to scroll, a stripe tracks a boss across the scroll where a border cannot.
        className={`grid min-h-11 w-full cursor-pointer items-stretch text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--ring) ${ROW_ZEBRA}`}>
        {/* One line. The chevron is gone — the whole row is the target, so it was decoration — and so
            is the rarity icon, which only restated the `L`/`M` the tier code already carries. */}
        <span className="flex items-center gap-2 px-2.5 py-1.5">
            <EncounterIcon unitId={column.bossUnitId} size={20} />
            <span className="text-xs font-extrabold text-(--fg) tabular-nums">{tier}</span>
            <span className="min-w-0 truncate text-xs text-(--fg)">{bossName}</span>
            {column.bossMaxHp > 0 && (
                <span className="ml-auto shrink-0 text-[10px] text-(--soft-fg) tabular-nums">
                    {compactNumber(column.bossMaxHp)}
                </span>
            )}
        </span>
        {boss.bars.map(bar => (
            <BoardBarCell
                key={bar.loopNumber}
                bar={bar}
                column={column}
                metric={metric}
                hasOutcomeData={hasOutcomeData}
            />
        ))}
        {/* One figure. The range label, the L/R totals and the kill count all moved to this row's
            `title` and the dialog — with the per-loop figures and gauges both on screen, "flat at 42"
            is something you can see rather than something that needs saying. */}
        <span className={`flex items-center justify-end px-2.5 py-1.5 ${gridRule}`}>
            <span className="text-sm font-extrabold text-(--fg) tabular-nums">
                {formatMetricValue(boss.seasonValue, metric)}
            </span>
        </span>
    </button>
);

export const SeasonBoard = ({
    board,
    ladder,
    metric,
    hasOutcomeData,
    tierOf,
    bossNameOf,
    onOpenBoss,
}: {
    board: LoopBoard;
    /** Column axis, so a boss can name its own boss — `BoardBoss` carries only the index. */
    ladder: BossLoopRow[];
    metric: LoopMetric;
    hasOutcomeData: boolean;
    tierOf: (row: BossLoopRow) => string;
    bossNameOf: (row: BossLoopRow) => string;
    /** Column index of the boss to open in the detail dialog. */
    onOpenBoss: (columnIndex: number) => void;
}) => {
    const capture = useSectionCapture(captureFileName('guild-loops-board'));
    const loops = board.loops.length;

    return (
        <section className="flex flex-col gap-2">
            <SectionHeader
                title="Season at a glance"
                note="One bar per loop. Select a boss for the full breakdown."
                meta={<CaptureButton onCapture={capture.onCapture} isCapturing={capture.isCapturing} />}
            />
            <TableCard ref={capture.ref}>
                <ScrollX minWidth={boardMinWidth(loops)}>
                    <div
                        style={{ gridTemplateColumns: boardTemplate(loops) }}
                        className="grid border-b border-(--border) bg-(--soft)">
                        {/* `self-end` throughout: the season label wraps to two lines in its column,
                            and without it the loop numbers would float against the top of a taller
                            row instead of sitting on one baseline with the labels. */}
                        <span className={`${microHeader} self-end`}>Boss</span>
                        {board.loops.map(loop => (
                            <span
                                key={loop.loopNumber}
                                className={`flex flex-col items-center gap-0.5 self-end px-1 py-1.5 ${gridRule}`}>
                                {/* The running loop is marked on its own number — a filled chip where
                                    the matrix spelled out a `Now` badge it had the width for. */}
                                <span
                                    className={`text-xs font-bold tabular-nums ${
                                        loop.isRunning
                                            ? 'rounded bg-(--primary) px-1.5 text-(--primary-fg)'
                                            : 'text-(--soft-fg)'
                                    }`}>
                                    {loop.loopNumber}
                                </span>
                                {loop.paceLabel !== '' && (
                                    <span className="text-[10px] text-(--soft-fg) tabular-nums">{loop.paceLabel}</span>
                                )}
                            </span>
                        ))}
                        {/* A season roll-up per boss, not a per-loop value, so it takes the season
                            wording rather than the `Loop …` heading the footer uses. */}
                        <span className={`${microHeader} ${gridRule} self-end text-right`}>{seasonLabel(metric)}</span>
                    </div>
                    {board.bosses.map(boss => (
                        <BoardRow
                            key={boss.columnIndex}
                            boss={boss}
                            column={ladder[boss.columnIndex]}
                            tier={tierOf(ladder[boss.columnIndex])}
                            bossName={bossNameOf(ladder[boss.columnIndex])}
                            loops={loops}
                            metric={metric}
                            hasOutcomeData={hasOutcomeData}
                            onOpen={() => onOpenBoss(boss.columnIndex)}
                        />
                    ))}
                    {/* The loop axis's own summary. Without it the board answers "how did this boss
                        go" but nothing answers "what did this loop cost", which is the question the
                        loop number at the top of each column implies. */}
                    <div
                        style={{ gridTemplateColumns: boardTemplate(loops) }}
                        className="grid items-center border-t border-(--border) bg-(--soft)">
                        <span className={microHeader}>{metricDefinition(metric).totalLabel}</span>
                        {board.loops.map(loop => (
                            <span
                                key={loop.loopNumber}
                                className={`px-1 py-1.5 text-center text-xs font-extrabold text-(--fg) tabular-nums ${gridRule}`}>
                                {formatMetricValue(loop.value, metric)}
                            </span>
                        ))}
                        <span
                            className={`px-2.5 py-1.5 text-right text-sm font-extrabold text-(--fg) tabular-nums ${gridRule}`}>
                            {formatMetricValue(board.grandValue, metric)}
                        </span>
                    </div>
                </ScrollX>
            </TableCard>
        </section>
    );
};

// ---------------------------------------------------------------------------
// Boss dialog — one ladder column, in full
// ---------------------------------------------------------------------------

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
                        {hasOutcomeData && <Dot outcome={cell.boss} title={`Boss ${OUTCOME_WORD[cell.boss]}`} />}
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
            </PortalDialog.Body>
        </PortalDialog>
    );
};
