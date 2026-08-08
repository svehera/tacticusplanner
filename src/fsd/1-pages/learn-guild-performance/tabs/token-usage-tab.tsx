/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useState } from 'react';
import type { CSSProperties } from 'react';

import type { TacticusGuildRaidResponse } from '@/fsd/5-shared/lib/tacticus-api';
import { Segmented } from '@/fsd/5-shared/ui';

import type { GuildTokenUsageResponse } from '../guild-performance.api';
import {
    CaptureButton,
    FilterBar,
    FilterGroup,
    ScrollX,
    SectionHeader,
    Stepper,
    TableCard,
} from '../guild-performance.components';
import { captureFileName, useSectionCapture } from '../guild-performance.hook';
import { resolvePlayerName } from '../guild-performance.utils';

import {
    buildLookupAndSeasons,
    computeSeasonTokenStats,
    getPlayerIdsSorted,
    type TokenEntry,
} from './token-usage-tab.utils';

type ColorMode = 'gradient' | 'threshold';

/** Props a cell needs for one value in one season, so both grids share the same renderer. */
type CellPropsFor = (value: number, season: number) => { className: string; style?: CSSProperties };

const LegendSwatch = ({ className, label }: { className: string; label: string }) => (
    <span className="flex items-center gap-1.5">
        <span className={`inline-block h-3 w-3 rounded-sm ${className}`} />
        {label}
    </span>
);

// Module-level cache — persists across in-session navigations
let cachedColorMode: ColorMode = 'threshold';
let cachedThreshold1 = 23;
let cachedThreshold2 = 26;

interface TokenUsageTabProps {
    tokenUsageData: GuildTokenUsageResponse | undefined;
    currentData: TacticusGuildRaidResponse | undefined;
    names: Map<string, string>;
    selectedPlayerId: string | undefined;
}

/**
 * Fill weight of a gradient cell, matching the threshold bands' `/26`–`/34`. The ramp is mixed with
 * `transparent` rather than painted at full strength so the two colour modes read as the same table:
 * at 100% the same value was a muted olive under Thresholds and a shouting amber under Gradient, and
 * near-white `--fg` on a full-strength `--warning` is about 1.7:1.
 */
const GRADIENT_FILL_PCT = 32;

/**
 * Diverging red → amber → green, with `--warning` as the explicit midpoint.
 *
 * Mixing `--danger` straight into `--success` blends through a desaturated brown-olive that reads
 * as its own category rather than as "halfway". Pinning the midpoint to amber keeps the ramp on the
 * colours the system already uses for bad / caution / good, and each half stays saturated.
 *
 * No theme branch — all three tokens flip with `.dark` on their own, and mixing into `transparent`
 * lets whatever is behind the cell show through in either theme.
 */
function gradientColor(ratio: number): string {
    const clamped = Math.min(1, Math.max(0, ratio));
    const ramp =
        clamped < 0.5
            ? // 0 → pure danger, 0.5 → pure warning
              `color-mix(in oklab, var(--warning) ${Math.round(clamped * 2 * 100)}%, var(--danger))`
            : // 0.5 → pure warning, 1 → pure success
              `color-mix(in oklab, var(--success) ${Math.round((clamped - 0.5) * 2 * 100)}%, var(--warning))`;
    return `color-mix(in oklab, ${ramp} ${GRADIENT_FILL_PCT}%, transparent)`;
}

export const TokenUsageTab = ({ tokenUsageData, currentData, names, selectedPlayerId }: TokenUsageTabProps) => {
    const tokensCapture = useSectionCapture<HTMLElement>(captureFileName('guild-token-usage', 'tokens'));
    const bombsCapture = useSectionCapture<HTMLElement>(captureFileName('guild-token-usage', 'bombs'));
    const [colorMode, setColorMode] = useState<ColorMode>(cachedColorMode);
    const [threshold1, setThreshold1] = useState(cachedThreshold1);
    const [threshold2, setThreshold2] = useState(cachedThreshold2);

    const lowThreshold = Math.min(threshold1, threshold2);
    const highThreshold = Math.max(threshold1, threshold2);

    if (!tokenUsageData && !currentData) {
        return <p className="text-sm text-(--soft-fg)">Loading…</p>;
    }

    const { lookup, seasons, currentSeasonNumber } = buildLookupAndSeasons(tokenUsageData, currentData);
    const playerIds = getPlayerIdsSorted(lookup, selectedPlayerId, names);

    if (playerIds.length === 0 || seasons.length === 0) {
        return <p className="text-sm text-(--soft-fg)">No token usage data available.</p>;
    }

    const seasonTokenStats = computeSeasonTokenStats(seasons, playerIds, lookup, colorMode);

    // Same micro-label treatment as ColumnHeader elsewhere on the page; this grid keeps <th>
    // because its column count is computed at runtime.
    const headerCell = 'bg-(--soft) px-2 py-1 text-center text-xs font-bold tracking-widest text-(--soft-fg) uppercase';

    /**
     * A matrix, not a list, so it gets grid rules rather than zebra: you read this table down a
     * column as often as along a row, and horizontal banding works against vertical scanning.
     */
    const gridRules = 'border-b border-b-(--hairline)';

    /**
     * The Player column pins while the seasons scroll beneath it — with twelve columns in a
     * horizontal scroller, losing track of whose row you are on is the actual navigation problem.
     * Sticky needs an opaque background or the cells scroll visibly underneath, so `bg-(--card)` is
     * load-bearing here; `group-hover` keeps an opaque colour so the pinned cell still responds.
     */
    const nameCell = `sticky left-0 z-10 ${gridRules} border-r border-r-(--border) bg-(--card) px-2.5 py-0.5 text-left text-xs font-semibold whitespace-nowrap text-(--fg) group-hover:bg-(--neutral)`;
    const dataCell = `border-l border-l-(--hairline) ${gridRules} px-2 py-0.5 text-center text-xs font-semibold`;
    const presentCell = `${dataCell} text-(--fg)`;
    const absentCell = `${dataCell} bg-(--soft) text-(--soft-fg)`;

    const getTokenCellProps = (tokens: number, season: number): { className: string; style?: CSSProperties } => {
        if (colorMode === 'gradient') {
            const stats = seasonTokenStats.get(season);
            const ratio =
                stats == undefined || stats.max === stats.min ? 1 : (tokens - stats.min) / (stats.max - stats.min);
            return {
                className: `${dataCell} text-(--fg)`,
                style: { backgroundColor: gradientColor(ratio) },
            };
        }
        if (season === currentSeasonNumber) return { className: presentCell };
        if (tokens >= highThreshold) return { className: `${dataCell} bg-(--success)/30 text-(--fg)` };
        if (tokens >= lowThreshold) return { className: `${dataCell} bg-(--warning)/34 text-(--fg)` };
        return { className: `${dataCell} bg-(--danger)/26 text-(--fg)` };
    };

    const seasonGrid = (valueOf: (entry: TokenEntry) => number, cellProps: CellPropsFor) => (
        <TableCard>
            <ScrollX minWidth={760}>
                {/* `border-separate` rather than `border-collapse`: collapsed borders belong to the
                    table, not the cell, so they do not travel with a sticky column and drop out as
                    it pins. Spacing 0 keeps the rules flush. */}
                <table className="w-full border-separate border-spacing-0">
                    <thead>
                        <tr>
                            {/* z above the body cells so the pinned header corner stays on top. */}
                            <th className={`${headerCell} ${gridRules} sticky left-0 z-20 min-w-36 text-left`}>
                                Player
                            </th>
                            {seasons.map(s => (
                                <th key={s} className={`${headerCell} ${gridRules} min-w-12`}>
                                    S{s}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {playerIds.map(userId => (
                            <tr key={userId} className="group hover:bg-(--primary)/10">
                                <td className={nameCell}>{resolvePlayerName(userId, names)}</td>
                                {seasons.map(s => {
                                    const entry = lookup.get(userId)?.get(s);
                                    // No row for this player in this season — they weren't in the guild.
                                    if (entry == undefined) {
                                        return (
                                            <td key={s} className={absentCell}>
                                                –
                                            </td>
                                        );
                                    }
                                    const { className, style } = cellProps(valueOf(entry), s);
                                    return (
                                        <td key={s} className={className} style={style}>
                                            {valueOf(entry)}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </ScrollX>
        </TableCard>
    );

    return (
        <div className="flex flex-col gap-3.5">
            <FilterBar>
                <FilterGroup label="Colour by">
                    <Segmented<ColorMode>
                        value={colorMode}
                        onChange={mode => {
                            cachedColorMode = mode;
                            setColorMode(mode);
                        }}
                        options={[
                            { value: 'threshold', label: 'Thresholds' },
                            { value: 'gradient', label: 'Gradient' },
                        ]}
                    />
                </FilterGroup>
                {/* Named by meaning rather than "Threshold 1 / 2"; the min/max swap below keeps
                    them working whichever way round they're set. */}
                {colorMode === 'threshold' && (
                    <>
                        <FilterGroup label="Full spend at">
                            <Stepper
                                value={threshold2}
                                min={0}
                                max={28}
                                onChange={value => {
                                    cachedThreshold2 = value;
                                    setThreshold2(value);
                                }}
                            />
                        </FilterGroup>
                        <FilterGroup label="Warn below">
                            <Stepper
                                value={threshold1}
                                min={0}
                                max={28}
                                onChange={value => {
                                    cachedThreshold1 = value;
                                    setThreshold1(value);
                                }}
                            />
                        </FilterGroup>
                    </>
                )}
                <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-(--soft-fg)">
                    {colorMode === 'threshold' ? (
                        <>
                            <LegendSwatch className="bg-(--success)/45" label={`${highThreshold}+`} />
                            {/* Both steppers can land on the same number, which leaves no amber band
                                at all — `tokens >= highThreshold` already claims it. Listing it then
                                printed an inverted range like "23–22" for a colour nothing uses. */}
                            {lowThreshold < highThreshold && (
                                <LegendSwatch
                                    className="bg-(--warning)/50"
                                    label={
                                        lowThreshold === highThreshold - 1
                                            ? String(lowThreshold)
                                            : `${lowThreshold}–${highThreshold - 1}`
                                    }
                                />
                            )}
                            <LegendSwatch className="bg-(--danger)/40" label={`under ${lowThreshold}`} />
                        </>
                    ) : (
                        // Gradient has no bands to list, but the strip still has to say what the
                        // colour means — the ramp is per season, not against a fixed target.
                        <span className="flex items-center gap-1.5">
                            Season low
                            <span
                                className="inline-block h-3 w-20 rounded-sm"
                                style={{
                                    background: `linear-gradient(to right, ${gradientColor(0)}, ${gradientColor(0.5)}, ${gradientColor(1)})`,
                                }}
                            />
                            high
                        </span>
                    )}
                    <LegendSwatch className="border border-(--border) bg-(--soft)" label="not in guild" />
                </div>
            </FilterBar>

            <section ref={tokensCapture.ref} className="flex flex-col gap-2">
                {/* The current season is left uncoloured in threshold mode on purpose — an absolute
                    target is meaningless before the season ends. Deliberately unlabelled: the
                    column holds real numbers with no fill, absent cells hold a dash on grey, and
                    the reader already knows which season is current. */}
                <SectionHeader
                    title="Tokens"
                    note="Out of 28 per season"
                    meta={<CaptureButton onCapture={tokensCapture.onCapture} isCapturing={tokensCapture.isCapturing} />}
                />
                {seasonGrid(entry => entry.tokens, getTokenCellProps)}
            </section>

            <section ref={bombsCapture.ref} className="flex flex-col gap-2">
                <SectionHeader
                    title="Bombs"
                    note="Uncoloured — bombs are optional"
                    meta={<CaptureButton onCapture={bombsCapture.onCapture} isCapturing={bombsCapture.isCapturing} />}
                />
                {seasonGrid(
                    entry => entry.bombs,
                    () => ({ className: presentCell })
                )}
            </section>
        </div>
    );
};
