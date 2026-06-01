/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useEffect, useState } from 'react';

import { makeApiCall } from '@/fsd/5-shared/api';
import type { TacticusGuildRaidResponse } from '@/fsd/5-shared/lib/tacticus-api';
import { getImageUrl } from '@/fsd/5-shared/ui';

import { DebugJson } from '../guild-performance.components';
import type { GuildTokenEntry } from '../guild-performance.types';
import { LOADING } from '../guild-performance.types';
import {
    getCurrentBossEntry,
    bossPortraitMap,
    formatTime,
    sortTokenEntries,
    sortBombEntries,
} from '../guild-performance.utils';

let cachedTokens: GuildTokenEntry[] | undefined;

const HpBar = ({ remainingHp, maxHp }: { remainingHp: number; maxHp: number }) => {
    const pct = maxHp > 0 ? (remainingHp / maxHp) * 100 : 0;
    return (
        <div className="flex flex-col gap-0.5">
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-full bg-red-500 transition-all dark:bg-red-400" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-500 tabular-nums">
                {remainingHp.toLocaleString()} / {maxHp.toLocaleString()}
            </span>
        </div>
    );
};

const CurrentBoss = ({ data }: { data: TacticusGuildRaidResponse | undefined }) => {
    if (data === undefined) return <p className="text-sm text-gray-500">Loading…</p>;

    const entries = data.entries ?? [];
    const boss = getCurrentBossEntry(entries);
    if (!boss) return <p className="text-sm text-gray-500">No boss data yet.</p>;

    const portrait = bossPortraitMap[boss.unitId];
    return (
        <div className="flex items-start gap-4">
            {portrait ? (
                <img
                    src={getImageUrl(portrait)}
                    alt={boss.unitId}
                    className="w-48 shrink-0 rounded-lg object-cover shadow"
                />
            ) : (
                <div className="flex h-48 w-48 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-xs text-gray-500 dark:bg-gray-700">
                    {boss.unitId}
                </div>
            )}
            <div className="flex flex-col gap-2 pt-1">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{boss.unitId}</p>
                <HpBar remainingHp={boss.remainingHp} maxHp={boss.maxHp} />
            </div>
        </div>
    );
};

const TokenTable = ({ entries, names }: { entries: GuildTokenEntry[]; names: Map<string, string> }) => {
    const rows = entries.map(entry => ({
        userId: entry.userId,
        displayName: names.get(entry.userId) ?? entry.name ?? entry.userId,
        tokens: entry.tokens,
        nextTokenAtUtc: entry.nextTokenAtUtc,
        bombAvailableAtUtc: entry.bombAvailableAtUtc,
    }));
    const sorted = sortTokenEntries(rows);

    return (
        <table className="min-w-0 text-sm">
            <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                    <th className="pr-4 pb-1">Player</th>
                    <th className="pr-4 pb-1 text-right">Tokens</th>
                    <th className="pb-1">Next Token At</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sorted.map(row => (
                    <tr key={row.userId}>
                        <td className="py-0.5 pr-4 font-medium" title={row.userId}>
                            {row.displayName}
                        </td>
                        <td className="py-0.5 pr-4 text-right tabular-nums">
                            {row.tokens == undefined ? '—' : row.tokens}
                        </td>
                        <td className="py-0.5 text-gray-500 tabular-nums">
                            {row.nextTokenAtUtc == undefined
                                ? row.tokens == undefined
                                    ? '—'
                                    : 'Full'
                                : formatTime(row.nextTokenAtUtc)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const BombTable = ({ entries, names }: { entries: GuildTokenEntry[]; names: Map<string, string> }) => {
    const rows = entries.map(entry => ({
        userId: entry.userId,
        displayName: names.get(entry.userId) ?? entry.name ?? entry.userId,
        tokens: entry.tokens,
        nextTokenAtUtc: entry.nextTokenAtUtc,
        bombAvailableAtUtc: entry.bombAvailableAtUtc,
    }));
    const sorted = sortBombEntries(rows);

    return (
        <table className="min-w-0 text-sm">
            <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                    <th className="pr-4 pb-1">Player</th>
                    <th className="pr-4 pb-1">Bomb</th>
                    <th className="pb-1">Available At</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sorted.map(row => {
                    const hasData = row.tokens != undefined;
                    const hasBomb = hasData && row.bombAvailableAtUtc == undefined;
                    return (
                        <tr key={row.userId}>
                            <td className="py-0.5 pr-4 font-medium" title={row.userId}>
                                {row.displayName}
                            </td>
                            <td className="py-0.5 pr-4">
                                {hasData ? (
                                    hasBomb ? (
                                        <span className="font-semibold text-green-600 dark:text-green-400">Yes</span>
                                    ) : (
                                        <span className="text-red-500 dark:text-red-400">No</span>
                                    )
                                ) : (
                                    <span className="text-gray-400">—</span>
                                )}
                            </td>
                            <td className="py-0.5 text-gray-500 tabular-nums">
                                {row.bombAvailableAtUtc == undefined ? '—' : formatTime(row.bombAvailableAtUtc)}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export const OverviewTab = ({
    currentData,
    names,
}: {
    currentData: TacticusGuildRaidResponse | undefined;
    names: Map<string, string>;
}) => {
    const [tokens, setTokens] = useState<GuildTokenEntry[] | typeof LOADING>(cachedTokens ?? LOADING);

    useEffect(() => {
        if (cachedTokens !== undefined) return;
        makeApiCall<GuildTokenEntry[]>('GET', 'guild/tokens').then(({ data }) => {
            if (data) {
                cachedTokens = data;
                setTokens(data);
            }
        });
    }, []);

    const tokenData = tokens === LOADING ? undefined : tokens;

    return (
        <div className="flex flex-col gap-8">
            <DebugJson label="guild/tokens" value={tokenData ?? 'loading\u2026'} />
            <section className="flex flex-col gap-3">
                <h2 className="text-base font-semibold">Current Boss</h2>
                <CurrentBoss data={currentData} />
            </section>

            <div className="flex flex-wrap gap-8">
                <section className="flex flex-col gap-3">
                    <h2 className="text-base font-semibold">Raid Tokens</h2>
                    {tokenData === undefined ? (
                        <p className="text-sm text-gray-500">Loading…</p>
                    ) : (
                        <TokenTable entries={tokenData} names={names} />
                    )}
                </section>

                <section className="flex flex-col gap-3">
                    <h2 className="text-base font-semibold">Bombs</h2>
                    {tokenData === undefined ? (
                        <p className="text-sm text-gray-500">Loading…</p>
                    ) : (
                        <BombTable entries={tokenData} names={names} />
                    )}
                </section>
            </div>
        </div>
    );
};
