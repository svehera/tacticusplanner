/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useMemo } from 'react';

import { type GuildSeasonHistoryResponse, type TacticusGuildRaidResponse } from '@/fsd/5-shared/lib/tacticus-api';
import { RarityIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character/characters.service';

import { unitRoundIconMap } from '../guild-performance.utils';

import {
    buildBossLoopRows,
    buildBossLoopRowsFromSummary,
    type BossLoopRow,
    type LoopTokenCounts,
} from './loops-tab.utils';

// ---------------------------------------------------------------------------
// Icon component shared by boss + prime slots
// ---------------------------------------------------------------------------

function EncounterIcon({ unitId, size = 28 }: { unitId: string | undefined; size?: number }) {
    if (unitId === undefined) {
        return <div style={{ width: size, height: size }} />;
    }
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
    return (
        <span
            className="overflow-hidden text-xs text-ellipsis text-gray-500"
            style={{ width: size, display: 'inline-block' }}
            title={unitId}>
            {unitId.slice(-6)}
        </span>
    );
}

// ---------------------------------------------------------------------------
// Color legend
// ---------------------------------------------------------------------------

const COLOR_LEGEND = (
    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-blue-400" />
            Left Prime
        </span>
        <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-violet-400" />
            Right Prime
        </span>
        <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-emerald-500" />
            Boss
        </span>
    </div>
);

// ---------------------------------------------------------------------------
// Loop progress row
// ---------------------------------------------------------------------------

const formatCompactHp = (n: number) => n.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 1 });

function LoopProgressRow({
    loop,
    hasPrimes,
    maxLoopTotal,
}: {
    loop: LoopTokenCounts;
    hasPrimes: boolean;
    maxLoopTotal: number;
}) {
    const leftPct = loop.total > 0 ? (loop.left / loop.total) * 100 : 0;
    const rightPct = loop.total > 0 ? (loop.right / loop.total) * 100 : 0;
    const bossPct = loop.total > 0 ? (loop.boss / loop.total) * 100 : 0;

    // Outer fill: this loop's share of the heaviest loop in this card
    const outerBarWidth = maxLoopTotal > 0 ? (loop.total / maxLoopTotal) * 100 : 0;

    const showHp = loop.finalRemainingHp !== undefined && loop.finalRemainingHp > 0;

    return (
        <div className="flex items-center gap-3 px-3 py-1.5">
            <span className="w-5 shrink-0 text-center text-xs font-medium text-gray-400">{loop.loopNumber}</span>
            <span className="w-44 shrink-0 text-xs text-gray-600 tabular-nums dark:text-gray-400">
                {hasPrimes ? `${loop.boss} boss / ${loop.left} left / ${loop.right} right` : `${loop.boss} boss`}
            </span>
            <span className="w-24 shrink-0 text-right text-xs text-red-500 tabular-nums">
                {showHp && `${formatCompactHp(loop.finalRemainingHp!)} remaining`}
            </span>
            <div className="flex h-4 min-w-0 flex-1 overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-800">
                <div className="flex h-full" style={{ width: `${outerBarWidth}%` }}>
                    {loop.left > 0 && <div className="h-full bg-blue-400" style={{ width: `${leftPct}%` }} />}
                    {loop.right > 0 && <div className="h-full bg-violet-400" style={{ width: `${rightPct}%` }} />}
                    {loop.boss > 0 && <div className="h-full bg-emerald-500" style={{ width: `${bossPct}%` }} />}
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Boss loop card
// ---------------------------------------------------------------------------

function BossLoopCard({ row, maxLoopTotal }: { row: BossLoopRow; maxLoopTotal: number }) {
    return (
        <div className="rounded border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
                <EncounterIcon unitId={row.bossUnitId} size={28} />
                <EncounterIcon unitId={row.leftPrimeUnitId} size={28} />
                <EncounterIcon unitId={row.rightPrimeUnitId} size={28} />
                <RarityIcon rarity={row.rarity} />
                {row.bossMaxHp > 0 && (
                    <span className="ml-1 text-xs text-gray-400 tabular-nums">{row.bossMaxHp.toLocaleString()} HP</span>
                )}
            </div>
            <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
                {row.loops.map(loop => (
                    <LoopProgressRow
                        key={loop.loopNumber}
                        loop={loop}
                        hasPrimes={row.hasPrimes}
                        maxLoopTotal={maxLoopTotal}
                    />
                ))}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// LoopsTab
// ---------------------------------------------------------------------------

export const LoopsTab = ({
    currentData,
    seasonHistory,
    selectedSeason,
}: {
    currentData: TacticusGuildRaidResponse | undefined;
    seasonHistory?: GuildSeasonHistoryResponse;
    /** Page-level sticky season selection. */
    selectedSeason: number | undefined;
}) => {
    // A historical season reads per-loop counts straight from the aggregate; the live season derives
    // them from raw per-hit entries.
    const historySummary = useMemo(
        () =>
            selectedSeason === currentData?.season
                ? undefined
                : seasonHistory?.seasonData.find(season => season.season === selectedSeason),
        [selectedSeason, currentData, seasonHistory]
    );

    const rows = useMemo(
        () =>
            historySummary
                ? buildBossLoopRowsFromSummary(historySummary)
                : buildBossLoopRows(currentData?.entries ?? []),
        [historySummary, currentData]
    );

    const maxLoopTotal = useMemo(() => {
        let max = 0;
        for (const row of rows) {
            for (const loop of row.loops) {
                if (loop.total > max) max = loop.total;
            }
        }
        return max;
    }, [rows]);

    if (currentData === undefined && seasonHistory === undefined) {
        return <p className="text-sm text-gray-500">Loading…</p>;
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-end gap-4 border-b border-gray-200 pb-3 dark:border-gray-700">
                {COLOR_LEGEND}
            </div>
            {rows.length === 0 ? (
                <div className="flex items-center justify-center rounded border border-gray-200 bg-gray-50 py-12 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900">
                    No legendary or mythic boss encounters recorded for this season yet.
                </div>
            ) : (
                <section className="flex max-w-4xl flex-col gap-3">
                    {rows.map(row => (
                        <BossLoopCard key={`${row.bossPrefix}:${row.rarity}`} row={row} maxLoopTotal={maxLoopTotal} />
                    ))}
                </section>
            )}
        </div>
    );
};
