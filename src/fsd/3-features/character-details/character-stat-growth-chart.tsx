/* eslint-disable import-x/no-internal-modules */
import { ResponsiveLine } from '@nivo/line';
import { type PartialTheme } from '@nivo/theming';
import { useMemo } from 'react';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { calculateStat } from '@/fsd/5-shared/lib/stat-calculator';
import { Rank, RarityStars } from '@/fsd/5-shared/model';
import { RankIcon } from '@/fsd/5-shared/ui/icons/rank.icon';

const CHART_THEME: PartialTheme = {
    text: { fill: 'var(--fg)' },
    axis: {
        ticks: { text: { fill: 'var(--fg)', fontSize: 9 }, line: { stroke: 'var(--border)' } },
        legend: { text: { fill: 'var(--fg)' } },
        domain: { line: { stroke: 'var(--border)' } },
    },
    grid: { line: { stroke: 'var(--hairline)' } },
};

const RANK_ABBREV: Record<number, string> = {
    [Rank.Stone1]: 'St1',
    [Rank.Stone2]: 'St2',
    [Rank.Stone3]: 'St3',
    [Rank.Iron1]: 'I1',
    [Rank.Iron2]: 'I2',
    [Rank.Iron3]: 'I3',
    [Rank.Bronze1]: 'Br1',
    [Rank.Bronze2]: 'Br2',
    [Rank.Bronze3]: 'Br3',
    [Rank.Silver1]: 'S1',
    [Rank.Silver2]: 'S2',
    [Rank.Silver3]: 'S3',
    [Rank.Gold1]: 'G1',
    [Rank.Gold2]: 'G2',
    [Rank.Gold3]: 'G3',
    [Rank.Diamond1]: 'D1',
    [Rank.Diamond2]: 'D2',
    [Rank.Diamond3]: 'D3',
    [Rank.Adamantine1]: 'A1',
    [Rank.Adamantine2]: 'A2',
    [Rank.Adamantine3]: 'A3',
};

const ABBREV_TO_RANK: Record<string, Rank> = Object.fromEntries(
    Object.entries(RANK_ABBREV).map(([rank, abbrev]) => [abbrev, Number(rank) as Rank])
);

interface Props {
    baseDamage: number;
    baseHealth: number;
    baseArmor: number;
    currentRank: Rank;
    stars: RarityStars;
    maxRank: Rank;
}

export const CharacterStatGrowthChart = ({ baseDamage, baseHealth, baseArmor, currentRank, stars, maxRank }: Props) => {
    const ranks = useMemo(() => getEnumValues(Rank).filter(r => r >= Rank.Stone1 && r <= maxRank), [maxRank]);

    const yMax = useMemo(
        () =>
            Math.max(
                calculateStat(baseHealth, maxRank, stars),
                calculateStat(baseDamage, maxRank, stars),
                calculateStat(baseArmor, maxRank, stars)
            ),
        [baseDamage, baseHealth, baseArmor, maxRank, stars]
    );

    const chartData = useMemo(
        () => [
            {
                id: 'Health',
                data: ranks.map(r => ({ x: RANK_ABBREV[r], y: calculateStat(baseHealth, r, stars) })),
            },
            {
                id: 'Damage',
                data: ranks.map(r => ({ x: RANK_ABBREV[r], y: calculateStat(baseDamage, r, stars) })),
            },
            {
                id: 'Armor',
                data: ranks.map(r => ({ x: RANK_ABBREV[r], y: calculateStat(baseArmor, r, stars) })),
            },
        ],
        [baseDamage, baseHealth, baseArmor, ranks, stars]
    );

    const currentRankLabel = RANK_ABBREV[currentRank];

    return (
        <div className="h-44 w-full">
            <ResponsiveLine
                data={chartData}
                theme={CHART_THEME}
                colors={['#22c55e', '#ef4444', '#60a5fa']}
                margin={{ top: 20, right: 16, bottom: 28, left: 50 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 0, max: yMax }}
                lineWidth={2}
                enablePoints={false}
                enableSlices="x"
                sliceTooltip={({ slice }) => {
                    const rank = ABBREV_TO_RANK[String(slice.points[0].data.x)];
                    return (
                        <div className="rounded border border-(--border) bg-(--bg) px-2 py-1 text-xs text-(--fg) shadow">
                            <div className="mb-1 flex items-center gap-1">
                                {rank !== undefined && <RankIcon rank={rank} size={20} />}
                            </div>
                            {slice.points.map(point => (
                                <div key={point.seriesId} className="flex items-center gap-1">
                                    <span
                                        className="inline-block h-2 w-2 shrink-0 rounded-full"
                                        style={{ background: point.color }}
                                    />
                                    <span>{String(point.seriesId)}:</span>
                                    <span className="font-semibold">{(point.data.y as number).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    );
                }}
                markers={
                    currentRankLabel
                        ? [
                              {
                                  axis: 'x',
                                  value: currentRankLabel,
                                  lineStyle: { stroke: 'rgba(250,204,21,0.8)', strokeWidth: 2 },
                              },
                          ]
                        : []
                }
                axisBottom={{
                    tickSize: 3,
                    tickPadding: 2,
                    renderTick: tick => {
                        const rank = ABBREV_TO_RANK[String(tick.value)];
                        if (rank === undefined) return <g />;
                        return (
                            <g transform={`translate(${tick.x},${tick.y})`}>
                                <foreignObject x={-9} y={4} width={18} height={18}>
                                    <RankIcon rank={rank} size={18} />
                                </foreignObject>
                            </g>
                        );
                    },
                }}
                axisLeft={{
                    tickValues: 4,
                    format: (v: number) => Math.round(v).toLocaleString(),
                }}
                legends={[
                    {
                        anchor: 'top-left',
                        direction: 'row',
                        translateY: -18,
                        itemWidth: 58,
                        itemHeight: 12,
                        symbolSize: 8,
                        symbolShape: 'circle',
                        itemTextColor: 'var(--fg)',
                    },
                ]}
                animate={false}
            />
        </div>
    );
};
