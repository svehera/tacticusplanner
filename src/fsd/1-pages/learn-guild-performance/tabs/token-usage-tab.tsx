/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useState } from 'react';
import type { CSSProperties } from 'react';

import type { TacticusGuildRaidResponse } from '@/fsd/5-shared/lib/tacticus-api';

import type { GuildTokenUsageResponse } from '../guild-performance.api';
import { resolvePlayerName } from '../guild-performance.utils';

import { buildLookupAndSeasons, computeSeasonTokenStats, getPlayerIdsSorted } from './token-usage-tab.utils';

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
    const [colorMode, setColorMode] = useState<ColorMode>(cachedColorMode);
    const [threshold1, setThreshold1] = useState(cachedThreshold1);
    const [threshold2, setThreshold2] = useState(cachedThreshold2);

    const lowThreshold = Math.min(threshold1, threshold2);
    const highThreshold = Math.max(threshold1, threshold2);

    if (!tokenUsageData && !currentData) {
        return <p className="text-sm text-(--soft-fg)">Loading…</p>;
    }

    const { lookup, seasons, currentSeasonNumber } = buildLookupAndSeasons(tokenUsageData, currentData);
    const playerIds = getPlayerIdsSorted(lookup, selectedPlayerId, names);

    if (playerIds.length === 0 || seasons.length === 0) {
        return <p className="text-sm text-(--soft-fg)">No token usage data available.</p>;
    }

    const isDark = document.documentElement.classList.contains('dark');
    const seasonTokenStats = computeSeasonTokenStats(seasons, playerIds, lookup, colorMode);

    const headerCell =
        'border border-(--border) bg-(--soft) px-2 py-1 text-center text-xs font-semibold uppercase text-(--soft-fg)';
    const nameCell =
        'whitespace-nowrap border border-(--border) bg-(--bg) px-2 py-1 text-left text-sm font-medium text-(--fg)';
    const dataCell = 'border border-(--border) px-2 py-1 text-center text-sm';
    const presentCell = `${dataCell} bg-(--bg) text-(--fg)`;
    const absentCell = `${dataCell} bg-black text-white`;

    const getTokenCellProps = (tokens: number, season: number): { className: string; style?: CSSProperties } => {
        if (colorMode === 'gradient') {
            const stats = seasonTokenStats.get(season);
            const ratio =
                stats == undefined || stats.max === stats.min ? 1 : (tokens - stats.min) / (stats.max - stats.min);
            return {
                className: `${dataCell} text-(--fg)`,
                style: { backgroundColor: gradientColor(ratio, isDark) },
            };
        }
        if (season === currentSeasonNumber) return { className: presentCell };
        if (tokens >= highThreshold) return { className: `${dataCell} bg-(--success)/20 text-(--fg)` };
        if (tokens >= lowThreshold) return { className: `${dataCell} bg-(--warning)/30 text-(--fg)` };
        return { className: `${dataCell} bg-(--danger)/20 text-(--fg)` };
    };

    const inputClass = 'w-14 rounded border border-(--input-border) bg-(--bg) px-2 py-0.5 text-sm text-(--fg)';

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded border border-(--border) bg-(--soft) px-3 py-2">
                <span className="text-sm font-medium text-(--soft-fg)">Color:</span>
                <div className="flex gap-4">
                    {(['gradient', 'threshold'] as const).map(mode => (
                        <label key={mode} className="flex cursor-pointer items-center gap-1.5 text-sm text-(--soft-fg)">
                            <input
                                type="radio"
                                name="tokenColorMode"
                                value={mode}
                                checked={colorMode === mode}
                                onChange={() => {
                                    cachedColorMode = mode;
                                    setColorMode(mode);
                                }}
                                className="accent-(--primary)"
                            />
                            {mode === 'gradient' ? 'Gradient' : 'Thresholds'}
                        </label>
                    ))}
                </div>
                {colorMode === 'threshold' && (
                    <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 text-sm text-(--soft-fg)">
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
                        <label className="flex items-center gap-1.5 text-sm text-(--soft-fg)">
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
                <h3 className="mb-2 text-sm font-semibold tracking-wide text-(--soft-fg) uppercase">Tokens</h3>
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
                <h3 className="mb-2 text-sm font-semibold tracking-wide text-(--soft-fg) uppercase">Bombs</h3>
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
