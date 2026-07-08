/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
/* eslint-disable boundaries/element-types -- cross-page import for shared guild data */
import { useState } from 'react';

import { obfuscateUserId } from '@/fsd/5-shared/lib';
import type { TacticusGuildRaidResponse } from '@/fsd/5-shared/lib/tacticus-api';
import { RarityMapper, type Rarity } from '@/fsd/5-shared/model';
import { RarityIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import {
    formatAbilityName,
    getModifierIcon,
    getModifierPortraitUrl,
    getModifierTitle,
    guildBossData,
} from '@/fsd/4-entities/guild_boss';
import { NpcPortrait } from '@/fsd/4-entities/npc';

import { AbilityText } from '@/fsd/3-features/character-details/ability-text-renderer';

import {
    ALL_RAID_COMPS,
    type RaidComp,
} from '@/fsd/1-pages/input-guild-roster-snapshots/guild-roster-snapshots.models';
import { getRaidCompIconProps } from '@/fsd/1-pages/input-guild-roster-snapshots/raid-comp-icon';

import type { GuildTokenEntry } from '../guild-performance.types';
import {
    formatTime,
    resolveBossOverviewDisplay,
    sortBombEntries,
    sortTokenEntries,
    type BossDisplayHp,
    type PrimeDisplay,
} from '../guild-performance.utils';

const HpBar = ({ hp }: { hp: BossDisplayHp }) => {
    if (hp.kind === 'fullUnknown') {
        return (
            <div className="flex flex-col gap-0.5">
                <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div className="h-full w-full bg-red-500 dark:bg-red-400" />
                </div>
                <span className="text-xs text-zinc-500 tabular-nums">Full HP</span>
            </div>
        );
    }
    if (hp.kind === 'full') {
        return (
            <div className="flex flex-col gap-0.5">
                <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div className="h-full w-full bg-red-500 dark:bg-red-400" />
                </div>
                <span className="text-xs text-zinc-500 tabular-nums">
                    {hp.max.toLocaleString()} / {hp.max.toLocaleString()} HP Remaining
                </span>
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
                {hp.remaining.toLocaleString()} / {hp.max.toLocaleString()} HP Remaining
            </span>
        </div>
    );
};

const PrimePanel = ({ prime, rarity }: { prime: PrimeDisplay; rarity: Rarity }) => {
    return (
        <div className="flex w-56 shrink-0 flex-col items-center gap-2 text-center">
            {prime.fakeChar ? (
                <div className="h-[154px] w-[121px] overflow-hidden">
                    <div className="h-[307px] w-[242px] origin-top-left scale-50">
                        <NpcPortrait
                            id={prime.fakeChar.id}
                            rank={prime.fakeChar.rank}
                            stars={prime.fakeChar.stars}
                            customPortraitUrl={prime.portraitUrl}
                            rarity={prime.fakeChar.rarity}
                        />
                    </div>
                </div>
            ) : prime.portraitUrl ? (
                <img src={prime.portraitUrl} alt={prime.displayName} className="size-14 rounded object-cover" />
            ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-zinc-200 text-[10px] text-zinc-500 dark:bg-zinc-700">
                    {prime.displayName}
                </div>
            )}
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{prime.displayName}</p>
            <div className="w-full max-w-56">
                <HpBar hp={prime.hp} />
            </div>
            {prime.modifierProgress && (
                <div className="flex w-full max-w-56 flex-col items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="tabular-nums">
                        {prime.modifierProgress.modifiersHit} / {prime.modifierProgress.totalModifiers} modifiers hit
                    </span>
                    {prime.modifierProgress.nextTarget &&
                        (() => {
                            const { modifierKey, remainingHp, description } = prime.modifierProgress.nextTarget;
                            const modifierDefinition = guildBossData.modifiers[modifierKey];
                            const title = modifierDefinition
                                ? getModifierTitle(modifierDefinition)
                                : formatAbilityName(modifierKey);
                            const portraitIconUrl = modifierDefinition
                                ? getModifierPortraitUrl(modifierDefinition)
                                : undefined;
                            const abilityIcons = modifierDefinition ? getModifierIcon(modifierDefinition) : undefined;
                            return (
                                <div className="w-full rounded-md bg-(--ability-panel) p-2 text-left">
                                    <div className="flex items-start gap-2">
                                        {portraitIconUrl ? (
                                            <img src={portraitIconUrl} alt={title} className="h-8 w-8 shrink-0" />
                                        ) : (
                                            abilityIcons?.map((icon, index) => (
                                                <img
                                                    key={index}
                                                    src={icon.file}
                                                    alt={icon.name}
                                                    className="h-8 w-8 shrink-0"
                                                />
                                            ))
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-0.5 flex items-center justify-between gap-1">
                                                <span className="text-xs font-semibold text-(--fg)">{title}</span>
                                                <span className="shrink-0 text-[10px] text-(--fg-muted) tabular-nums">
                                                    next at {remainingHp.toLocaleString()} HP
                                                </span>
                                            </div>
                                            <AbilityText
                                                text={description}
                                                level={1}
                                                variables={{}}
                                                constants={{}}
                                                scaledVariableNames={[]}
                                                rarity={rarity}
                                                unitName=""
                                                factionId=""
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                </div>
            )}
        </div>
    );
};

const CurrentBoss = ({ data }: { data: TacticusGuildRaidResponse | undefined }) => {
    if (data === undefined) return <p className="text-sm text-zinc-500">Loading…</p>;

    const entries = data.entries ?? [];
    const display = resolveBossOverviewDisplay(entries, data.seasonConfigId);
    if (!display) return <p className="text-sm text-zinc-500">No boss data yet.</p>;

    const rarityName = RarityMapper.rarityToRarityString(display.rarity);
    const tierLabel = `${rarityName} ${display.tierSetIndex + 1}`;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                <RarityIcon rarity={display.rarity} />
                <span>{tierLabel}</span>
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
                {display.leftPrime && (
                    <div className="md:pt-6">
                        <PrimePanel prime={display.leftPrime} rarity={display.rarity} />
                    </div>
                )}
                <div className="flex flex-col items-center gap-2">
                    {display.boss.fakeChar ? (
                        <div className="h-[154px] w-[121px] overflow-hidden">
                            <div className="h-[307px] w-[242px] origin-top-left scale-50">
                                <NpcPortrait
                                    id={display.boss.fakeChar.id}
                                    rank={display.boss.fakeChar.rank}
                                    stars={display.boss.fakeChar.stars}
                                    customPortraitUrl={display.boss.portraitUrl}
                                    rarity={display.boss.fakeChar.rarity}
                                />
                            </div>
                        </div>
                    ) : display.boss.portraitUrl ? (
                        <img
                            src={display.boss.portraitUrl}
                            alt={display.boss.displayName}
                            className="w-28 shrink-0 rounded-lg object-cover shadow"
                        />
                    ) : (
                        <div className="flex h-48 w-28 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-xs text-zinc-500 dark:bg-zinc-700">
                            {display.boss.displayName}
                        </div>
                    )}
                    {display.isNextBoss && (
                        <p className="text-xs font-medium tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
                            Next boss
                        </p>
                    )}
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{display.boss.displayName}</p>
                    <div className="w-full max-w-48">
                        <HpBar hp={display.boss.hp} />
                    </div>
                </div>
                {display.rightPrime && (
                    <div className="md:pt-6">
                        <PrimePanel prime={display.rightPrime} rarity={display.rarity} />
                    </div>
                )}
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
    const effectiveSelectedComp = hasAnyComps ? selectedComp : undefined;

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
                    {hasAnyComps && <CompFilterBar selected={effectiveSelectedComp} onSelect={setSelectedComp} />}
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
                            selectedComp={effectiveSelectedComp}
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
