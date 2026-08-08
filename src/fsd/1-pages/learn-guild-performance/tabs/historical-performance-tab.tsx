/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useTheme } from '@mui/material';
import { ResponsiveLine } from '@nivo/line';
import { type PartialTheme } from '@nivo/theming';
import { useMemo, useState } from 'react';

import { obfuscateUserId } from '@/fsd/5-shared/lib';
import { type TacticusGuildRaidResponse } from '@/fsd/5-shared/lib/tacticus-api';

import { type GuildPerformanceIndexApiResponse } from '../guild-performance.api';
import { CaptureButton, TableCard, TableCardHeader } from '../guild-performance.components';
import { captureFileName, useSectionCapture } from '../guild-performance.hook';

import { buildCurrentSeasonPIEntry, buildLinesFromPerformanceIndex } from './performance-tab.utils';

// Nivo theme properties are applied via inline styles, so CSS custom properties resolve correctly
// here and the theme needs no dark-mode branch — the tokens already flip with `.dark`.
// Matches the approach in `3-features/insights/stat-line-chart.tsx`.
// Token roles match stat-line-chart.tsx exactly: axis and domain lines are `--border`, grid lines
// are `--hairline`. `--input-border` was wrong here — it is scoped to input borders and switch
// off-tracks, not chart chrome.
const CHART_THEME: PartialTheme = {
    text: { fill: 'var(--fg)' },
    axis: {
        ticks: { text: { fill: 'var(--soft-fg)' }, line: { stroke: 'var(--border)' } },
        legend: { text: { fill: 'var(--fg)' } },
        domain: { line: { stroke: 'var(--border)' } },
    },
    grid: { line: { stroke: 'var(--hairline)' } },
};

const LegendLine = ({ className, dashed, label }: { className: string; dashed?: boolean; label: string }) => (
    <span className="flex items-center gap-1.5">
        <span className={`inline-block h-0 w-4 border-t-2 ${dashed ? 'border-dashed' : ''} ${className}`} />
        {label}
    </span>
);

// ---------------------------------------------------------------------------
// HistoricalPerformanceTab
// ---------------------------------------------------------------------------

export const HistoricalPerformanceTab = ({
    currentData,
    performanceIndex,
    names,
    selectedPlayerId,
    ownUserId,
    isLoading = false,
}: {
    /** Raw current-season raid data — used to compute the live season's PI on the fly. */
    currentData: TacticusGuildRaidResponse | undefined;
    performanceIndex?: GuildPerformanceIndexApiResponse;
    names: Map<string, string>;
    /** Page-level player selection — highlights this player's line (others stay faded). */
    selectedPlayerId: string | undefined;
    /** The caller's own userId — used to resolve null-playerId rows for keyless members. */
    ownUserId?: string;
    /** True while the performance-index is still being fetched — avoids flashing a near-empty
     *  chart (current season only) before the historical seasons arrive. */
    isLoading?: boolean;
}) => {
    const chart = useSectionCapture(captureFileName('guild-performance-index-by-season'));
    // useTheme() triggers a re-render on palette change, so the getPropertyValue reads below
    // re-resolve. Series and marker colours can't use `var()` — unlike the theme above, nivo puts
    // these on SVG attributes, which don't resolve custom properties.
    useTheme();
    const rootStyle = getComputedStyle(document.documentElement);
    const activeLineColor = rootStyle.getPropertyValue('--primary').trim();
    // Chart series come from the chart scale. `--chart-5` is its lightest step, so the unselected
    // players recede without needing an alpha computed over an unknown colour space.
    const fadedLineColor = rootStyle.getPropertyValue('--chart-5').trim();
    const markerColor = rootStyle.getPropertyValue('--accent').trim();

    // Current season PI computed from raw entries; merged with historical index data.
    const currentEntry = useMemo(
        () => (currentData ? buildCurrentSeasonPIEntry(currentData) : undefined),
        [currentData]
    );

    // Combine current + historical, deduplicating by season number in case the backend has already
    // persisted the current season into the performance-index endpoint.
    const allEntries = useMemo(() => {
        const historical = performanceIndex?.entries ?? [];
        if (!currentEntry) return historical;
        const deduped = historical.filter(entry => entry.season !== currentEntry.season);
        return [currentEntry, ...deduped];
    }, [performanceIndex, currentEntry]);

    const lines = useMemo(
        () => buildLinesFromPerformanceIndex(allEntries, names, ownUserId),
        [allEntries, names, ownUserId]
    );
    const nameById = useMemo(() => new Map(lines.map(line => [line.userId, line.displayName])), [lines]);

    const chartData = useMemo(
        () =>
            lines.map(line => ({
                id: line.userId,
                data: line.points.map(point => ({ x: point.season, y: point.performanceIndex })),
            })),
        [lines]
    );

    // The bright line is whichever the user is hovering, else the one chosen in the page dropdown.
    const [hoveredId, setHoveredId] = useState<string | undefined>();
    const activeId = hoveredId ?? selectedPlayerId;

    const allSeasons = useMemo(
        () => [...new Set(lines.flatMap(l => l.points.map(p => p.season)))].toSorted((a, b) => a - b),
        [lines]
    );
    const firstSeason = allSeasons[0];
    const lastSeason = allSeasons.at(-1);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center rounded-xl border border-(--border) bg-(--soft) py-12 text-sm text-(--soft-fg)">
                Loading…
            </div>
        );
    }
    if (allEntries.length === 0) {
        return <p className="text-sm text-(--soft-fg)">No season history available yet.</p>;
    }
    if (lines.length === 0) {
        return (
            <div className="flex items-center justify-center rounded-xl border border-(--border) bg-(--soft) py-12 text-sm text-(--soft-fg)">
                No performance index recorded for any player.
            </div>
        );
    }

    return (
        <TableCard ref={chart.ref}>
            <TableCardHeader>
                <span className="text-[13px] font-extrabold text-(--fg)">Performance index by season</span>
                <span className="text-[11px] text-(--soft-fg)">
                    Bosses only, excluding kills · 1.00 = guild average
                </span>
                {/* One `ml-auto`, on the group. Two of them split the row twice, which pushed the
                    capture button in between the title and the note that explains it. */}
                <div className="ml-auto flex flex-wrap items-center gap-3 text-[11px] text-(--soft-fg)">
                    <LegendLine className="border-(--primary)" label="Selected" />
                    <LegendLine className="border-(--chart-5)" label={`${lines.length - 1} others`} />
                    <LegendLine className="border-(--accent)" dashed label="Guild avg" />
                    <CaptureButton onCapture={chart.onCapture} isCapturing={chart.isCapturing} />
                </div>
            </TableCardHeader>
            <div className="h-[420px] p-2">
                <ResponsiveLine
                    data={chartData}
                    theme={CHART_THEME}
                    margin={{ top: 20, right: 30, bottom: 50, left: 50 }}
                    xScale={{ type: 'linear', min: firstSeason, max: lastSeason }}
                    yScale={{ type: 'linear', min: 0, max: 'auto' }}
                    curve="monotoneX"
                    enablePoints={false}
                    lineWidth={1.5}
                    useMesh
                    colors={(serie: { id: string | number }) =>
                        String(serie.id) === activeId ? activeLineColor : fadedLineColor
                    }
                    onMouseMove={point => {
                        if ('seriesId' in point) setHoveredId(String(point.seriesId));
                    }}
                    onMouseLeave={() => setHoveredId(undefined)}
                    axisBottom={{
                        tickValues: allSeasons,
                        legend: 'Season',
                        legendOffset: 38,
                        legendPosition: 'middle',
                        format: value => `S${value}`,
                    }}
                    axisLeft={{
                        legend: 'Performance index',
                        legendOffset: -44,
                        legendPosition: 'middle',
                    }}
                    markers={[
                        {
                            axis: 'y',
                            value: 1,
                            lineStyle: { stroke: markerColor, strokeWidth: 1, strokeDasharray: '4 4' },
                            legend: 'Guild avg',
                            legendOrientation: 'horizontal',
                            textStyle: { fontSize: 10, fill: markerColor },
                        },
                    ]}
                    // Stacked, but by layout rather than by wrapping: each line carries
                    // `whitespace-nowrap`, so an obfuscated id can never break mid-token the way it
                    // did when nivo's narrow positioning container was left to fold the text itself.
                    // eslint-disable-next-line react/no-unstable-nested-components -- closes over the id→name map
                    tooltip={({ point }) => (
                        <div className="rounded-lg border border-(--border) bg-(--overlay) px-2.5 py-1.5 text-xs text-(--fg) shadow-lg">
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <span
                                    aria-hidden="true"
                                    className="inline-block h-0 w-3 shrink-0 border-t-2"
                                    style={{
                                        borderColor:
                                            String(point.seriesId) === activeId ? activeLineColor : fadedLineColor,
                                    }}
                                />
                                <span className="font-semibold">
                                    {nameById.get(String(point.seriesId)) ?? obfuscateUserId(String(point.seriesId))}
                                </span>
                            </div>
                            <div className="mt-0.5 flex items-baseline gap-1.5 whitespace-nowrap">
                                <span className="text-(--soft-fg)">Season {String(point.data.x)}</span>
                                <span className="font-bold tabular-nums">{Number(point.data.y).toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                    animate={false}
                />
            </div>
            <div className="border-t border-(--hairline) px-3 py-1.5 text-[11px] text-(--soft-fg)">
                Hover any line to bring it forward, or pick a player in the header to pin it.
            </div>
        </TableCard>
    );
};
