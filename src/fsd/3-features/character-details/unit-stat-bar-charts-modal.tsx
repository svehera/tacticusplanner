import { useMemo } from 'react';

import { Rank, RarityStars } from '@/fsd/5-shared/model';
import { PortalDialog } from '@/fsd/5-shared/ui';

import { AXIS_DESCRIPTIONS, AxisBar, buildAxisDistributions, niceTicks, RadarAxisId } from './unit-stat-radar.utils';

const AXIS_ORDER: RadarAxisId[] = [
    'health',
    'armor',
    'meleeVsInfArmor',
    'meleeVsZeroArmor',
    'rangedVsInfArmor',
    'rangedVsZeroArmor',
];

const CHART_WIDTH = 1000;
const CHART_HEIGHT = 340;
const MARGIN_LEFT = 55;
const MARGIN_RIGHT = 60;
const MARGIN_TOP = 14;
const MARGIN_BOTTOM = 110;

interface BarChartProps {
    title: string;
    bars: AxisBar[];
    highlightId: string;
}

const AxisBarChart = ({ title, bars, highlightId }: BarChartProps) => {
    const ticks = niceTicks(bars.at(-1)?.value ?? 0);
    const top = ticks.at(-1) || 1;
    const plotHeight = CHART_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;
    const slot = (CHART_WIDTH - MARGIN_LEFT - MARGIN_RIGHT) / Math.max(bars.length, 1);
    const highlightIndex = bars.findIndex(bar => bar.id === highlightId);

    return (
        <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-(--fg)">
                {title}
                {highlightIndex !== -1 && (
                    <span className="ml-2 font-normal text-(--soft-fg)">
                        rank {bars.length - highlightIndex} of {bars.length}
                    </span>
                )}
            </span>
            <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-auto w-full" role="img" aria-label={title}>
                {ticks.map(tick => {
                    const y = MARGIN_TOP + plotHeight * (1 - tick / top);
                    return (
                        <g key={tick}>
                            <line
                                x1={MARGIN_LEFT}
                                x2={CHART_WIDTH - MARGIN_RIGHT}
                                y1={y}
                                y2={y}
                                style={{ stroke: 'var(--border)' }}
                            />
                            <text
                                x={MARGIN_LEFT - 6}
                                y={y}
                                dominantBaseline="middle"
                                style={{ fill: 'var(--fg-muted)', fontSize: 11 }}>
                                {tick.toLocaleString()}
                            </text>
                        </g>
                    );
                })}
                {bars.map((bar, index) => {
                    const isCurrent = bar.id === highlightId;
                    const height = plotHeight * (bar.value / top);
                    const x = MARGIN_LEFT + index * slot;
                    const labelX = x + slot / 2;
                    const baseY = MARGIN_TOP + plotHeight;
                    return (
                        <g key={bar.id}>
                            <rect
                                x={x + 1}
                                y={baseY - height}
                                width={Math.max(slot - 2, 1)}
                                height={height}
                                style={{ fill: isCurrent ? 'var(--primary)' : 'var(--fg-muted)' }}>
                                <title>{`${bar.name}: ${Math.round(bar.value).toLocaleString()}`}</title>
                            </rect>
                            <text
                                transform={`translate(${labelX - 3},${baseY + 6}) rotate(60)`}
                                style={{
                                    fill: isCurrent ? 'var(--primary)' : 'var(--soft-fg)',
                                    fontSize: 9,
                                    fontWeight: isCurrent ? 700 : 400,
                                }}>
                                {bar.name}
                            </text>
                        </g>
                    );
                })}
                {/* Drawn after every bar so a taller neighbour can't cover it. */}
                {highlightIndex !== -1 && (
                    <text
                        x={MARGIN_LEFT + highlightIndex * slot + slot / 2}
                        y={MARGIN_TOP + plotHeight - plotHeight * (bars[highlightIndex].value / top) - 4}
                        textAnchor="middle"
                        style={{
                            fill: 'var(--primary)',
                            fontSize: 11,
                            fontWeight: 700,
                            stroke: 'black',
                            strokeWidth: 3,
                            strokeLinejoin: 'round',
                            paintOrder: 'stroke',
                        }}>
                        {Math.round(bars[highlightIndex].value).toLocaleString()}
                    </text>
                )}
            </svg>
        </div>
    );
};

interface Props {
    open: boolean;
    onClose: () => void;
    snowprintId: string;
    /** Every character is evaluated at this rank/stars, so the comparison matches the unit as viewed. */
    rank: Rank;
    stars: RarityStars;
}

/** Dismissable modal with one ascending bar chart per radar stat, comparing all characters. */
export const UnitStatBarChartsModal = ({ open, onClose, snowprintId, rank, stars }: Props) => {
    const distributions = useMemo(() => (open ? buildAxisDistributions(rank, stars) : undefined), [open, rank, stars]);

    return (
        <PortalDialog open={open} onClose={onClose} aria-label="Stat comparison charts" size="5xl">
            <PortalDialog.Header>Stat comparison (current rank &amp; stars)</PortalDialog.Header>
            <PortalDialog.Body className="pb-6">
                {distributions &&
                    AXIS_ORDER.map(axis => (
                        <AxisBarChart
                            key={axis}
                            title={AXIS_DESCRIPTIONS[axis]}
                            bars={distributions[axis]}
                            highlightId={snowprintId}
                        />
                    ))}
            </PortalDialog.Body>
        </PortalDialog>
    );
};
