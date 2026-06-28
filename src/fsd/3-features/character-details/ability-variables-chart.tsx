import { ResponsiveLine } from '@nivo/line';
import { type PartialTheme } from '@nivo/theming';
import { useMemo } from 'react';

import { Rarity } from '@/fsd/5-shared/model';

import { buildSeries } from './ability-series';

const CHART_THEME: PartialTheme = {
    text: { fill: 'var(--fg)' },
    axis: {
        ticks: { text: { fill: 'var(--fg)', fontSize: 9 }, line: { stroke: 'var(--border)' } },
        legend: { text: { fill: 'var(--fg)' } },
        domain: { line: { stroke: 'var(--border)' } },
    },
    grid: { line: { stroke: 'var(--hairline)' } },
};

const SERIES_COLORS = [
    '#22c55e',
    '#60a5fa',
    '#f97316',
    '#a855f7',
    '#eab308',
    '#ec4899',
    '#14b8a6',
    '#f43f5e',
    '#84cc16',
    '#06b6d4',
];

interface Props {
    variables: Record<string, (string | number)[]>;
    scaledVariableNames: readonly string[];
    rarity: Rarity;
    currentLevel: number;
}

export const AbilityVariablesChart = ({ variables, scaledVariableNames, rarity, currentLevel }: Props) => {
    const series = useMemo(
        () => buildSeries(variables, scaledVariableNames, rarity),
        [variables, scaledVariableNames, rarity]
    );

    const maxLevel = useMemo(() => Math.max(...Object.values(variables).map(v => v.length), 1), [variables]);

    const yMax = useMemo(() => Math.max(...series.flatMap(s => s.data.map(d => d.y)), 1), [series]);

    const xTickValues = useMemo(() => {
        const step = maxLevel <= 20 ? 5 : 10;
        return Array.from({ length: Math.floor(maxLevel / step) }, (_, index) => (index + 1) * step);
    }, [maxLevel]);

    if (series.length === 0) return;

    const markerLevel = Math.min(currentLevel, maxLevel);

    return (
        <>
            {/* Chart — hidden on small screens */}
            <div className="hidden h-40 w-full sm:block">
                <ResponsiveLine
                    data={series}
                    theme={CHART_THEME}
                    colors={SERIES_COLORS}
                    margin={{ top: 8, right: 16, bottom: 28, left: 44 }}
                    xScale={{ type: 'linear', min: 1, max: maxLevel }}
                    yScale={{ type: 'linear', min: 0, max: yMax }}
                    lineWidth={1.5}
                    enablePoints={false}
                    enableSlices="x"
                    sliceTooltip={({ slice }) => {
                        const level = slice.points[0]?.data.x as number;
                        return (
                            <div className="rounded border border-(--border) bg-(--bg) px-2 py-1 text-xs text-(--fg) shadow">
                                <div className="mb-1 font-semibold">Level {level}</div>
                                {slice.points.map(point => (
                                    <div key={point.seriesId} className="flex items-center gap-1">
                                        <span
                                            className="inline-block h-2 w-2 shrink-0 rounded-full"
                                            style={{ background: point.color }}
                                        />
                                        <span>{String(point.seriesId)}:</span>
                                        <span className="font-semibold">
                                            {(point.data.y as number).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        );
                    }}
                    markers={[
                        {
                            axis: 'x',
                            value: markerLevel,
                            lineStyle: { stroke: 'rgba(250,204,21,0.8)', strokeWidth: 1.5 },
                        },
                    ]}
                    axisBottom={{ tickValues: xTickValues, tickSize: 3 }}
                    axisLeft={{ tickValues: 4, format: (v: number) => v.toLocaleString() }}
                    animate={false}
                />
            </div>

            {/* Collapsible table — shown only on small screens */}
            <details className="mt-2 w-full sm:hidden">
                <summary className="cursor-pointer rounded bg-(--overlay) px-2 py-1 text-xs text-(--soft-fg)">
                    Values by level
                </summary>
                <div className="mt-1 overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-(--border)">
                                <th className="py-1 pr-3 text-left font-semibold text-(--soft-fg)">Lvl</th>
                                {series.map(s => (
                                    <th key={s.id} className="py-1 pr-3 text-right font-semibold text-(--fg)">
                                        {s.id}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: maxLevel }, (_, levelIndex) => (
                                <tr
                                    key={levelIndex}
                                    className={
                                        levelIndex + 1 === currentLevel ? 'rounded bg-(--overlay) font-semibold' : ''
                                    }>
                                    <td className="py-0.5 pr-3 text-(--soft-fg)">{levelIndex + 1}</td>
                                    {series.map(s => (
                                        <td key={s.id} className="py-0.5 pr-3 text-right text-(--fg) tabular-nums">
                                            {s.data[levelIndex]?.y.toLocaleString() ?? '—'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </>
    );
};
