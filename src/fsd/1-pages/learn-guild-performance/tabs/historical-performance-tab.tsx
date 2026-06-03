/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useTheme } from '@mui/material';
import { ResponsiveLine } from '@nivo/line';
import { type PartialTheme } from '@nivo/theming';
import { useMemo, useState } from 'react';

import { type GuildSeasonHistoryResponse } from '@/fsd/5-shared/lib/tacticus-api';

import { buildAllPlayersPerformanceLines } from './performance-tab.utils';

/** Nivo theme tuned for legibility in both light and dark CSS modes. */
function chartThemeFor(isDark: boolean): PartialTheme {
    const text = isDark ? '#d1d5db' : '#374151'; // gray-300 / gray-700
    const muted = isDark ? '#9ca3af' : '#4b5563'; // gray-400 / gray-600
    const line = isDark ? '#4b5563' : '#d1d5db'; // gray-600 / gray-300
    const grid = isDark ? '#374151' : '#e5e7eb'; // gray-700 / gray-200
    return {
        text: { fill: text },
        axis: {
            ticks: { text: { fill: muted }, line: { stroke: line } },
            legend: { text: { fill: text } },
            domain: { line: { stroke: line } },
        },
        grid: { line: { stroke: grid } },
    };
}

const ACTIVE_LINE_COLOR = '#3b82f6'; // blue-500

// ---------------------------------------------------------------------------
// HistoricalPerformanceTab
// ---------------------------------------------------------------------------

export const HistoricalPerformanceTab = ({
    seasonHistory,
    names,
    selectedPlayerId,
}: {
    seasonHistory?: GuildSeasonHistoryResponse;
    names: Map<string, string>;
    /** Page-level player selection — highlights this player's line (others stay faded). */
    selectedPlayerId: string | undefined;
}) => {
    const isDark = useTheme().palette.mode === 'dark';
    const chartTheme = useMemo(() => chartThemeFor(isDark), [isDark]);
    const fadedLineColor = isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(100, 116, 139, 0.2)'; // slate

    const seasonData = useMemo(() => seasonHistory?.seasonData ?? [], [seasonHistory]);

    const lines = useMemo(() => buildAllPlayersPerformanceLines(seasonData, names), [seasonData, names]);
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

    // X axis spans the full recorded history.
    const allSeasons = useMemo(() => seasonData.map(summary => summary.season), [seasonData]);
    const firstSeason = allSeasons[0];
    const lastSeason = allSeasons.at(-1);

    if (seasonData.length === 0) {
        return <p className="text-sm text-gray-500">No season history available yet.</p>;
    }
    if (lines.length === 0) {
        return (
            <div className="flex items-center justify-center rounded border border-gray-200 bg-gray-50 py-12 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900">
                No performance index recorded for any player.
            </div>
        );
    }

    return (
        <section className="flex max-w-4xl flex-col gap-2">
            <h2 className="text-base font-semibold">
                Performance Index by season{' '}
                <span className="text-xs font-normal text-gray-500">
                    Bosses only, excluding kills. 1.0 = guild average. Hover a line, or pick a player above.
                </span>
            </h2>
            <div className="h-[420px]">
                <ResponsiveLine
                    data={chartData}
                    theme={chartTheme}
                    margin={{ top: 20, right: 30, bottom: 50, left: 50 }}
                    xScale={{ type: 'linear', min: firstSeason, max: lastSeason }}
                    yScale={{ type: 'linear', min: 0, max: 'auto' }}
                    curve="monotoneX"
                    enablePoints={false}
                    lineWidth={1.5}
                    useMesh
                    colors={(serie: { id: string | number }) =>
                        String(serie.id) === activeId ? ACTIVE_LINE_COLOR : fadedLineColor
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
                            lineStyle: { stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '4 4' },
                            legend: 'Guild avg',
                            legendOrientation: 'horizontal',
                            textStyle: { fontSize: 10, fill: '#f59e0b' },
                        },
                    ]}
                    // eslint-disable-next-line react/no-unstable-nested-components -- closes over the id→name map
                    tooltip={({ point }) => (
                        <div className="rounded border border-gray-300 bg-white px-2 py-1 text-xs shadow dark:border-gray-600 dark:bg-gray-900">
                            <span className="font-semibold">
                                {nameById.get(String(point.seriesId)) ?? String(point.seriesId)}
                            </span>
                            {' — '}Season {String(point.data.x)}: {Number(point.data.y).toFixed(2)}
                        </div>
                    )}
                    animate={false}
                />
            </div>
        </section>
    );
};
