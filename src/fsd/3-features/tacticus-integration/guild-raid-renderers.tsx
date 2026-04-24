import { ICellRendererParams } from 'ag-grid-community';
import React from 'react';

import {
    TacticusEncounterType,
    TacticusDamageType,
    TacticusGuildRaidEntry,
    TacticusGuildRaidUnit,
    // eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
} from '@/fsd/5-shared/lib/tacticus-api';
import { RarityIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharactersService } from '@/fsd/4-entities/character/characters.service';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { ICharacterData } from '@/fsd/4-entities/character/model';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IMowStatic2 } from '@/fsd/4-entities/mow/model';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MowsService } from '@/fsd/4-entities/mow/mows.service';

import { UserSummary, MAX_TOKEN, HOUR, MINUTE, millisecondsPerToken, getTimeUntilNextBomb } from './guild-raid.model';

const getEncounterTypeLabel = (type: TacticusEncounterType): string => {
    return type === TacticusEncounterType.Boss ? 'Boss' : 'Side Boss';
};

const getDamageTypeLabel = (type: TacticusDamageType): string => {
    return type === TacticusDamageType.Battle ? 'Battle' : 'Bomb';
};

export const HPBarRenderer: React.FC<{ value: number; data: TacticusGuildRaidEntry }> = ({ data }) => {
    const percentage = ((data.maxHp - data.remainingHp) / data.maxHp) * 100;
    const damagePercentage = (data.damageDealt / data.maxHp) * 100;

    return (
        <div className="w-full">
            <div className="mb-1 flex justify-between text-xs">
                <span>{Math.round(damagePercentage)}% damage</span>
                <span>
                    {data.remainingHp.toLocaleString()} / {data.maxHp.toLocaleString()} HP
                </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-200">
                <div className="h-2.5 rounded-full bg-red-600" style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

export const EncounterTypeRenderer: React.FC<{ value: TacticusEncounterType }> = ({ value }) => {
    const bgColor = value === TacticusEncounterType.Boss ? 'bg-red-100' : 'bg-amber-100';
    const textColor = value === TacticusEncounterType.Boss ? 'text-red-800' : 'text-amber-800';
    const icon = value === TacticusEncounterType.Boss ? '👑' : '⚔️';

    return (
        <span className={`rounded px-2 py-1 ${bgColor} ${textColor} flex items-center gap-1 text-xs font-medium`}>
            <span>{icon}</span>
            <span>{getEncounterTypeLabel(value)}</span>
        </span>
    );
};

export const DamageTypeRenderer: React.FC<{ value: TacticusDamageType }> = ({ value }) => {
    const bgColor = value === TacticusDamageType.Battle ? 'bg-blue-100' : 'bg-purple-100';
    const textColor = value === TacticusDamageType.Battle ? 'text-blue-800' : 'text-purple-800';
    const icon = value === TacticusDamageType.Battle ? '⚔️' : '💣';

    return (
        <span className={`rounded px-2 py-1 ${bgColor} ${textColor} flex items-center gap-1 text-xs font-medium`}>
            <span>{icon}</span>
            <span>{getDamageTypeLabel(value)}</span>
        </span>
    );
};

export const DurationRenderer: React.FC<{ data: TacticusGuildRaidEntry }> = ({ data }) => {
    if (!data.startedOn || !data.completedOn) return <span>N/A</span>;

    const startTime = new Date(data.startedOn * 1000);
    const endTime = new Date(data.completedOn * 1000);
    const durationMs = endTime.getTime() - startTime.getTime();

    const minutes = Math.floor(durationMs / 60_000);
    const seconds = Math.floor((durationMs % 60_000) / 1000);

    return (
        <span>
            {minutes}m {seconds}s
        </span>
    );
};

export const DateRenderer: React.FC<{ value: number | undefined }> = ({ value }) => {
    if (!value) return <span>-</span>;

    const date = new Date(value * 1000);
    return <span>{date.toLocaleString()}</span>;
};

const UnitIconRenderer: React.FC<{ value: ICharacterData[] | IMowStatic2[] }> = ({ value }) => {
    return (
        <span className="flex h-full items-center gap-1">
            {value.map((unit, index) => {
                return (
                    <UnitShardIcon
                        key={index}
                        icon={unit?.roundIcon ?? ''}
                        name={unit?.name ?? ''}
                        height={22}
                        width={22}
                        tooltip={unit?.name ?? ''}
                    />
                );
            })}
        </span>
    );
};

export const RarityColumnRenderer = (props: ICellRendererParams<TacticusGuildRaidEntry>) => {
    const rarity = props.value ?? 0;
    return <RarityIcon rarity={rarity} />;
};

export const HeroesColumnRenderer = (params: ICellRendererParams<TacticusGuildRaidEntry>) => {
    const heroes = params.data?.heroDetails
        .map((unit: TacticusGuildRaidUnit) => CharactersService.getUnit(unit.unitId))
        .filter((character): character is ICharacterData => character !== undefined);
    return <UnitIconRenderer value={heroes ?? []} />;
};

export const MoWColumnRenderer = (params: ICellRendererParams<TacticusGuildRaidEntry>) => {
    const mow = params.data?.machineOfWarDetails?.unitId
        ? MowsService.resolveToStatic(params.data.machineOfWarDetails.unitId)
        : undefined;
    const mowArray = mow ? [mow] : [];
    return <UnitIconRenderer value={mowArray} />;
};

export const TopHeroesColumnRenderer = (params: ICellRendererParams<UserSummary>) => {
    const topHeroes = [...params.value.entries()]
        .toSorted((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key]) => CharactersService.getUnit(key))
        .filter((character): character is ICharacterData => character !== undefined);
    return <UnitIconRenderer value={topHeroes} />;
};

export const TopMoWColumnRenderer = (params: ICellRendererParams<UserSummary>) => {
    const topMoW = [...params.value.entries()]
        .toSorted((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([key]) => MowsService.resolveToStatic(key))
        .filter((mow): mow is IMowStatic2 => mow !== undefined);
    return <UnitIconRenderer value={topMoW} />;
};

export const BombStatusRenderer: React.FC<{ data: UserSummary }> = ({ data }) => {
    const timeUntilNext = getTimeUntilNextBomb(data);

    if (timeUntilNext === 0) {
        return <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800">Available</span>;
    }

    const hoursLeft = Math.floor(timeUntilNext / HOUR);
    const minutesLeft = Math.floor((timeUntilNext % HOUR) / MINUTE);

    return (
        <span className="text-sm">
            {hoursLeft}h {minutesLeft}m
        </span>
    );
};

export const TokenStatusRenderer: React.FC<{ data: UserSummary }> = ({ data }) => {
    const tokenStatus = data.tokenStatus;
    const now = Date.now();

    if (tokenStatus.count === MAX_TOKEN) {
        return (
            <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                {tokenStatus.count} tokens available
            </span>
        );
    } else {
        const timeReloading = now - tokenStatus.reloadStart;
        const cooldown = millisecondsPerToken - timeReloading;
        const hoursCooldown = Math.round(cooldown / HOUR);
        if (tokenStatus.count === 0) return <span className="text-sm">no token, {hoursCooldown}h cooldown</span>;
        return (
            <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                {tokenStatus.count} token{tokenStatus.count > 1 ? 's' : ''}, {hoursCooldown}h cooldown
            </span>
        );
    }
};
