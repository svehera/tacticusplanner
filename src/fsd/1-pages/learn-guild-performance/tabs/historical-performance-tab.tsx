/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useTheme } from '@mui/material';
import { ResponsiveLine } from '@nivo/line';
import { type PartialTheme } from '@nivo/theming';
import { useMemo, useState } from 'react';

import { type GuildSeasonHistoryResponse } from '@/fsd/5-shared/lib/tacticus-api';

import { buildPlayerPerformanceIndexSeries, getHistoricalPerformancePlayers } from './performance-tab.utils';

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

// ---------------------------------------------------------------------------
// Player select
// ---------------------------------------------------------------------------

function PlayerSelect({
    players,
    value,
    onChange,
}: {
    players: { userId: string; displayName: string }[];
    value: string | undefined;
    onChange: (userId: string | undefined) => void;
}) {
    return (
        <label className="flex flex-col gap-0.5 text-xs">
            <span className="font-semibold text-gray-500 uppercase dark:text-gray-400">Player</span>
            <select
                value={value ?? ''}
                onChange={event => {
                    onChange(event.target.value === '' ? undefined : event.target.value);
                }}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900">
                <option value="">Select a player…</option>
                {players.map(player => (
                    <option key={player.userId} value={player.userId}>
                        {player.displayName}
                    </option>
                ))}
            </select>
        </label>
    );
}

/** Hoisted so it isn't re-created each render (react/no-unstable-nested-components). */
function PerformanceTooltip({ point }: { point: { data: { x: unknown; y: unknown } } }) {
    return (
        <div className="rounded border border-gray-300 bg-white px-2 py-1 text-xs shadow dark:border-gray-600 dark:bg-gray-900">
            Season {String(point.data.x)}: {Number(point.data.y).toFixed(2)}
        </div>
    );
}

// ---------------------------------------------------------------------------
// HistoricalPerformanceTab
// ---------------------------------------------------------------------------

export const HistoricalPerformanceTab = ({
    seasonHistory,
    names,
    memberUserId,
}: {
    seasonHistory?: GuildSeasonHistoryResponse;
    names: Map<string, string>;
    /** When set (a keyless member), the chart is pinned to this player and the player select is hidden. */
    memberUserId?: string;
}) => {
    const isDark = useTheme().palette.mode === 'dark';
    const chartTheme = useMemo(() => chartThemeFor(isDark), [isDark]);

    const seasonData = useMemo(() => seasonHistory?.seasonData ?? [], [seasonHistory]);

    const players = useMemo(() => getHistoricalPerformancePlayers(seasonData, names), [seasonData, names]);

    const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
    // A member is locked to their own line; otherwise the dropdown drives the selection.
    const effectiveUserId = memberUserId ?? selectedUserId;

    const series = useMemo(
        () => (effectiveUserId === undefined ? [] : buildPlayerPerformanceIndexSeries(seasonData, effectiveUserId)),
        [seasonData, effectiveUserId]
    );

    const chartData = useMemo(
        () => [
            { id: 'Performance Index', data: series.map(point => ({ x: point.season, y: point.performanceIndex })) },
        ],
        [series]
    );

    // X axis spans the full recorded history, even when the player skipped seasons in between.
    const firstSeason = seasonData[0]?.season;
    const lastSeason = seasonData.at(-1)?.season;

    if (seasonData.length === 0) {
        return <p className="text-sm text-gray-500">No season history available yet.</p>;
    }

    return (
        <div className="flex flex-col gap-4">
            {/* A keyless member only sees their own line, so the player select is hidden for them. */}
            {memberUserId === undefined && (
                <div className="flex flex-wrap items-end gap-4 border-b border-gray-200 pb-3 dark:border-gray-700">
                    <PlayerSelect players={players} value={selectedUserId} onChange={setSelectedUserId} />
                </div>
            )}

            {effectiveUserId === undefined ? (
                <p className="text-sm text-gray-500">Select a player to see their performance index across seasons.</p>
            ) : series.length === 0 ? (
                <div className="flex items-center justify-center rounded border border-gray-200 bg-gray-50 py-12 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900">
                    No performance index recorded for this player in any season.
                </div>
            ) : (
                <section className="flex max-w-4xl flex-col gap-2">
                    <h2 className="text-base font-semibold">
                        Performance Index by season{' '}
                        <span className="text-xs font-normal text-gray-500">
                            Bosses only, excluding kills. 1.0 = guild average.
                        </span>
                    </h2>
                    <div className="h-[380px]">
                        <ResponsiveLine
                            data={chartData}
                            theme={chartTheme}
                            margin={{ top: 20, right: 30, bottom: 50, left: 50 }}
                            xScale={{ type: 'linear', min: firstSeason, max: lastSeason }}
                            yScale={{ type: 'linear', min: 0, max: 'auto' }}
                            curve="monotoneX"
                            enablePoints={true}
                            pointSize={8}
                            useMesh={true}
                            colors={{ scheme: 'category10' }}
                            axisBottom={{
                                tickValues: series.map(point => point.season),
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
                            tooltip={PerformanceTooltip}
                            animate={false}
                        />
                    </div>
                </section>
            )}
        </div>
    );
};
