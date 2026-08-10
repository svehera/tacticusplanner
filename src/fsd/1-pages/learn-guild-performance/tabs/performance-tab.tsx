/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useEffect, useMemo, useState } from 'react';

import {
    TacticusDamageType,
    type GuildSeasonHistoryResponse,
    type TacticusGuildRaidEntry,
    type TacticusGuildRaidResponse,
} from '@/fsd/5-shared/lib/tacticus-api';
import { Rarity } from '@/fsd/5-shared/model';
import { Segmented, Switch } from '@/fsd/5-shared/ui';
import { RarityIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character/characters.service';
import { unitRoundIconMap } from '@/fsd/4-entities/guild_boss/guild-boss-portraits';

import {
    CaptureButton,
    CardGrid,
    EncounterIcon,
    FilterBar,
    FilterGroup,
    PrefixFilter,
    RarityFilter,
    TableCard,
    TableCardHeader,
} from '../guild-performance.components';
import { captureFileName, useSectionCapture } from '../guild-performance.hook';
import {
    bossIconFor,
    bossPrefixDisplayNames,
    computeDefaultRarities,
    getAvailableBossPrefixes,
    unitDisplayLabel,
} from '../guild-performance.utils';

import {
    buildGuildPerformanceIndexRows,
    buildGuildView,
    buildPlayerBreakdowns,
    buildPlayerView,
    buildPlayerViewFromSummary,
    buildUnitPlayerBuckets,
    filterPerformanceEntries,
    getAvailablePrimeUnitIds,
    type PlayerBossBreakdown,
    type PlayerBossUnit,
    type PlayerRow,
    type UnitPlayerBuckets,
    type UnitRow,
} from './performance-tab.utils';

// ---------------------------------------------------------------------------
// Visuals
// ---------------------------------------------------------------------------

const formatPct = (value: number): string => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const formatNumber = (value: number): string =>
    value.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 1 });

function CenteredBar({ value, maxAbs }: { value: number; maxAbs: number }) {
    const widthPct = maxAbs > 0 ? (Math.abs(value) / maxAbs) * 50 : 0;
    const isPositive = value >= 0;
    return (
        <div className="relative h-3 w-full overflow-hidden rounded-sm bg-(--fg)/12">
            <div className="absolute inset-y-0 left-1/2 w-px bg-(--fg)/35" />
            <div
                className={`absolute inset-y-0 ${isPositive ? 'left-1/2 bg-(--success)' : 'right-1/2 bg-(--danger)'}`}
                style={{ width: `${widthPct}%` }}
            />
        </div>
    );
}

function DistributionRow({
    nonKillHits,
    killHits,
    maxValue,
}: {
    nonKillHits: number[];
    killHits: number[];
    maxValue: number;
}) {
    return (
        <div className="relative h-4 w-full rounded-sm bg-(--fg)/12">
            {nonKillHits.map((hit, index) => (
                <div
                    key={`nk-${index}`}
                    className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--primary) opacity-60"
                    style={{ left: maxValue > 0 ? `${(hit / maxValue) * 100}%` : '0%' }}
                    title={hit.toLocaleString()}
                />
            ))}
            {killHits.map((hit, index) => (
                <div
                    key={`k-${index}`}
                    className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--danger) opacity-60"
                    style={{ left: maxValue > 0 ? `${(hit / maxValue) * 100}%` : '0%' }}
                    title={`${hit.toLocaleString()} (kill)`}
                />
            ))}
        </div>
    );
}

/**
 * Distribution with the guild avg pinned to the visual centre. Symmetric scale:
 * the largest deviation in either direction (avg→0 below, or avg→playerMax above)
 * sets the half-width, so distance from centre is proportional to actual gap.
 */
function CenteredDistributionRow({
    nonKillHits,
    killHits,
    center,
}: {
    nonKillHits: number[];
    killHits: number[];
    center: number;
}) {
    let maxHit = 0;
    for (const hit of nonKillHits) {
        if (hit > maxHit) maxHit = hit;
    }
    for (const hit of killHits) {
        if (hit > maxHit) maxHit = hit;
    }
    const maxDeviation = Math.max(center, maxHit - center);
    const posOf = (value: number): number => {
        if (maxDeviation <= 0) return 50;
        const raw = 50 + ((value - center) / maxDeviation) * 50;
        return Math.max(0, Math.min(100, raw));
    };
    return (
        <div className="relative h-4 w-full rounded-sm bg-(--fg)/12">
            <div
                className="absolute inset-y-0 left-1/2 w-0.5 bg-(--accent)"
                title={`Guild avg: ${center.toLocaleString()}`}
            />
            {nonKillHits.map((hit, index) => (
                <div
                    key={`nk-${index}`}
                    className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--primary) opacity-60"
                    style={{ left: `${posOf(hit)}%` }}
                    title={hit.toLocaleString()}
                />
            ))}
            {killHits.map((hit, index) => (
                <div
                    key={`k-${index}`}
                    className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--danger) opacity-60"
                    style={{ left: `${posOf(hit)}%` }}
                    title={`${hit.toLocaleString()} (kill)`}
                />
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Guild view tables
// ---------------------------------------------------------------------------

type DiffKey = 'avgDiffPct' | 'maxDiffPct' | 'totalDiffPct' | 'performanceDiffPct' | 'equivalentDiffPct';
type ValueKey = 'avg' | 'max' | 'total' | 'performanceIndex' | 'equivalentHits';

/** Dense row: name · bar · signed diff · raw value. */
const DIFF_ROW =
    'grid grid-cols-[118px_1fr_52px_56px] items-center gap-[9px] px-2.5 py-px text-xs even:bg-(--neutral)/50 hover:bg-(--primary)/10';

/**
 * Card header carrying the title, the baseline beside it and the subtitle beneath — all three were
 * previously crammed into an <h2> and a following paragraph.
 *
 * `min-h-14` reserves the subtitle line whether or not there is a subtitle. These cards sit side by
 * side in a `CardGrid`, and only three of the five pass one, so without the reservation two headers
 * were a line shorter than their neighbours and every row in those tables sat higher than the rows
 * beside it. Content stays top-aligned rather than centred, so the titles share a baseline across
 * the row too.
 */
const DiffCardHeader = ({
    title,
    baseline,
    subtitle,
    onCapture,
    isCapturing = false,
}: {
    title: string;
    baseline: string;
    subtitle?: string;
    onCapture?: () => void;
    isCapturing?: boolean;
}) => (
    <div className="min-h-14 border-b border-(--border) bg-(--soft) px-3 py-2">
        {/* The button sits outside the wrapping title row so a long title + baseline can never push
            it onto a line of its own. */}
        <div className="flex items-start gap-2">
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-[13px] font-extrabold text-(--fg)">{title}</span>
                    <span className="text-[11px] text-(--soft-fg)">{baseline}</span>
                </div>
                {subtitle !== undefined && <p className="mt-0.5 text-[11px] text-(--soft-fg)">{subtitle}</p>}
            </div>
            {onCapture !== undefined && <CaptureButton onCapture={onCapture} isCapturing={isCapturing} />}
        </div>
    </div>
);

function PlayerComparisonTable({
    title,
    subtitle,
    baselineLabel,
    rows,
    diffKey,
    valueKey,
    guildValue,
    formatValue,
}: {
    title: string;
    subtitle?: string;
    baselineLabel: string;
    rows: PlayerRow[];
    diffKey: DiffKey;
    valueKey: ValueKey;
    guildValue: number;
    formatValue?: (value: number) => string;
}) {
    const sorted = useMemo(() => rows.toSorted((a, b) => b[diffKey] - a[diffKey]), [rows, diffKey]);
    const maxAbs = useMemo(() => {
        let max = 1;
        for (const row of sorted) {
            const abs = Math.abs(row[diffKey]);
            if (abs > max) max = abs;
        }
        return max;
    }, [sorted, diffKey]);

    // Before the early return: hooks cannot be called conditionally.
    const { ref, onCapture, isCapturing } = useSectionCapture(captureFileName('performance', title));

    if (sorted.length === 0) return <></>;

    const fmt = formatValue ?? formatNumber;
    return (
        <TableCard ref={ref}>
            <DiffCardHeader
                title={title}
                baseline={`${baselineLabel}: ${fmt(guildValue)}`}
                subtitle={subtitle}
                onCapture={onCapture}
                isCapturing={isCapturing}
            />
            <div role="table" aria-label={title} className="flex flex-col py-0.5">
                {sorted.map(row => (
                    <div role="row" key={row.userId} className={DIFF_ROW}>
                        <span role="cell" className="truncate" title={row.displayName}>
                            {row.displayName}
                        </span>
                        {/* The bar is a picture of the percentage printed beside it, so it is not a
                            cell of its own. */}
                        <span aria-hidden="true">
                            <CenteredBar value={row[diffKey]} maxAbs={maxAbs} />
                        </span>
                        <span
                            role="cell"
                            className={`text-right tabular-nums ${
                                row[diffKey] >= 0 ? 'text-(--success)' : 'text-(--danger)'
                            }`}>
                            {formatPct(row[diffKey])}
                        </span>
                        <span role="cell" className="text-right text-(--soft-fg) tabular-nums">
                            {fmt(row[valueKey])}
                        </span>
                    </div>
                ))}
            </div>
        </TableCard>
    );
}

function PlayerMaxVsGuildTable({ title, rows, guildMax }: { title: string; rows: PlayerRow[]; guildMax: number }) {
    const sorted = useMemo(() => rows.toSorted((a, b) => b.max - a.max), [rows]);
    const { ref, onCapture, isCapturing } = useSectionCapture(captureFileName('performance', title));

    if (sorted.length === 0) return <></>;
    return (
        <TableCard ref={ref}>
            <DiffCardHeader
                title={title}
                baseline={`Guild max: ${formatNumber(guildMax)}`}
                onCapture={onCapture}
                isCapturing={isCapturing}
            />
            <div className="flex flex-col py-0.5">
                {sorted.map(row => {
                    const widthPct = guildMax > 0 ? (row.max / guildMax) * 100 : 0;
                    return (
                        <div key={row.userId} className={DIFF_ROW}>
                            <span className="truncate" title={row.displayName}>
                                {row.displayName}
                            </span>
                            <div className="relative h-3 w-full overflow-hidden rounded-sm bg-(--fg)/12">
                                <div
                                    className="absolute inset-y-0 left-0 bg-(--primary)"
                                    style={{ width: `${widthPct}%` }}
                                />
                            </div>
                            {/* A proportion of the guild best, not a diff — so it stays muted
                                rather than picking up the green/red of the diff tables. */}
                            <span className="text-right text-(--soft-fg) tabular-nums">{widthPct.toFixed(0)}%</span>
                            <span className="text-right text-(--soft-fg) tabular-nums">{formatNumber(row.max)}</span>
                        </div>
                    );
                })}
            </div>
        </TableCard>
    );
}

function bgForUnit(unit: PlayerBossUnit): string {
    if (unit.hits === 0) return 'bg-(--fg)/25';
    if (unit.ratio >= 1.2) return 'bg-(--success)';
    if (unit.ratio >= 0.8) return 'bg-(--warning)';
    return 'bg-(--danger)';
}

function BreakdownUnitChip({ unit }: { unit: PlayerBossUnit }) {
    const label = `${unit.isBoss ? 'Boss' : 'Prime'} ${Rarity[unit.rarity]}`;
    const detail =
        unit.hits === 0
            ? 'no hits'
            : `player ${formatNumber(unit.playerAvg)} vs guild ${formatNumber(unit.guildAvg)} (${(unit.ratio * 100).toFixed(0)}%)`;

    // One tooltip, not two. The chip used to carry a native `title` while the portrait inside it
    // rendered its own MUI tooltip, so a hover fired both. The rich text wins and absorbs the unit
    // name the portrait's tooltip was supplying.
    return (
        <span className={`inline-flex shrink-0 rounded-full p-0.5 ${bgForUnit(unit)}`}>
            <span className="inline-flex rounded-full bg-(--card) p-0.5">
                <EncounterIcon
                    unitId={unit.unitId}
                    size={20}
                    tooltip={`${unitDisplayLabel(unit.unitId)} — ${label}, ${detail}`}
                />
            </span>
        </span>
    );
}

/** 0 = green (≥ guild avg +20%), 1 = amber (within ±20%), 2 = red (< −20%). */
function efficiencyCategory(unit: PlayerBossUnit): number {
    if (unit.ratio >= 1.2) return 0;
    if (unit.ratio >= 0.8) return 1;
    return 2;
}

type BreakdownMode = 'efficiency' | 'encounter' | 'per-unit';

const BREAKDOWN_MODES: Array<{ value: BreakdownMode; label: string }> = [
    { value: 'efficiency', label: 'By token efficiency' },
    { value: 'encounter', label: 'By encounter order' },
    { value: 'per-unit', label: 'Per boss/prime' },
];

/** What each mode sorts by, shown once in the card header instead of per-mode paragraphs. */
const BREAKDOWN_HINTS: Record<BreakdownMode, string> = {
    efficiency: 'Green first, then amber, then red. Unhit units hidden.',
    encounter: 'Ascending rarity/set. Within a set: left prime → right prime → boss. Grey = no hits.',
    'per-unit': 'One row per boss/prime, descending rarity/set.',
};

function PlayerRowEfficiency({ breakdown }: { breakdown: PlayerBossBreakdown }) {
    const units = breakdown.units
        .filter(unit => unit.hits > 0)
        .toSorted((a, b) => {
            const categoryA = efficiencyCategory(a);
            const categoryB = efficiencyCategory(b);
            if (categoryA !== categoryB) return categoryA - categoryB;
            return b.ratio - a.ratio;
        });
    if (units.length === 0) return <></>;
    return (
        <div className="grid grid-cols-[8rem_1fr] items-center gap-2 px-2.5 py-0.5 text-xs even:bg-(--neutral)/50 hover:bg-(--primary)/10">
            <span className="truncate" title={breakdown.displayName}>
                {breakdown.displayName}
            </span>
            <div className="flex flex-wrap gap-1">
                {units.map(unit => (
                    <BreakdownUnitChip key={unit.unitKey} unit={unit} />
                ))}
            </div>
        </div>
    );
}

function PlayerRowEncounter({ breakdown }: { breakdown: PlayerBossBreakdown }) {
    // Ascending (rarity, set); within a set: left prime → right prime → boss.
    const units = breakdown.units.toSorted((a, b) => {
        if (a.rarity !== b.rarity) return a.rarity - b.rarity;
        if (a.set !== b.set) return a.set - b.set;
        // boss (encounterIndex 0) sorts after primes within the same set
        const ai = a.encounterIndex === 0 ? Number.POSITIVE_INFINITY : a.encounterIndex;
        const bi = b.encounterIndex === 0 ? Number.POSITIVE_INFINITY : b.encounterIndex;
        return ai - bi;
    });
    return (
        <div className="grid grid-cols-[8rem_1fr] items-center gap-2 px-2.5 py-0.5 text-xs even:bg-(--neutral)/50 hover:bg-(--primary)/10">
            <span className="truncate" title={breakdown.displayName}>
                {breakdown.displayName}
            </span>
            <div className="flex flex-wrap gap-1">
                {units.map(unit => (
                    <BreakdownUnitChip key={unit.unitKey} unit={unit} />
                ))}
            </div>
        </div>
    );
}

function PlayerNameList({
    players,
    colorClass,
}: {
    players: { userId: string; displayName: string; ratio: number }[];
    colorClass: string;
}) {
    if (players.length === 0) return <span className="text-(--soft-fg)">—</span>;
    return (
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            {players.map(player => (
                <span
                    key={player.userId}
                    className={colorClass}
                    title={`${(player.ratio * 100).toFixed(0)}% of guild avg`}>
                    {player.displayName}
                </span>
            ))}
        </div>
    );
}

function PerUnitRow({ bucket }: { bucket: UnitPlayerBuckets }) {
    return (
        <div className="grid grid-cols-[8rem_1fr_1fr_1fr] items-start gap-2 px-2.5 py-1 text-xs even:bg-(--neutral)/50 hover:bg-(--primary)/10">
            <span className="flex items-center gap-1.5">
                <EncounterIcon unitId={bucket.unitId} size={22} />
                <RarityIcon rarity={bucket.rarity} />
                <span className="text-(--soft-fg)">{bucket.isBoss ? 'Boss' : 'Prime'}</span>
            </span>
            <PlayerNameList players={bucket.greenPlayers} colorClass="text-(--success)" />
            <PlayerNameList players={bucket.yellowPlayers} colorClass="text-(--warning)" />
            <PlayerNameList players={bucket.redPlayers} colorClass="text-(--danger)" />
        </div>
    );
}

function PlayerBossBreakdownTable({
    breakdowns,
    buckets,
    mode,
    onModeChange,
}: {
    breakdowns: PlayerBossBreakdown[];
    buckets: UnitPlayerBuckets[];
    mode: BreakdownMode;
    onModeChange: (m: BreakdownMode) => void;
}) {
    const { ref, onCapture, isCapturing } = useSectionCapture(captureFileName('performance', 'boss-breakdown'));

    if (breakdowns.length === 0) return <></>;
    return (
        <TableCard ref={ref}>
            <TableCardHeader>
                <span className="text-[13px] font-extrabold text-(--fg)">Per-player boss breakdown</span>
                {/* One colour-band note, in the header — it was previously repeated verbatim in all
                    three mode branches. */}
                <span className="text-[11px] text-(--soft-fg)">
                    <span className="font-semibold text-(--success)">Green</span> ≥ +20% of guild avg ·{' '}
                    <span className="font-semibold text-(--warning)">Amber</span> within ±20% ·{' '}
                    <span className="font-semibold text-(--danger)">Red</span> &lt; −20%
                </span>
                <div className="ml-auto flex items-center gap-2">
                    <Segmented<BreakdownMode>
                        label="Breakdown"
                        value={mode}
                        onChange={onModeChange}
                        options={BREAKDOWN_MODES}
                    />
                    <CaptureButton onCapture={onCapture} isCapturing={isCapturing} />
                </div>
            </TableCardHeader>
            <div className="flex flex-col gap-1 px-3 py-2">
                <p className="text-[11px] text-(--soft-fg)">{BREAKDOWN_HINTS[mode]}</p>
                {mode === 'efficiency' &&
                    breakdowns.map(breakdown => <PlayerRowEfficiency key={breakdown.userId} breakdown={breakdown} />)}
                {mode === 'encounter' &&
                    breakdowns.map(breakdown => <PlayerRowEncounter key={breakdown.userId} breakdown={breakdown} />)}
                {mode === 'per-unit' && (
                    <>
                        <div className="grid grid-cols-[8rem_1fr_1fr_1fr] gap-2 px-2.5 text-xs font-bold tracking-widest text-(--soft-fg) uppercase">
                            <span>Unit</span>
                            <span className="text-(--success)">≥ +20%</span>
                            <span className="text-(--warning)">±20%</span>
                            <span className="text-(--danger)">&lt; −20%</span>
                        </div>
                        {buckets.map(bucket => (
                            <PerUnitRow key={bucket.unitKey} bucket={bucket} />
                        ))}
                    </>
                )}
            </div>
        </TableCard>
    );
}

// ---------------------------------------------------------------------------
// Player view tables
// ---------------------------------------------------------------------------

function UnitLabel({ row }: { row: UnitRow }) {
    return (
        <span className="flex min-w-0 items-center gap-1.5">
            <EncounterIcon unitId={row.unitId} size={20} />
            <RarityIcon rarity={row.rarity} />
            <span
                className="truncate text-(--soft-fg)"
                title={bossPrefixDisplayNames[row.bossPrefix] ?? row.bossPrefix}>
                {row.isBoss ? '' : '↳ '}
                {bossPrefixDisplayNames[row.bossPrefix] ?? row.bossPrefix}
            </span>
        </span>
    );
}

function UnitComparisonTable({
    title,
    rows,
    diffKey,
    valueKey,
}: {
    title: string;
    rows: UnitRow[];
    diffKey: 'avgDiffPct' | 'maxDiffPct';
    valueKey: 'avg' | 'max';
}) {
    const maxAbs = useMemo(() => {
        let max = 1;
        for (const row of rows) {
            const abs = Math.abs(row[diffKey]);
            if (abs > max) max = abs;
        }
        return max;
    }, [rows, diffKey]);

    if (rows.length === 0) return <></>;

    return (
        <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">{title}</h2>
            <div className="flex flex-col gap-0.5">
                {rows.map(row => (
                    <div key={row.unitKey} className="grid grid-cols-[10rem_1fr_4rem_4rem] items-center gap-2 text-xs">
                        <UnitLabel row={row} />
                        <CenteredBar value={row[diffKey]} maxAbs={maxAbs} />
                        <span
                            className={`text-right tabular-nums ${
                                row[diffKey] >= 0 ? 'text-(--success)' : 'text-(--danger)'
                            }`}>
                            {formatPct(row[diffKey])}
                        </span>
                        <span className="text-right text-(--soft-fg) tabular-nums">{formatNumber(row[valueKey])}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

function UnitMaxVsGuildTable({ title, rows }: { title: string; rows: UnitRow[] }) {
    if (rows.length === 0) return <></>;
    return (
        <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">{title}</h2>
            <div className="flex flex-col gap-0.5">
                {rows.map(row => {
                    const widthPct = row.guildMax > 0 ? (row.max / row.guildMax) * 100 : 0;
                    return (
                        <div
                            key={row.unitKey}
                            className="grid grid-cols-[10rem_1fr_4rem_4rem] items-center gap-2 text-xs">
                            <UnitLabel row={row} />
                            <div className="relative h-3 w-full overflow-hidden rounded-sm bg-(--fg)/12">
                                <div
                                    className="absolute inset-y-0 left-0 bg-(--primary)"
                                    style={{ width: `${widthPct}%` }}
                                />
                            </div>
                            <span className="text-right text-(--soft-fg) tabular-nums">{widthPct.toFixed(0)}%</span>
                            <span className="text-right text-(--soft-fg) tabular-nums">{formatNumber(row.max)}</span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function UnitDistributionTable({ rows }: { rows: UnitRow[] }) {
    if (rows.length === 0) return <></>;
    return (
        <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">Hit distribution (per row: 0 → guild max for that boss)</h2>
            <div className="flex flex-col gap-0.5">
                {rows.map(row => (
                    <div
                        key={row.unitKey}
                        className="grid grid-cols-[10rem_3.5rem_1fr_3rem] items-center gap-2 text-xs">
                        <UnitLabel row={row} />
                        <span className="text-right text-(--soft-fg) tabular-nums">{formatNumber(row.guildMax)}</span>
                        <DistributionRow
                            nonKillHits={row.playerNonKillHits}
                            killHits={row.playerKillHits}
                            maxValue={row.guildMax}
                        />
                        <span className="text-right text-(--soft-fg) tabular-nums">
                            {row.playerNonKillHits.length + row.playerKillHits.length}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}

function UnitDistributionVsAvgTable({ rows }: { rows: UnitRow[] }) {
    if (rows.length === 0) return <></>;
    return (
        <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">
                Hit distribution vs guild average{' '}
                <span className="text-xs font-normal text-(--soft-fg)">(amber line = guild avg, centred)</span>
            </h2>
            <div className="flex flex-col gap-0.5">
                {rows.map(row => (
                    <div
                        key={row.unitKey}
                        className="grid grid-cols-[10rem_3.5rem_1fr_3rem] items-center gap-2 text-xs">
                        <UnitLabel row={row} />
                        <span className="text-right text-(--soft-fg) tabular-nums">{formatNumber(row.guildAvg)}</span>
                        <CenteredDistributionRow
                            nonKillHits={row.playerNonKillHits}
                            killHits={row.playerKillHits}
                            center={row.guildAvg}
                        />
                        <span className="text-right text-(--soft-fg) tabular-nums">
                            {row.playerNonKillHits.length + row.playerKillHits.length}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// PerformanceTab
// ---------------------------------------------------------------------------

export const PerformanceTab = ({
    currentData,
    seasonHistory,
    names,
    selectedSeason,
    selectedPlayerId,
}: {
    currentData: TacticusGuildRaidResponse | undefined;
    seasonHistory?: GuildSeasonHistoryResponse;
    names: Map<string, string>;
    /** Page-level sticky season selection. */
    selectedSeason: number | undefined;
    /** Page-level sticky player selection. */
    selectedPlayerId: string | undefined;
}) => {
    // A historical season currently supports only the full-guild Performance Index (reconstructed
    // from the aggregate); the live season keeps the full per-hit tables and filters.
    const historySummary = useMemo(
        () =>
            selectedSeason === currentData?.season
                ? undefined
                : seasonHistory?.seasonData.find(entry => entry.season === selectedSeason)?.summary,
        [selectedSeason, currentData, seasonHistory]
    );
    const isHistorical = historySummary !== undefined;

    const allSeasonEntries: TacticusGuildRaidEntry[] = useMemo(
        () => (isHistorical ? [] : (currentData?.entries ?? [])),
        [isHistorical, currentData]
    );

    const historyPerformanceRows = useMemo(
        () => (historySummary ? buildGuildPerformanceIndexRows(historySummary, names) : []),
        [historySummary, names]
    );

    // --- rarity (default = highest present) ---
    const defaultRarities = useMemo(() => computeDefaultRarities(allSeasonEntries), [allSeasonEntries]);
    const [rarityOverride, setRarityOverride] = useState<Rarity[] | undefined>();
    const selectedRarities = rarityOverride ?? defaultRarities;
    const selectedRaritiesSet = useMemo(() => new Set(selectedRarities), [selectedRarities]);

    // --- bosses (default = all available, selected) and primes (default = none selected) ---
    const availableBossPrefixes = useMemo(
        () => getAvailableBossPrefixes(allSeasonEntries, selectedRaritiesSet),
        [allSeasonEntries, selectedRaritiesSet]
    );
    const availablePrimeUnitIds = useMemo(
        () => getAvailablePrimeUnitIds(allSeasonEntries, selectedRaritiesSet),
        [allSeasonEntries, selectedRaritiesSet]
    );
    const [selectedBossPrefixes, setSelectedBossPrefixes] = useState<string[] | undefined>();
    const [selectedPrimeUnitIds, setSelectedPrimeUnitIds] = useState<string[] | undefined>();
    const effectiveBossPrefixes = selectedBossPrefixes ?? availableBossPrefixes;
    const effectivePrimeUnitIds = useMemo(() => selectedPrimeUnitIds ?? [], [selectedPrimeUnitIds]);

    // --- exclude kills ---
    const [excludeKills, setExcludeKills] = useState(true);

    const historyPlayerView = useMemo(
        () =>
            historySummary && selectedPlayerId !== undefined
                ? buildPlayerViewFromSummary(historySummary, selectedPlayerId, excludeKills)
                : [],
        [historySummary, selectedPlayerId, excludeKills]
    );

    // Reset the live-season filters when the page-level season changes.
    useEffect(() => {
        setRarityOverride(undefined);
        setSelectedBossPrefixes(undefined);
        setSelectedPrimeUnitIds(undefined);
    }, [selectedSeason]);

    const handleRarityChange = (rarities: Rarity[]) => {
        setRarityOverride(rarities);
        setSelectedBossPrefixes(undefined);
        setSelectedPrimeUnitIds(undefined);
    };

    // --- filtered dataset (always kill-inclusive; excludeKills is applied per-stat in the view builders) ---
    const filteredEntries = useMemo(
        () =>
            filterPerformanceEntries(allSeasonEntries, {
                selectedRarities: selectedRaritiesSet,
                selectedBossPrefixes: new Set(effectiveBossPrefixes),
                selectedPrimeUnitIds: new Set(effectivePrimeUnitIds),
            }),
        [allSeasonEntries, selectedRaritiesSet, effectiveBossPrefixes, effectivePrimeUnitIds]
    );

    // Breakdown ignores boss/prime selection — only rarity + bombs + excludeKills filter applies.
    const breakdownEntries = useMemo(
        () =>
            allSeasonEntries.filter(entry => {
                if (entry.damageType === TacticusDamageType.Bomb) return false;
                if (!selectedRaritiesSet.has(entry.rarity)) return false;
                if (excludeKills && entry.remainingHp === 0) return false;
                return true;
            }),
        [allSeasonEntries, selectedRaritiesSet, excludeKills]
    );

    // --- view data ---
    const guildView = useMemo(
        () => buildGuildView(filteredEntries, names, excludeKills),
        [filteredEntries, names, excludeKills]
    );
    const playerView = useMemo(
        () => (selectedPlayerId === undefined ? [] : buildPlayerView(filteredEntries, selectedPlayerId, excludeKills)),
        [filteredEntries, selectedPlayerId, excludeKills]
    );
    const playerBreakdowns = useMemo(() => buildPlayerBreakdowns(breakdownEntries, names), [breakdownEntries, names]);
    const unitPlayerBuckets = useMemo(() => buildUnitPlayerBuckets(playerBreakdowns), [playerBreakdowns]);
    const [breakdownMode, setBreakdownMode] = useState<BreakdownMode>('efficiency');

    /** A prime's own name — `unitDisplayLabel` resolves the prime before the boss family, so the
     *  mapped-icon path no longer labels every prime with its boss's name. */
    const primeIconFor = (unitId: string) => {
        const name = unitDisplayLabel(unitId);
        const direct = unitRoundIconMap[unitId];
        if (direct !== undefined) return { icon: direct, name };
        const match = /(?:MiniBoss|Minion)\d+(.+)/.exec(unitId);
        if (match) {
            const id = match[1].charAt(0).toLowerCase() + match[1].slice(1);
            const character = CharactersService.getUnit(id);
            if (character?.roundIcon !== undefined && character.roundIcon !== '') {
                return { icon: character.roundIcon, name };
            }
        }
        return { icon: undefined, name };
    };

    if (currentData === undefined && seasonHistory === undefined) {
        return <p className="text-sm text-(--soft-fg)">Loading…</p>;
    }

    if (isHistorical) {
        // Rarity/Boss/Prime filters need per-hit data, so they're live-only. Historical supports the
        // full-guild Performance Index (no player) and the four per-player graphs (player selected).
        return (
            <div className="flex flex-col gap-3.5">
                {selectedPlayerId !== undefined && (
                    <FilterBar>
                        <FilterGroup label="Exclude kills">
                            <Switch isSelected={excludeKills} onChange={setExcludeKills} />
                        </FilterGroup>
                    </FilterBar>
                )}
                {selectedPlayerId === undefined ? (
                    historyPerformanceRows.length === 0 ? (
                        <div className="flex items-center justify-center rounded-xl border border-(--border) bg-(--soft) py-12 text-sm text-(--soft-fg)">
                            No boss performance recorded for this season.
                        </div>
                    ) : (
                        <PlayerComparisonTable
                            title="Performance Index"
                            subtitle="Weighted average hit/token vs guild avg/token. Bosses only, excluding kills."
                            baselineLabel="Baseline"
                            rows={historyPerformanceRows}
                            diffKey="performanceDiffPct"
                            valueKey="performanceIndex"
                            guildValue={1}
                            formatValue={value => value.toFixed(2)}
                        />
                    )
                ) : historyPlayerView.length === 0 ? (
                    <div className="flex items-center justify-center rounded-xl border border-(--border) bg-(--soft) py-12 text-sm text-(--soft-fg)">
                        No boss/prime data recorded for this player this season.
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <UnitComparisonTable
                            title="Average damage vs guild (per boss/prime)"
                            rows={historyPlayerView}
                            diffKey="avgDiffPct"
                            valueKey="avg"
                        />
                        <UnitMaxVsGuildTable
                            title="Max damage (% of guild max per boss/prime)"
                            rows={historyPlayerView}
                        />
                        <UnitDistributionTable rows={historyPlayerView} />
                        <UnitDistributionVsAvgTable rows={historyPlayerView} />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <FilterBar>
                <RarityFilter selected={selectedRarities} onChange={handleRarityChange} />
                <PrefixFilter
                    label="Bosses"
                    available={availableBossPrefixes}
                    selected={effectiveBossPrefixes}
                    onChange={setSelectedBossPrefixes}
                    iconFor={bossIconFor}
                    allowEmpty
                />
                <PrefixFilter
                    label="Primes"
                    available={availablePrimeUnitIds}
                    selected={effectivePrimeUnitIds}
                    onChange={setSelectedPrimeUnitIds}
                    iconFor={primeIconFor}
                    allowEmpty
                />
                <FilterGroup label="Exclude kills">
                    <Switch isSelected={excludeKills} onChange={setExcludeKills} />
                </FilterGroup>
                <span className="ml-auto text-xs text-(--soft-fg)">
                    {guildView.rows.length} players · {guildView.totalHits} non-kill hits
                </span>
            </FilterBar>

            {filteredEntries.length === 0 ? (
                <div className="flex items-center justify-center rounded-xl border border-(--border) bg-(--soft) py-12 text-sm text-(--soft-fg)">
                    No entries match the current filters.
                </div>
            ) : selectedPlayerId === undefined ? (
                <div className="flex flex-col gap-3.5">
                    {/* Two-up so Performance Index and Average damage are comparable without
                        scrolling — these five were previously five full screens in one column. */}
                    <CardGrid min={430} gap="gap-3.5">
                        <PlayerComparisonTable
                            title="Performance Index"
                            subtitle="Weighted average hit/token vs guild avg/token."
                            baselineLabel="Baseline"
                            rows={guildView.rows}
                            diffKey="performanceDiffPct"
                            valueKey="performanceIndex"
                            guildValue={1}
                            formatValue={value => value.toFixed(2)}
                        />
                        <PlayerComparisonTable
                            title="Average damage vs guild"
                            baselineLabel="Guild avg"
                            rows={guildView.rows}
                            diffKey="avgDiffPct"
                            valueKey="avg"
                            guildValue={guildView.guildAvg}
                        />
                        <PlayerComparisonTable
                            title="Total damage vs fair share"
                            subtitle="Raw total damage normalized by per-player fair share."
                            baselineLabel={`Fair share (guild ${formatNumber(guildView.guildTotal)})`}
                            rows={guildView.rows}
                            diffKey="totalDiffPct"
                            valueKey="total"
                            guildValue={guildView.fairShare}
                        />
                        <PlayerComparisonTable
                            title="Equivalent guild-average hits"
                            subtitle="Weighted total contribution."
                            baselineLabel={`Fair share (${guildView.totalHits} hits)`}
                            rows={guildView.rows}
                            diffKey="equivalentDiffPct"
                            valueKey="equivalentHits"
                            guildValue={guildView.fairShareHits}
                            formatValue={value => value.toFixed(1)}
                        />
                        <PlayerMaxVsGuildTable
                            title="Max damage (% of guild max)"
                            rows={guildView.rows}
                            guildMax={guildView.guildMax}
                        />
                    </CardGrid>
                    {/* Full width: the chip rows are wide and the per-unit mode has four columns. */}
                    <PlayerBossBreakdownTable
                        breakdowns={playerBreakdowns}
                        buckets={unitPlayerBuckets}
                        mode={breakdownMode}
                        onModeChange={setBreakdownMode}
                    />
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <UnitComparisonTable
                        title="Average damage vs guild (per boss/prime)"
                        rows={playerView}
                        diffKey="avgDiffPct"
                        valueKey="avg"
                    />
                    <UnitMaxVsGuildTable title="Max damage (% of guild max per boss/prime)" rows={playerView} />
                    <UnitDistributionTable rows={playerView} />
                    <UnitDistributionVsAvgTable rows={playerView} />
                </div>
            )}
        </div>
    );
};
