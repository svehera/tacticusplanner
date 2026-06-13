import { useTheme } from '@mui/material';
import { ResponsiveLine } from '@nivo/line';
import { type PartialTheme } from '@nivo/theming';
import { useMemo } from 'react';

import { IDailyStat } from './insights.models';

function chartThemeFor(isDark: boolean): PartialTheme {
    const text = isDark ? '#d1d5db' : '#374151';
    const muted = isDark ? '#9ca3af' : '#4b5563';
    const line = isDark ? '#4b5563' : '#d1d5db';
    const grid = isDark ? '#374151' : '#e5e7eb';
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

interface StatLineChartProps {
    title: string;
    dailyStats: IDailyStat[];
    accessor: (stat: IDailyStat) => number;
    color: string;
}

export const StatLineChart = ({ title, dailyStats, accessor, color }: StatLineChartProps) => {
    const isDark = useTheme().palette.mode === 'dark';
    const chartTheme = useMemo(() => chartThemeFor(isDark), [isDark]);

    const tooltipBg = isDark ? '#111827' : '#ffffff';
    const tooltipBorder = isDark ? '#4b5563' : '#d1d5db';
    const tooltipText = isDark ? '#f3f4f6' : '#111827';

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

    const yValues = chartData[0].data.map(d => d.y as number);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const padding = Math.max(Math.round((yMax - yMin) * 0.1), 1);

    return (
        <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-(--fg)">{title}</h3>
            <div className="h-48">
                <ResponsiveLine
                    data={chartData}
                    theme={chartTheme}
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
                        <div
                            style={{
                                background: tooltipBg,
                                border: `1px solid ${tooltipBorder}`,
                                color: tooltipText,
                            }}
                            className="rounded px-2 py-1 text-xs shadow">
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
