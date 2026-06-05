/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useMemo } from 'react';

import { snowprintIcons } from '@/fsd/5-shared/assets';
import {
    TacticusDamageType,
    type TacticusGuildRaidEntry,
    type TacticusGuildRaidResponse,
} from '@/fsd/5-shared/lib/tacticus-api';
import { RarityIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character/characters.service';
import { MowsService } from '@/fsd/4-entities/mow/mows.service';

import { buildLoopCountMaps, getDamageColorClass, obfuscateUserId, unitRoundIconMap } from './guild-performance.utils';

// ---------------------------------------------------------------------------
// Season / Player selects (shared across tabs, owned by the page)
// ---------------------------------------------------------------------------

export const SeasonSelect = ({
    seasons,
    value,
    onChange,
}: {
    seasons: number[];
    value: number | undefined;
    onChange: (season: number) => void;
}) => (
    <label className="flex flex-col gap-0.5 text-xs">
        <span className="font-semibold text-gray-500 uppercase dark:text-gray-400">Season</span>
        <select
            value={value ?? ''}
            onChange={event => {
                onChange(Number(event.target.value));
            }}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900">
            {seasons.map(season => (
                <option key={season} value={season}>
                    Season {season}
                </option>
            ))}
        </select>
    </label>
);

export const PlayerSelect = ({
    players,
    value,
    onChange,
}: {
    players: { userId: string; displayName: string }[];
    value: string | undefined;
    onChange: (userId: string | undefined) => void;
}) => (
    <label className="flex flex-col gap-0.5 text-xs">
        <span className="font-semibold text-gray-500 uppercase dark:text-gray-400">Player</span>
        <select
            value={value ?? ''}
            onChange={event => {
                onChange(event.target.value === '' ? undefined : event.target.value);
            }}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900">
            <option value="">All players</option>
            {players.map(player => (
                <option key={player.userId} value={player.userId}>
                    {player.displayName}
                </option>
            ))}
        </select>
    </label>
);

// ---------------------------------------------------------------------------
// NoKeyMessage
// ---------------------------------------------------------------------------

export const NoKeyMessage = () => (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
        <p className="max-w-prose text-base">
            This page is only available to guild leaders. If you are a guild leader, please obtain a guild API key from{' '}
            <a
                href="https://api.tacticusgame.com"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                https://api.tacticusgame.com
            </a>{' '}
            and register it in the user menu.
        </p>
    </div>
);

export { DebugJson } from '@/fsd/5-shared/ui';

// ---------------------------------------------------------------------------
// CompIcons
// ---------------------------------------------------------------------------

/** Resolves a comp unitId to its portrait, trying character then machine-of-war. */
function resolveCompIcon(unitId: string): { icon: string; name: string } | undefined {
    const character = CharactersService.getUnit(unitId);
    if (character !== undefined) return { icon: character.roundIcon ?? '', name: character.name };
    const mow = MowsService.resolveToStatic(unitId);
    if (mow !== undefined) return { icon: mow.roundIcon ?? '', name: mow.name };
    return;
}

/** Renders comp portraits from a flat unitId list (heroes then MoW), resolving each id's type. */
export function CompIcons({ comp, size = 22 }: { comp: string[]; size?: number }) {
    return (
        <span className="flex items-center gap-0.5">
            {comp.flatMap((unitId, index) => {
                const resolved = resolveCompIcon(unitId);
                if (resolved === undefined) return [];
                return [
                    <UnitShardIcon
                        key={index}
                        icon={resolved.icon}
                        name={resolved.name}
                        tooltip={resolved.name}
                        width={size}
                        height={size}
                    />,
                ];
            })}
        </span>
    );
}

// ---------------------------------------------------------------------------
// EntryRow
// ---------------------------------------------------------------------------

export const EntryRow = ({
    entry,
    names,
    raidCount,
    bombCount,
    avgDamage,
}: {
    entry: TacticusGuildRaidEntry;
    names: Map<string, string>;
    raidCount: number;
    bombCount: number;
    avgDamage: number | undefined;
}) => {
    const isBomb = entry.damageType === TacticusDamageType.Bomb;
    const displayName = names.get(entry.userId) ?? obfuscateUserId(entry.userId);
    const heroes = entry.heroDetails.map(u => CharactersService.getUnit(u.unitId)).filter(c => c !== undefined);
    const mow = entry.machineOfWarDetails?.unitId
        ? MowsService.resolveToStatic(entry.machineOfWarDetails.unitId)
        : undefined;
    const hpPct = entry.maxHp > 0 ? (entry.remainingHp / entry.maxHp) * 100 : 0;
    const damageColorClass = getDamageColorClass(entry, avgDamage);

    const bossIcon = (() => {
        const mappedIcon = unitRoundIconMap[entry.unitId];
        if (mappedIcon)
            return (
                <UnitShardIcon icon={mappedIcon} name={entry.unitId} tooltip={entry.unitId} width={28} height={28} />
            );
        const match = /(?:MiniBoss|Minion)\d+(.+)/.exec(entry.unitId);
        if (match) {
            const id = match[1].charAt(0).toLowerCase() + match[1].slice(1);
            const character = CharactersService.getUnit(id);
            if (character)
                return (
                    <UnitShardIcon
                        icon={character.roundIcon ?? ''}
                        name={character.name}
                        tooltip={character.name}
                        width={28}
                        height={28}
                    />
                );
        }
        return <span className="text-xs text-gray-500">{entry.unitId}</span>;
    })();

    return (
        <div className="grid grid-cols-[24px_20px_18px_1fr_auto_auto_5rem_8rem_3rem_3rem] items-center gap-x-2 rounded border border-gray-200 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900">
            <span className="flex items-center justify-center">{bossIcon}</span>
            <span className="flex items-center justify-center">
                <RarityIcon rarity={entry.rarity} />
            </span>
            <span className="flex items-center justify-center">
                <img
                    src={isBomb ? snowprintIcons.bombToken.file : snowprintIcons.guildRaidToken.file}
                    alt={isBomb ? 'Bomb' : 'Raid'}
                    title={isBomb ? 'Bomb' : 'Raid'}
                    className="h-4 w-4 object-contain"
                />
            </span>
            <span className="min-w-0 truncate font-medium" title={entry.userId}>
                {displayName}
            </span>
            <span className="flex items-center gap-0.5">
                {heroes.map((hero, index) => (
                    <UnitShardIcon
                        key={index}
                        icon={hero!.roundIcon ?? ''}
                        name={hero!.name}
                        tooltip={hero!.name}
                        width={22}
                        height={22}
                    />
                ))}
                {mow && (
                    <UnitShardIcon
                        icon={mow.roundIcon ?? ''}
                        name={mow.name}
                        tooltip={mow.name}
                        width={22}
                        height={22}
                    />
                )}
                {!isBomb && heroes.length === 0 && !mow && <span className="text-xs text-gray-400">—</span>}
            </span>
            <span className="text-xs text-gray-500 tabular-nums">
                {entry.completedOn
                    ? new Date(entry.completedOn * 1000).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                      })
                    : '—'}
            </span>
            <span className={`text-right tabular-nums ${damageColorClass}`}>+{entry.damageDealt.toLocaleString()}</span>
            <span className="flex flex-col gap-0.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div className="h-full bg-red-500 dark:bg-red-400" style={{ width: `${hpPct}%` }} />
                </div>
                <span className="text-right text-xs text-gray-400 tabular-nums">
                    {entry.remainingHp.toLocaleString()}/{entry.maxHp.toLocaleString()}
                </span>
            </span>
            <span className="text-right text-xs text-gray-500 tabular-nums">{raidCount}</span>
            <span className="text-right text-xs text-gray-500 tabular-nums">{bombCount}</span>
        </div>
    );
};

// ---------------------------------------------------------------------------
// RaidTable
// ---------------------------------------------------------------------------

export const RaidTable = ({
    data,
    names,
    label,
    avgDamageMap,
    displayEntries,
}: {
    data: TacticusGuildRaidResponse | undefined;
    names: Map<string, string>;
    label: string;
    avgDamageMap: Map<string, number>;
    /** When provided, only these entries are rendered; loop counts still use all of `data.entries`. */
    displayEntries?: TacticusGuildRaidEntry[];
}) => {
    const entries = data?.entries ?? [];
    const renderEntries = displayEntries ?? entries;

    const sorted = useMemo(() => {
        const source = displayEntries ?? data?.entries ?? [];
        return [...source].toSorted((a, b) => (b.completedOn ?? 0) - (a.completedOn ?? 0));
    }, [data, displayEntries]);

    const { loopRaidNumber, loopBombNumber } = useMemo(() => buildLoopCountMaps(data?.entries ?? []), [data]);

    if (data === undefined) return <p className="text-sm text-gray-500">Loading…</p>;

    const shownCount = renderEntries.length;
    const totalCount = entries.length;

    return (
        <section className="flex max-w-4xl flex-col gap-2">
            <h2 className="text-base font-semibold">
                {label}{' '}
                <span className="text-xs font-normal text-gray-500">
                    Season {data.season} · {shownCount < totalCount ? `${shownCount} of ${totalCount}` : totalCount}{' '}
                    entries
                </span>
            </h2>
            <div className="grid grid-cols-[24px_20px_18px_1fr_auto_auto_5rem_8rem_3rem_3rem] gap-x-2 px-2 text-xs font-semibold text-gray-500 uppercase">
                <span>Boss</span>
                <span />
                <span />
                <span>Player</span>
                <span>Comp</span>
                <span>Completed</span>
                <span className="text-right">Damage</span>
                <span>HP Remaining</span>
                <span className="text-right">Raids</span>
                <span className="text-right">Bombs</span>
            </div>
            <div className="flex flex-col gap-1">
                {sorted.map((entry, index) => (
                    <EntryRow
                        key={index}
                        entry={entry}
                        names={names}
                        raidCount={loopRaidNumber.get(entry) ?? 0}
                        bombCount={loopBombNumber.get(entry) ?? 0}
                        avgDamage={avgDamageMap.get(`${entry.unitId}:${entry.rarity}`)}
                    />
                ))}
            </div>
        </section>
    );
};
