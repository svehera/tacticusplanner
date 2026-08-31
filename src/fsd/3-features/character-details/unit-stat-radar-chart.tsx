import { Copy } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { useRef } from 'react';

import { tacticusIcons } from '@/fsd/5-shared/ui/icons';
import { AccessibleTooltip } from '@/fsd/5-shared/ui/tooltip';

import { buildRadarStats, RadarAxisId } from './unit-stat-radar.utils';

/** CSS custom properties the chart's inline styles reference — resolved to concrete values before
 *  copying, since `var(--token)` only means anything inside this page's own cascade. */
const CSS_VARS_USED = ['--border', '--fg-muted', '--primary', '--overlay', '--soft-fg'];

interface AxisSpec {
    id: RadarAxisId;
    /** Icon drawn on the chart in place of a text label. */
    icon: keyof typeof tacticusIcons;
    /** Plain-text glyph drawn next to the icon, for the vs-0/vs-infinite-armor axes. */
    symbol?: '0' | '∞';
    /** Full description, used in the hover tooltip and the table fallback below the chart. */
    description: string;
    /** Compass angle, clockwise from north (0deg). */
    angleDeg: number;
}

/** N/NE/SE/S/SW/NW, 60deg apart — a pointy-top hexagon, matching the requested axis layout. */
const AXES: AxisSpec[] = [
    { id: 'health', icon: 'health', description: 'Health', angleDeg: 0 },
    { id: 'armor', icon: 'armour', description: 'Armor', angleDeg: 60 },
    {
        id: 'meleeVsInfArmor',
        icon: 'statMeleeAttack',
        symbol: '∞',
        description: 'Melee damage vs infinite armor',
        angleDeg: 120,
    },
    {
        id: 'meleeVsZeroArmor',
        icon: 'statMeleeAttack',
        symbol: '0',
        description: 'Melee damage vs 0 armor',
        angleDeg: 180,
    },
    {
        id: 'rangedVsInfArmor',
        icon: 'statRangedAttack',
        symbol: '∞',
        description: 'Ranged damage vs infinite armor',
        angleDeg: 240,
    },
    {
        id: 'rangedVsZeroArmor',
        icon: 'statRangedAttack',
        symbol: '0',
        description: 'Ranged damage vs 0 armor',
        angleDeg: 300,
    },
];

const GRID_LEVELS = [0.2, 0.4, 0.6, 0.8, 1];

// Generous margin between MAX_RADIUS and the viewBox edge: axis labels (an icon, optionally
// followed by a "0"/"∞" glyph) are anchored at their axis point and grow outward/sideways from it,
// so the viewBox needs enough room on every side to fit the widest label at any angle, not just the
// chart's own geometry.
const SIZE = 380;
const CENTER = SIZE / 2;
const MAX_RADIUS = 95;
const LABEL_RADIUS = MAX_RADIUS + 25;
/** North-axis tick numbers (20/40/.../100) sit just to the right of the axis line, inside the hexagon. */
const TICK_LABEL_OFFSET_X = 6;

/** Axis-label icon size, and the gap between the icon and its "0"/"∞" symbol, when present. */
const LABEL_ICON_SIZE = 16;
const LABEL_ICON_GAP = 3;
/** A single "0"/"∞" glyph at the label font size — SVG text has no layout engine, so this is a
 *  fixed estimate rather than a measured width. */
const LABEL_SYMBOL_WIDTH = 8;

/** Point on the hexagon at `angleDeg` (compass, 0deg = north), `radiusFraction` of the way out. */
function toPoint(angleDeg: number, radiusFraction: number, radius: number = MAX_RADIUS) {
    const rad = ((angleDeg - 90) * Math.PI) / 180; // -90 so 0deg (north) points straight up
    return { x: CENTER + Math.cos(rad) * radiusFraction * radius, y: CENTER + Math.sin(rad) * radiusFraction * radius };
}

function polygonPoints(radiusFraction: number, radius?: number): string {
    return AXES.map(axis => {
        const { x, y } = toPoint(axis.angleDeg, radiusFraction, radius);
        return `${x},${y}`;
    }).join(' ');
}

/** `start`/`end`/`middle` text-anchor per which side of the hexagon a label sits on. */
function anchorFor(angleDeg: number): 'start' | 'middle' | 'end' {
    if (angleDeg === 0 || angleDeg === 180) return 'middle';
    return angleDeg > 0 && angleDeg < 180 ? 'start' : 'end';
}

/**
 * Lays out an axis label's icon (and optional "0"/"∞" symbol next to it) around `(x, y)`, growing
 * in whichever direction keeps the group's leading/trailing edge pinned to `(x, y)` — the same edge
 * the plain-text label it replaces used to grow from.
 */
function axisLabelLayout(axis: AxisSpec, x: number, y: number) {
    const anchor = anchorFor(axis.angleDeg);
    const groupWidth = LABEL_ICON_SIZE + (axis.symbol ? LABEL_ICON_GAP + LABEL_SYMBOL_WIDTH : 0);
    const iconX = anchor === 'start' ? x : anchor === 'end' ? x - groupWidth : x - groupWidth / 2;
    return {
        iconX,
        iconY: y - LABEL_ICON_SIZE / 2,
        symbolX: iconX + LABEL_ICON_SIZE + LABEL_ICON_GAP,
        symbolY: y,
    };
}

interface Props {
    /** The character's snowprintId. Nothing renders if it doesn't resolve to a known character. */
    snowprintId: string;
}

/**
 * Serializes `svg` to standalone markup and writes it to the clipboard as text, so it pastes as
 * real vector SVG (into GIMP, Docs, an editor, Illustrator, ...) rather than a screenshot.
 *
 * The chart's inline styles use `var(--token)`, which only resolves inside this page's own CSS
 * cascade — copied in isolation it would render unstyled, so each var is resolved to its current
 * computed value (respecting light/dark mode) and substituted into the serialized string.
 */
async function copySvgMarkup(svg: SVGSVGElement | null): Promise<boolean> {
    if (!svg) return false;
    try {
        const clone = svg.cloneNode(true) as SVGSVGElement;
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        const rootStyle = getComputedStyle(document.documentElement);
        let markup = new XMLSerializer().serializeToString(clone);
        for (const cssVariable of CSS_VARS_USED) {
            const resolved = rootStyle.getPropertyValue(cssVariable).trim();
            markup = markup.replaceAll(`var(${cssVariable})`, resolved);
        }

        await navigator.clipboard.writeText(markup);
        return true;
    } catch {
        return false;
    }
}

/**
 * Hexagonal radar chart: this character's percentile, across every character in the game, on
 * Health/Armor/Melee/Ranged damage (each damage axis split into vs-0-armor and vs-infinite-armor).
 * See {@link buildRadarStats} for how the percentiles are computed.
 */
export const UnitStatRadarChart = ({ snowprintId }: Props) => {
    const svgReference = useRef<SVGSVGElement>(null);

    const stats = buildRadarStats(snowprintId);
    if (!stats) return;

    const byAxis = new Map(stats.map(stat => [stat.axis, stat]));
    const dataPoints = AXES.map(axis => {
        const stat = byAxis.get(axis.id);
        const point = toPoint(axis.angleDeg, (stat?.percentile ?? 0) / 100);
        return { axis, stat, point };
    });

    const handleCopy = () => {
        void copySvgMarkup(svgReference.current).then(succeeded => {
            if (succeeded) enqueueSnackbar('SVG copied', { variant: 'success' });
            else enqueueSnackbar('Could not copy the chart', { variant: 'error' });
        });
    };

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative w-full max-w-[280px]">
                <button
                    type="button"
                    title="Copy this chart as SVG"
                    aria-label="Copy this chart as SVG"
                    onClick={handleCopy}
                    className="absolute top-0 right-0 z-10 cursor-pointer rounded-md border border-(--border) p-1 text-(--soft-fg) transition-colors hover:border-(--primary)/50 hover:bg-(--primary)/10 hover:text-(--primary)">
                    <Copy className="size-3.5" />
                </button>
                <svg
                    ref={svgReference}
                    viewBox={`0 0 ${SIZE} ${SIZE}`}
                    width={SIZE}
                    height={SIZE}
                    className="h-auto w-full"
                    role="img"
                    aria-label="Stat percentiles">
                    {GRID_LEVELS.map(level => (
                        <polygon
                            key={level}
                            points={polygonPoints(level)}
                            vectorEffect="non-scaling-stroke"
                            style={{
                                fill: 'none',
                                stroke: 'var(--fg-muted)',
                                strokeWidth: 1.5,
                                strokeDasharray: level === 1 ? undefined : '4 3',
                            }}
                        />
                    ))}

                    {AXES.map(axis => {
                        const { x, y } = toPoint(axis.angleDeg, 1);
                        return (
                            <line
                                key={axis.id}
                                x1={CENTER}
                                y1={CENTER}
                                x2={x}
                                y2={y}
                                vectorEffect="non-scaling-stroke"
                                style={{ stroke: 'var(--fg-muted)', strokeWidth: 1.5 }}
                            />
                        );
                    })}

                    {/* Scale reference on the north axis only — one axis is enough to read percentages off the rings. */}
                    {GRID_LEVELS.map(level => {
                        const { x, y } = toPoint(0, level);
                        return (
                            <text
                                key={level}
                                x={x + TICK_LABEL_OFFSET_X}
                                y={y}
                                textAnchor="start"
                                dominantBaseline="middle"
                                style={{ fill: 'var(--fg-muted)', fontSize: 9 }}>
                                {level * 100}
                            </text>
                        );
                    })}

                    <polygon
                        points={dataPoints.map(({ point }) => `${point.x},${point.y}`).join(' ')}
                        style={{ fill: 'var(--primary)', fillOpacity: 0.25, stroke: 'var(--primary)', strokeWidth: 2 }}
                    />

                    {dataPoints.map(({ axis, stat, point }) => (
                        <AccessibleTooltip
                            key={axis.id}
                            title={
                                stat
                                    ? `${axis.description}: ${Math.round(stat.percentile)}th percentile (${stat.value.toLocaleString()})`
                                    : axis.description
                            }>
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r={4}
                                style={{ fill: 'var(--primary)', stroke: 'var(--overlay)', strokeWidth: 1.5 }}
                            />
                        </AccessibleTooltip>
                    ))}

                    {AXES.map(axis => {
                        const { x, y } = toPoint(axis.angleDeg, 1, LABEL_RADIUS);
                        const { iconX, iconY, symbolX, symbolY } = axisLabelLayout(axis, x, y);
                        const icon = tacticusIcons[axis.icon];
                        return (
                            <g key={axis.id}>
                                <image
                                    href={icon.file}
                                    x={iconX}
                                    y={iconY}
                                    width={LABEL_ICON_SIZE}
                                    height={LABEL_ICON_SIZE}
                                    aria-label={icon.label}
                                />
                                {axis.symbol && (
                                    <text
                                        x={symbolX}
                                        y={symbolY}
                                        textAnchor="start"
                                        dominantBaseline="middle"
                                        style={{ fill: 'var(--soft-fg)', fontSize: 11 }}>
                                        {axis.symbol}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-(--soft-fg)">
                {stats.map(stat => {
                    const axis = AXES.find(candidate => candidate.id === stat.axis);
                    return (
                        <span key={stat.axis}>
                            {axis?.description}: <span className="text-(--fg)">{Math.round(stat.percentile)}%</span>
                        </span>
                    );
                })}
            </div>
        </div>
    );
};
