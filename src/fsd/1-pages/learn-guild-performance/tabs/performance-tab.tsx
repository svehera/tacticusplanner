/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useEffect, useMemo, useState } from 'react';

import {
    TacticusDamageType,
    type GuildSeasonHistoryResponse,
    type TacticusGuildRaidEntry,
    type TacticusGuildRaidResponse,
} from '@/fsd/5-shared/lib/tacticus-api';
import { Rarity } from '@/fsd/5-shared/model';
import { RarityIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character/characters.service';

import {
    bossPrefixDisplayNames,
    bossPrefixRoundIconMap,
    computeDefaultRarities,
    unitRoundIconMap,
} from '../guild-performance.utils';

import {
    buildGuildPerformanceIndexRows,
    buildGuildView,
    buildPlayerBreakdowns,
    buildPlayerView,
    buildPlayerViewFromSummary,
    buildUnitPlayerBuckets,
    filterPerformanceEntries,
    getAvailableBossPrefixes,
    getAvailablePrimeUnitIds,
    type PlayerBossBreakdown,
    type PlayerBossUnit,
    type PlayerRow,
    type UnitPlayerBuckets,
    type UnitRow,
} from './performance-tab.utils';

// ---------------------------------------------------------------------------
// Filter sub-components
// ---------------------------------------------------------------------------

const ALL_RARITIES: Rarity[] = [
    Rarity.Common,
    Rarity.Uncommon,
    Rarity.Rare,
    Rarity.Epic,
    Rarity.Legendary,
    Rarity.Mythic,
];

function RarityFilterGroup({ selected, onChange }: { selected: Rarity[]; onChange: (rarities: Rarity[]) => void }) {
    const toggle = (rarity: Rarity) => {
        if (selected.includes(rarity) && selected.length === 1) return;
        onChange(selected.includes(rarity) ? selected.filter(x => x !== rarity) : [...selected, rarity]);
    };
    return (
        <div className="flex flex-col gap-0.5 text-xs">
            <span className="font-semibold text-gray-500 uppercase dark:text-gray-400">Rarity</span>
            <div className="flex gap-1">
                {ALL_RARITIES.map(rarity => (
                    <button
                        key={rarity}
                        type="button"
                        title={Rarity[rarity]}
                        onClick={() => {
                            toggle(rarity);
                        }}
                        className={[
                            'rounded border p-0.5 transition-colors',
                            selected.includes(rarity)
                                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950'
                                : 'border-gray-200 bg-white hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900',
                        ].join(' ')}>
                        <RarityIcon rarity={rarity} />
                    </button>
                ))}
            </div>
        </div>
    );
}

function PrefixFilterGroup({
    label,
    available,
    selected,
    onChange,
    iconFor,
}: {
    label: string;
    available: string[];
    selected: string[];
    onChange: (prefixes: string[]) => void;
    iconFor: (prefix: string) => { icon: string | undefined; name: string };
}) {
    if (available.length === 0) return <></>;
    const toggle = (prefix: string) => {
        onChange(selected.includes(prefix) ? selected.filter(p => p !== prefix) : [...selected, prefix]);
    };
    return (
        <div className="flex flex-col gap-0.5 text-xs">
            <span className="font-semibold text-gray-500 uppercase dark:text-gray-400">{label}</span>
            <div className="flex flex-wrap gap-1">
                {available.map(prefix => {
                    const { icon, name } = iconFor(prefix);
                    return (
                        <button
                            key={prefix}
                            type="button"
                            title={name}
                            onClick={() => {
                                toggle(prefix);
                            }}
                            className={[
                                'rounded border p-0.5 transition-colors',
                                selected.includes(prefix)
                                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950'
                                    : 'border-gray-200 bg-white hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900',
                            ].join(' ')}>
                            {icon === undefined ? (
                                <span className="px-1">{name}</span>
                            ) : (
                                <UnitShardIcon icon={icon} name={name} tooltip={name} width={24} height={24} />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function ExcludeKillsCheckbox({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex cursor-pointer items-center gap-1.5 text-xs">
            <input
                type="checkbox"
                checked={value}
                onChange={event => {
                    onChange(event.target.checked);
                }}
                className="h-4 w-4"
            />
            <span className="font-semibold text-gray-500 uppercase dark:text-gray-400">Exclude kills</span>
        </label>
    );
}

// ---------------------------------------------------------------------------
// Visuals
// ---------------------------------------------------------------------------

function EncounterIcon({ unitId, size = 24 }: { unitId: string; size?: number }) {
    const mappedIcon = unitRoundIconMap[unitId];
    if (mappedIcon !== undefined) {
        return <UnitShardIcon icon={mappedIcon} name={unitId} tooltip={unitId} width={size} height={size} />;
    }
    const match = /(?:MiniBoss|Minion)\d+(.+)/.exec(unitId);
    if (match) {
        const id = match[1].charAt(0).toLowerCase() + match[1].slice(1);
        const character = CharactersService.getUnit(id);
        if (character) {
            return (
                <UnitShardIcon
                    icon={character.roundIcon ?? ''}
                    name={character.name}
                    tooltip={character.name}
                    width={size}
                    height={size}
                />
            );
        }
    }
    return <span className="text-xs text-gray-500">{unitId.slice(-6)}</span>;
}

const formatPct = (value: number): string => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const formatNumber = (value: number): string =>
    value.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 1 });

function CenteredBar({ value, maxAbs }: { value: number; maxAbs: number }) {
    const widthPct = maxAbs > 0 ? (Math.abs(value) / maxAbs) * 50 : 0;
    const isPositive = value >= 0;
    return (
        <div className="relative h-3 w-full overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-800">
            <div className="absolute inset-y-0 left-1/2 w-px bg-gray-400 dark:bg-gray-500" />
            <div
                className={`absolute inset-y-0 ${isPositive ? 'left-1/2 bg-emerald-500' : 'right-1/2 bg-red-500'}`}
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
        <div className="relative h-4 w-full rounded-sm bg-gray-100 dark:bg-gray-800">
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
        <div className="relative h-4 w-full rounded-sm bg-gray-100 dark:bg-gray-800">
            <div
                className="absolute inset-y-0 left-1/2 w-0.5 bg-amber-500"
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

    if (sorted.length === 0) return <></>;

    const fmt = formatValue ?? formatNumber;
    return (
        <section className="flex max-w-3xl flex-col gap-2">
            <h2 className="text-base font-semibold">
                {title}{' '}
                <span className="text-xs font-normal text-gray-500">
                    {baselineLabel}: {fmt(guildValue)}
                </span>
            </h2>
            {subtitle !== undefined && <p className="-mt-1 text-xs text-gray-500">{subtitle}</p>}
            <div className="flex flex-col gap-0.5">
                {sorted.map(row => (
                    <div key={row.userId} className="grid grid-cols-[8rem_1fr_4rem_4rem] items-center gap-2 text-xs">
                        <span className="truncate" title={row.displayName}>
                            {row.displayName}
                        </span>
                        <CenteredBar value={row[diffKey]} maxAbs={maxAbs} />
                        <span
                            className={`text-right tabular-nums ${
                                row[diffKey] >= 0 ? 'text-emerald-500' : 'text-red-500'
                            }`}>
                            {formatPct(row[diffKey])}
                        </span>
                        <span className="text-right text-gray-500 tabular-nums">{fmt(row[valueKey])}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

function PlayerMaxVsGuildTable({ title, rows, guildMax }: { title: string; rows: PlayerRow[]; guildMax: number }) {
    const sorted = useMemo(() => rows.toSorted((a, b) => b.max - a.max), [rows]);
    if (sorted.length === 0) return <></>;
    return (
        <section className="flex max-w-3xl flex-col gap-2">
            <h2 className="text-base font-semibold">
                {title} <span className="text-xs font-normal text-gray-500">Guild: {formatNumber(guildMax)}</span>
            </h2>
            <div className="flex flex-col gap-0.5">
                {sorted.map(row => {
                    const widthPct = guildMax > 0 ? (row.max / guildMax) * 100 : 0;
                    return (
                        <div
                            key={row.userId}
                            className="grid grid-cols-[8rem_1fr_4rem_4rem] items-center gap-2 text-xs">
                            <span className="truncate" title={row.displayName}>
                                {row.displayName}
                            </span>
                            <div className="relative h-3 w-full overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-800">
                                <div
                                    className="absolute inset-y-0 left-0 bg-blue-400"
                                    style={{ width: `${widthPct}%` }}
                                />
                            </div>
                            <span className="text-right text-gray-500 tabular-nums">{widthPct.toFixed(0)}%</span>
                            <span className="text-right text-gray-500 tabular-nums">{formatNumber(row.max)}</span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function bgForUnit(unit: PlayerBossUnit): string {
    if (unit.hits === 0) return 'bg-gray-400 opacity-60';
    if (unit.ratio >= 1.2) return 'bg-emerald-500';
    if (unit.ratio >= 0.8) return 'bg-amber-500';
    return 'bg-red-500';
}

function BreakdownUnitChip({ unit }: { unit: PlayerBossUnit }) {
    const label = `${unit.isBoss ? 'Boss' : 'Prime'} ${Rarity[unit.rarity]}`;
    const tooltip =
        unit.hits === 0
            ? `${label} — no hits`
            : `${label} — player ${formatNumber(unit.playerAvg)} vs guild ${formatNumber(unit.guildAvg)} (${(unit.ratio * 100).toFixed(0)}%)`;
    return (
        <span className={`inline-flex shrink-0 rounded-full p-0.5 ${bgForUnit(unit)}`} title={tooltip}>
            <span className="inline-flex rounded-full bg-white p-0.5 dark:bg-gray-900">
                <EncounterIcon unitId={unit.unitId} size={20} />
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

const BREAKDOWN_MODES: Array<{ id: BreakdownMode; label: string }> = [
    { id: 'efficiency', label: 'By token efficiency' },
    { id: 'encounter', label: 'By encounter order' },
    { id: 'per-unit', label: 'Per boss/prime' },
];

function ModeToggle({ mode, onChange }: { mode: BreakdownMode; onChange: (m: BreakdownMode) => void }) {
    return (
        <div className="flex gap-1 rounded border border-gray-200 p-0.5 text-xs dark:border-gray-700">
            {BREAKDOWN_MODES.map(option => (
                <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                        onChange(option.id);
                    }}
                    className={[
                        'rounded px-2 py-1 transition-colors',
                        mode === option.id
                            ? 'bg-blue-600 text-white dark:bg-blue-500'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                    ].join(' ')}>
                    {option.label}
                </button>
            ))}
        </div>
    );
}

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
        <div className="grid grid-cols-[8rem_1fr] items-center gap-2 text-xs">
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
        <div className="grid grid-cols-[8rem_1fr] items-center gap-2 text-xs">
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
    if (players.length === 0) return <span className="text-gray-400">—</span>;
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
        <div className="grid grid-cols-[8rem_1fr_1fr_1fr] items-start gap-2 border-t border-gray-100 py-1 text-xs dark:border-gray-800">
            <span className="flex items-center gap-1.5">
                <EncounterIcon unitId={bucket.unitId} size={22} />
                <RarityIcon rarity={bucket.rarity} />
                <span className="text-gray-500 dark:text-gray-400">{bucket.isBoss ? 'Boss' : 'Prime'}</span>
            </span>
            <PlayerNameList players={bucket.greenPlayers} colorClass="text-emerald-500" />
            <PlayerNameList players={bucket.yellowPlayers} colorClass="text-amber-500" />
            <PlayerNameList players={bucket.redPlayers} colorClass="text-red-500" />
        </div>
    );
}

function ColorBandLegend() {
    return (
        <p className="text-xs text-gray-500">
            <span className="font-medium text-emerald-500">Green</span>: ≥ +20% of guild avg ·{' '}
            <span className="font-medium text-amber-500">Amber</span>: within ±20% ·{' '}
            <span className="font-medium text-red-500">Red</span>: &lt; −20%
        </p>
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
    if (breakdowns.length === 0) return <></>;
    return (
        <section className="flex max-w-4xl flex-col gap-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold">Per-player boss breakdown</h2>
                <ModeToggle mode={mode} onChange={onModeChange} />
            </div>
            {mode === 'efficiency' && (
                <>
                    <ColorBandLegend />
                    <p className="text-xs text-gray-500">
                        Sorted green-first, then amber, then red. Unhit units hidden.
                    </p>
                    <div className="flex flex-col gap-1">
                        {breakdowns.map(breakdown => (
                            <PlayerRowEfficiency key={breakdown.userId} breakdown={breakdown} />
                        ))}
                    </div>
                </>
            )}
            {mode === 'encounter' && (
                <>
                    <ColorBandLegend />
                    <p className="text-xs text-gray-500">
                        Ascending rarity/set. Within a set: left prime → right prime → boss. Grey = no hits.
                    </p>
                    <div className="flex flex-col gap-1">
                        {breakdowns.map(breakdown => (
                            <PlayerRowEncounter key={breakdown.userId} breakdown={breakdown} />
                        ))}
                    </div>
                </>
            )}
            {mode === 'per-unit' && (
                <>
                    <ColorBandLegend />
                    <p className="text-xs text-gray-500">One row per boss/prime, descending rarity/set.</p>
                    <div className="grid grid-cols-[8rem_1fr_1fr_1fr] gap-2 text-xs font-semibold text-gray-500 uppercase">
                        <span>Unit</span>
                        <span className="text-emerald-500">≥ +20%</span>
                        <span className="text-amber-500">±20%</span>
                        <span className="text-red-500">&lt; −20%</span>
                    </div>
                    <div className="flex flex-col">
                        {buckets.map(bucket => (
                            <PerUnitRow key={bucket.unitKey} bucket={bucket} />
                        ))}
                    </div>
                </>
            )}
        </section>
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
            <span className="truncate text-gray-500 dark:text-gray-400" title={bossPrefixDisplayNames[row.bossPrefix]}>
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
        <section className="flex max-w-3xl flex-col gap-2">
            <h2 className="text-base font-semibold">{title}</h2>
            <div className="flex flex-col gap-0.5">
                {rows.map(row => (
                    <div key={row.unitKey} className="grid grid-cols-[10rem_1fr_4rem_4rem] items-center gap-2 text-xs">
                        <UnitLabel row={row} />
                        <CenteredBar value={row[diffKey]} maxAbs={maxAbs} />
                        <span
                            className={`text-right tabular-nums ${
                                row[diffKey] >= 0 ? 'text-emerald-500' : 'text-red-500'
                            }`}>
                            {formatPct(row[diffKey])}
                        </span>
                        <span className="text-right text-gray-500 tabular-nums">{formatNumber(row[valueKey])}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

function UnitMaxVsGuildTable({ title, rows }: { title: string; rows: UnitRow[] }) {
    if (rows.length === 0) return <></>;
    return (
        <section className="flex max-w-3xl flex-col gap-2">
            <h2 className="text-base font-semibold">{title}</h2>
            <div className="flex flex-col gap-0.5">
                {rows.map(row => {
                    const widthPct = row.guildMax > 0 ? (row.max / row.guildMax) * 100 : 0;
                    return (
                        <div
                            key={row.unitKey}
                            className="grid grid-cols-[10rem_1fr_4rem_4rem] items-center gap-2 text-xs">
                            <UnitLabel row={row} />
                            <div className="relative h-3 w-full overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-800">
                                <div
                                    className="absolute inset-y-0 left-0 bg-blue-400"
                                    style={{ width: `${widthPct}%` }}
                                />
                            </div>
                            <span className="text-right text-gray-500 tabular-nums">{widthPct.toFixed(0)}%</span>
                            <span className="text-right text-gray-500 tabular-nums">{formatNumber(row.max)}</span>
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
        <section className="flex max-w-3xl flex-col gap-2">
            <h2 className="text-base font-semibold">Hit distribution (per row: 0 → guild max for that boss)</h2>
            <div className="flex flex-col gap-0.5">
                {rows.map(row => (
                    <div
                        key={row.unitKey}
                        className="grid grid-cols-[10rem_3.5rem_1fr_3rem] items-center gap-2 text-xs">
                        <UnitLabel row={row} />
                        <span className="text-right text-gray-500 tabular-nums">{formatNumber(row.guildMax)}</span>
                        <DistributionRow
                            nonKillHits={row.playerNonKillHits}
                            killHits={row.playerKillHits}
                            maxValue={row.guildMax}
                        />
                        <span className="text-right text-gray-500 tabular-nums">
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
        <section className="flex max-w-3xl flex-col gap-2">
            <h2 className="text-base font-semibold">
                Hit distribution vs guild average{' '}
                <span className="text-xs font-normal text-gray-500">(amber line = guild avg, centred)</span>
            </h2>
            <div className="flex flex-col gap-0.5">
                {rows.map(row => (
                    <div
                        key={row.unitKey}
                        className="grid grid-cols-[10rem_3.5rem_1fr_3rem] items-center gap-2 text-xs">
                        <UnitLabel row={row} />
                        <span className="text-right text-gray-500 tabular-nums">{formatNumber(row.guildAvg)}</span>
                        <CenteredDistributionRow
                            nonKillHits={row.playerNonKillHits}
                            killHits={row.playerKillHits}
                            center={row.guildAvg}
                        />
                        <span className="text-right text-gray-500 tabular-nums">
                            {row.playerNonKillHits.length + row.playerKillHits.length}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}

const bossIconFor = (prefix: string) => ({
    icon: bossPrefixRoundIconMap[prefix],
    name: bossPrefixDisplayNames[prefix] ?? prefix,
});

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

    const primeIconFor = (unitId: string) => {
        const direct = unitRoundIconMap[unitId];
        if (direct !== undefined) {
            const familyName = bossPrefixDisplayNames[/^(GuildBoss\d+)/.exec(unitId)?.[1] ?? ''] ?? unitId;
            return { icon: direct, name: familyName };
        }
        const match = /(?:MiniBoss|Minion)\d+(.+)/.exec(unitId);
        if (match) {
            const id = match[1].charAt(0).toLowerCase() + match[1].slice(1);
            const character = CharactersService.getUnit(id);
            if (character?.roundIcon !== undefined && character.roundIcon !== '') {
                return { icon: character.roundIcon, name: character.name };
            }
        }
        return { icon: undefined, name: unitId.replace(/^GuildBoss\d+(MiniBoss|Minion)\d+/, '') };
    };

    if (currentData === undefined && seasonHistory === undefined) {
        return <p className="text-sm text-gray-500">Loading…</p>;
    }

    if (isHistorical) {
        // Rarity/Boss/Prime filters need per-hit data, so they're live-only. Historical supports the
        // full-guild Performance Index (no player) and the four per-player graphs (player selected).
        return (
            <div className="flex flex-col gap-4">
                {selectedPlayerId !== undefined && (
                    <div className="flex flex-wrap items-end gap-4 border-b border-gray-200 pb-3 dark:border-gray-700">
                        <ExcludeKillsCheckbox value={excludeKills} onChange={setExcludeKills} />
                    </div>
                )}
                {selectedPlayerId === undefined ? (
                    historyPerformanceRows.length === 0 ? (
                        <div className="flex items-center justify-center rounded border border-gray-200 bg-gray-50 py-12 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900">
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
                    <div className="flex items-center justify-center rounded border border-gray-200 bg-gray-50 py-12 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900">
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
            <div className="flex flex-wrap items-end gap-4 border-b border-gray-200 pb-3 dark:border-gray-700">
                <RarityFilterGroup selected={selectedRarities} onChange={handleRarityChange} />
                <PrefixFilterGroup
                    label="Bosses"
                    available={availableBossPrefixes}
                    selected={effectiveBossPrefixes}
                    onChange={setSelectedBossPrefixes}
                    iconFor={bossIconFor}
                />
                <PrefixFilterGroup
                    label="Primes"
                    available={availablePrimeUnitIds}
                    selected={effectivePrimeUnitIds}
                    onChange={setSelectedPrimeUnitIds}
                    iconFor={primeIconFor}
                />
                <ExcludeKillsCheckbox value={excludeKills} onChange={setExcludeKills} />
            </div>

            {filteredEntries.length === 0 ? (
                <div className="flex items-center justify-center rounded border border-gray-200 bg-gray-50 py-12 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900">
                    No entries match the current filters.
                </div>
            ) : selectedPlayerId === undefined ? (
                <div className="flex flex-col gap-6">
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
