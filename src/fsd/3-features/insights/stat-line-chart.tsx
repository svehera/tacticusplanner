import { ResponsiveLine } from '@nivo/line';
import { type PartialTheme } from '@nivo/theming';
import { useMemo } from 'react';

import { IDailyStat } from './insights.models';

// Nivo theme properties are applied via inline styles, so CSS custom properties resolve correctly.
const CHART_THEME: PartialTheme = {
    text: { fill: 'var(--fg)' },
    axis: {
        ticks: { text: { fill: 'var(--fg)' }, line: { stroke: 'var(--border)' } },
        legend: { text: { fill: 'var(--fg)' } },
        domain: { line: { stroke: 'var(--border)' } },
    },
    grid: { line: { stroke: 'var(--hairline)' } },
};

interface StatLineChartProps {
    title: string;
    dailyStats: IDailyStat[];
    accessor: (stat: IDailyStat) => number;
    color: string;
}

export const StatLineChart = ({ title, dailyStats, accessor, color }: StatLineChartProps) => {
    const chartData = useMemo(
        () => [
            {
                id: title,
                color,
                data: dailyStats.map(stat => ({
                    x: stat.date,
                    y: accessor(stat),
                })),
            },
        ],
        [dailyStats, accessor, title, color]
    );

    const points = chartData[0].data;
    let yMin = 0;
    let yMax = 1;
    let padding = 1;
    if (points.length > 0) {
        const yValues = points.map(d => d.y as number);
        yMin = Math.min(...yValues);
        yMax = Math.max(...yValues);
        padding = Math.max(Math.round((yMax - yMin) * 0.1), 1);
    }

    if (points.length === 0) {
        return (
            <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-(--fg)">{title}</h3>
                <div className="flex h-48 items-center justify-center text-sm text-(--fg)">No data</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-(--fg)">{title}</h3>
            <div className="h-48">
                <ResponsiveLine
                    data={chartData}
                    theme={CHART_THEME}
                    margin={{ top: 8, right: 16, bottom: 40, left: 60 }}
                    xScale={{ type: 'point' }}
                    yScale={{ type: 'linear', min: yMin - padding, max: yMax + padding }}
                    curve="monotoneX"
                    colors={[color]}
                    lineWidth={2}
                    enablePoints={true}
                    pointSize={5}
                    pointColor={color}
                    pointBorderWidth={0}
                    enableArea={true}
                    areaOpacity={0.12}
                    useMesh={true}
                    axisBottom={{
                        tickRotation: -30,
                    }}
                    axisLeft={{
                        tickValues: 4,
                        format: (v: number) => v.toLocaleString(),
                    }}
                    tooltip={({ point }) => (
                        <div className="rounded border border-(--border) bg-(--bg) px-2 py-1 text-xs text-(--fg) shadow">
                            <span className="font-semibold">{String(point.data.x)}</span>:{' '}
                            {(point.data.y as number).toLocaleString()}
                        </div>
                    )}
                    animate={false}
                />
            </div>
        </div>
    );
};
