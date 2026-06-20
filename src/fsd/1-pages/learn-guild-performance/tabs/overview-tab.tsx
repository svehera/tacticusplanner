/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
/* eslint-disable boundaries/element-types -- cross-page import for shared guild data */
import { useState } from 'react';

import { obfuscateUserId } from '@/fsd/5-shared/lib';
import type { TacticusGuildRaidResponse } from '@/fsd/5-shared/lib/tacticus-api';
import { getImageUrl } from '@/fsd/5-shared/ui';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import {
    ALL_RAID_COMPS,
    type RaidComp,
} from '@/fsd/1-pages/input-guild-roster-snapshots/guild-roster-snapshots.models';
import { getRaidCompIconProps } from '@/fsd/1-pages/input-guild-roster-snapshots/raid-comp-icon';

import type { GuildTokenEntry } from '../guild-performance.types';
import {
    bossPortraitMap,
    formatTime,
    resolveBossDisplay,
    sortBombEntries,
    sortTokenEntries,
    type BossDisplayHp,
} from '../guild-performance.utils';

const HpBar = ({ hp }: { hp: BossDisplayHp }) => {
    if (hp.kind === 'fullUnknown') {
        return <span className="text-sm font-medium text-zinc-500">HP Full</span>;
    }
    if (hp.kind === 'full') {
        return (
            <div className="flex flex-col gap-0.5">
                <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div className="h-full bg-red-500 dark:bg-red-400" style={{ width: '100%' }} />
                </div>
                <span className="text-xs text-zinc-500 tabular-nums">HP Full / {hp.max.toLocaleString()}</span>
            </div>
        );
    }
    const pct = hp.max > 0 ? (hp.remaining / hp.max) * 100 : 0;
    return (
        <div className="flex flex-col gap-0.5">
            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div className="h-full bg-red-500 transition-all dark:bg-red-400" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-zinc-500 tabular-nums">
                {hp.remaining.toLocaleString()} / {hp.max.toLocaleString()}
            </span>
        </div>
    );
};

const CurrentBoss = ({ data }: { data: TacticusGuildRaidResponse | undefined }) => {
    if (data === undefined) return <p className="text-sm text-zinc-500">Loading…</p>;

    const entries = data.entries ?? [];
    const display = resolveBossDisplay(entries);
    if (!display) return <p className="text-sm text-zinc-500">No boss data yet.</p>;

    const portrait = bossPortraitMap[display.unitId];
    return (
        <div className="flex items-start gap-4">
            {portrait ? (
                <img
                    src={getImageUrl(portrait)}
                    alt={display.displayName}
                    className="w-48 shrink-0 rounded-lg object-cover shadow"
                />
            ) : (
                <div className="flex h-48 w-48 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-xs text-zinc-500 dark:bg-zinc-700">
                    {display.displayName}
                </div>
            )}
            <div className="flex flex-col gap-2 pt-1">
                {display.isNextBoss && (
                    <p className="text-xs font-medium tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
                        Next boss
                    </p>
                )}
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{display.displayName}</p>
                <HpBar hp={display.hp} />
            </div>
        </div>
    );
};

const CompFilterBar = ({
    selected,
    onSelect,
}: {
    selected: RaidComp | undefined;
    onSelect: (comp: RaidComp | undefined) => void;
}) => (
    <div className="flex flex-wrap gap-1">
        {ALL_RAID_COMPS.map(comp => {
            const { icon, name } = getRaidCompIconProps(comp);
            const isActive = selected === comp;
            return (
                <button
                    key={comp}
                    type="button"
                    title={comp}
                    onClick={() => onSelect(isActive ? undefined : comp)}
                    className={`rounded ring-2 transition-all ${isActive ? 'ring-(--primary) grayscale-0' : 'opacity-60 ring-transparent grayscale hover:opacity-90'}`}>
                    <UnitShardIcon icon={icon} name={name} width={28} height={28} />
                </button>
            );
        })}
    </div>
);

const TokenTable = ({
    entries,
    names,
    raidCompsMap,
    selectedComp,
}: {
    entries: GuildTokenEntry[];
    names: Map<string, string>;
    raidCompsMap: Map<string, RaidComp[]> | undefined;
    selectedComp: RaidComp | undefined;
}) => {
    const displayRows = entries.map(entry => ({
        userId: entry.userId,
        displayName: names.get(entry.userId) ?? entry.name ?? obfuscateUserId(entry.userId),
        tokens: entry.tokens,
        nextTokenAtUtc: entry.nextTokenAtUtc,
        bombAvailableAtUtc: entry.bombAvailableAtUtc,
    }));
    const filtered =
        selectedComp === undefined
            ? displayRows
            : displayRows.filter(r => (raidCompsMap?.get(r.userId) ?? []).includes(selectedComp));
    const sorted = sortTokenEntries(filtered).map(r => ({
        ...r,
        comps: raidCompsMap?.get(r.userId) ?? [],
    }));
    const showComps = raidCompsMap !== undefined;

    return (
        <table className="min-w-0 text-sm">
            <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                    <th className="pr-4 pb-1">Player</th>
                    {showComps && <th className="pr-4 pb-1">Teams</th>}
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
                        {showComps && (
                            <td className="py-0.5 pr-4">
                                <div className="flex flex-wrap gap-0.5">
                                    {row.comps.map(comp => {
                                        const { icon, name } = getRaidCompIconProps(comp);
                                        return (
                                            <UnitShardIcon
                                                key={comp}
                                                icon={icon}
                                                name={name}
                                                tooltip={comp}
                                                width={20}
                                                height={20}
                                            />
                                        );
                                    })}
                                </div>
                            </td>
                        )}
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
        displayName: names.get(entry.userId) ?? entry.name ?? obfuscateUserId(entry.userId),
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
    tokenData,
    tokenError,
    guildInfo,
    raidCompsMap,
}: {
    currentData: TacticusGuildRaidResponse | undefined;
    names: Map<string, string>;
    tokenData: GuildTokenEntry[] | undefined;
    tokenError: string | undefined;
    guildInfo?: { tag: string; name: string };
    raidCompsMap?: Map<string, RaidComp[]>;
}) => {
    const [selectedComp, setSelectedComp] = useState<RaidComp | undefined>();
    const hasAnyComps = raidCompsMap !== undefined && raidCompsMap.size > 0;

    return (
        <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-3">
                <h2 className="text-base font-semibold">Current Boss</h2>
                {guildInfo && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-mono font-semibold">[{guildInfo.tag}]</span> {guildInfo.name}
                    </p>
                )}
                <CurrentBoss data={currentData} />
            </section>

            <div className="flex flex-wrap gap-8">
                <section className="flex flex-col gap-3">
                    <h2 className="text-base font-semibold">Raid Tokens</h2>
                    {hasAnyComps && <CompFilterBar selected={selectedComp} onSelect={setSelectedComp} />}
                    {tokenData === undefined ? (
                        tokenError ? (
                            <p className="text-sm text-red-500">{tokenError}</p>
                        ) : (
                            <p className="text-sm text-gray-500">Loading…</p>
                        )
                    ) : (
                        <TokenTable
                            entries={tokenData}
                            names={names}
                            raidCompsMap={raidCompsMap}
                            selectedComp={selectedComp}
                        />
                    )}
                </section>

                <section className="flex flex-col gap-3">
                    <h2 className="text-base font-semibold">Bombs</h2>
                    {tokenData === undefined ? (
                        tokenError ? (
                            <p className="text-sm text-red-500">{tokenError}</p>
                        ) : (
                            <p className="text-sm text-gray-500">Loading…</p>
                        )
                    ) : (
                        <BombTable entries={tokenData} names={names} />
                    )}
                </section>
            </div>
        </div>
    );
};
