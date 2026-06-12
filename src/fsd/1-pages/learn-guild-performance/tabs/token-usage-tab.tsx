/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useTheme } from '@mui/material';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { TacticusDamageType, type TacticusGuildRaidResponse } from '@/fsd/5-shared/lib/tacticus-api';

import type { GuildTokenUsageResponse } from '../guild-performance.api';
import { resolvePlayerName } from '../guild-performance.utils';

type ColorMode = 'gradient' | 'threshold';

// Module-level cache — persists across in-session navigations
let cachedColorMode: ColorMode = 'threshold';
let cachedThreshold1 = 23;
let cachedThreshold2 = 26;

interface TokenUsageTabProps {
    tokenUsageData: GuildTokenUsageResponse | undefined;
    currentData: TacticusGuildRaidResponse | undefined;
    names: Map<string, string>;
    selectedPlayerId: string | undefined;
}

function gradientColor(ratio: number, isDark: boolean): string {
    const hue = Math.round(ratio * 120);
    return isDark ? `hsl(${hue}, 50%, 30%)` : `hsl(${hue}, 70%, 78%)`;
}

export const TokenUsageTab = ({ tokenUsageData, currentData, names, selectedPlayerId }: TokenUsageTabProps) => {
    const isDark = useTheme().palette.mode === 'dark';

    const [colorMode, setColorMode] = useState<ColorMode>(cachedColorMode);
    const [threshold1, setThreshold1] = useState(cachedThreshold1);
    const [threshold2, setThreshold2] = useState(cachedThreshold2);

    const lowThreshold = Math.min(threshold1, threshold2);
    const highThreshold = Math.max(threshold1, threshold2);

    if (!tokenUsageData && !currentData) {
        return <p className="text-sm text-gray-500">Loading…</p>;
    }

    const lookup = new Map<string, Map<number, { tokens: number; bombs: number }>>();
    const historicalSeasonNumbers = new Set<number>();

    for (const seasonEntry of tokenUsageData?.seasons ?? []) {
        if (seasonEntry.season == undefined) continue;
        historicalSeasonNumbers.add(seasonEntry.season);
        for (const player of seasonEntry.players ?? []) {
            if (!player.userId) continue;
            if (!lookup.has(player.userId)) lookup.set(player.userId, new Map());
            lookup.get(player.userId)!.set(seasonEntry.season, {
                tokens: player.tokens ?? 0,
                bombs: player.bombs ?? 0,
            });
        }
    }

    const currentSeasonNumber = currentData?.season;
    if (currentData && currentSeasonNumber != undefined && !historicalSeasonNumbers.has(currentSeasonNumber)) {
        for (const entry of currentData.entries) {
            if (!lookup.has(entry.userId)) lookup.set(entry.userId, new Map());
            const seasonMap = lookup.get(entry.userId)!;
            const existing = seasonMap.get(currentSeasonNumber) ?? { tokens: 0, bombs: 0 };
            if (entry.damageType === TacticusDamageType.Bomb) {
                seasonMap.set(currentSeasonNumber, { tokens: existing.tokens, bombs: existing.bombs + 1 });
            } else {
                seasonMap.set(currentSeasonNumber, { tokens: existing.tokens + 1, bombs: existing.bombs });
            }
        }
    }

    const seasons = [
        ...new Set([...historicalSeasonNumbers, ...(currentSeasonNumber == undefined ? [] : [currentSeasonNumber])]),
    ].toSorted((a, b) => a - b);

    const playerIds = [...lookup.keys()]
        .filter(userId => selectedPlayerId == undefined || userId === selectedPlayerId)
        .toSorted((a, b) => resolvePlayerName(a, names).localeCompare(resolvePlayerName(b, names)));

    if (playerIds.length === 0 || seasons.length === 0) {
        return <p className="text-sm text-gray-500">No token usage data available.</p>;
    }

    // Per-season min/max for gradient coloring (historical seasons only)
    const seasonTokenStats = new Map<number, { min: number; max: number }>();
    if (colorMode === 'gradient') {
        for (const season of seasons) {
            if (season === currentSeasonNumber) continue;
            const values = playerIds.flatMap(userId => {
                const tokenValue = lookup.get(userId)?.get(season)?.tokens;
                return tokenValue == undefined ? [] : [tokenValue];
            });
            if (values.length > 0) {
                seasonTokenStats.set(season, { min: Math.min(...values), max: Math.max(...values) });
            }
        }
    }

    const headerCell =
        'border border-gray-200 dark:border-gray-700 bg-gray-50 px-2 py-1 text-center text-xs font-semibold uppercase text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    const nameCell =
        'whitespace-nowrap border border-gray-200 dark:border-gray-700 bg-white px-2 py-1 text-left text-sm font-medium text-gray-900 dark:bg-gray-900 dark:text-gray-100';
    const dataCell = 'border border-gray-200 dark:border-gray-700 px-2 py-1 text-center text-sm';
    const presentCell = `${dataCell} bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100`;
    const absentCell = `${dataCell} bg-black text-white`;

    const getTokenCellProps = (tokens: number, season: number): { className: string; style?: CSSProperties } => {
        if (season === currentSeasonNumber) return { className: presentCell };
        if (colorMode === 'gradient') {
            const stats = seasonTokenStats.get(season);
            const ratio =
                stats == undefined || stats.max === stats.min ? 1 : (tokens - stats.min) / (stats.max - stats.min);
            return {
                className: `${dataCell} text-gray-900 dark:text-gray-100`,
                style: { backgroundColor: gradientColor(ratio, isDark) },
            };
        }
        if (tokens >= highThreshold)
            return { className: `${dataCell} bg-green-200 text-gray-900 dark:bg-green-800 dark:text-gray-100` };
        if (tokens >= lowThreshold)
            return { className: `${dataCell} bg-yellow-200 text-gray-900 dark:bg-yellow-800 dark:text-gray-100` };
        return { className: `${dataCell} bg-red-200 text-gray-900 dark:bg-red-800 dark:text-gray-100` };
    };

    const inputClass =
        'w-14 rounded border border-gray-300 bg-white px-2 py-0.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100';

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Color:</span>
                <div className="flex gap-4">
                    {(['gradient', 'threshold'] as const).map(mode => (
                        <label
                            key={mode}
                            className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                            <input
                                type="radio"
                                name="tokenColorMode"
                                value={mode}
                                checked={colorMode === mode}
                                onChange={() => {
                                    cachedColorMode = mode;
                                    setColorMode(mode);
                                }}
                                className="accent-blue-600"
                            />
                            {mode === 'gradient' ? 'Gradient' : 'Thresholds'}
                        </label>
                    ))}
                </div>
                {colorMode === 'threshold' && (
                    <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                            Threshold 1:
                            <input
                                type="number"
                                min={0}
                                max={28}
                                value={threshold1}
                                onChange={event => {
                                    const value = Math.max(0, Math.min(28, Number(event.target.value)));
                                    cachedThreshold1 = value;
                                    setThreshold1(value);
                                }}
                                className={inputClass}
                            />
                        </label>
                        <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                            Threshold 2:
                            <input
                                type="number"
                                min={0}
                                max={28}
                                value={threshold2}
                                onChange={event => {
                                    const value = Math.max(0, Math.min(28, Number(event.target.value)));
                                    cachedThreshold2 = value;
                                    setThreshold2(value);
                                }}
                                className={inputClass}
                            />
                        </label>
                    </div>
                )}
            </div>

            <div>
                <h3 className="mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">Tokens</h3>
                <div className="overflow-x-auto">
                    <table className="border-collapse">
                        <thead>
                            <tr>
                                <th className={`${headerCell} min-w-36 text-left`}>Player</th>
                                {seasons.map(s => (
                                    <th key={s} className={`${headerCell} min-w-12`}>
                                        S{s}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {playerIds.map(userId => (
                                <tr key={userId}>
                                    <td className={nameCell}>{resolvePlayerName(userId, names)}</td>
                                    {seasons.map(s => {
                                        const entry = lookup.get(userId)?.get(s);
                                        if (entry == undefined) {
                                            return (
                                                <td key={s} className={absentCell}>
                                                    -
                                                </td>
                                            );
                                        }
                                        const { className, style } = getTokenCellProps(entry.tokens, s);
                                        return (
                                            <td key={s} className={className} style={style}>
                                                {entry.tokens}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <h3 className="mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">Bombs</h3>
                <div className="overflow-x-auto">
                    <table className="border-collapse">
                        <thead>
                            <tr>
                                <th className={`${headerCell} min-w-36 text-left`}>Player</th>
                                {seasons.map(s => (
                                    <th key={s} className={`${headerCell} min-w-12`}>
                                        S{s}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {playerIds.map(userId => (
                                <tr key={userId}>
                                    <td className={nameCell}>{resolvePlayerName(userId, names)}</td>
                                    {seasons.map(s => {
                                        const entry = lookup.get(userId)?.get(s);
                                        if (entry == undefined) {
                                            return (
                                                <td key={s} className={absentCell}>
                                                    -
                                                </td>
                                            );
                                        }
                                        return (
                                            <td key={s} className={presentCell}>
                                                {entry.bombs}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
