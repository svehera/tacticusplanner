/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { TacticusDamageType, type TacticusGuildRaidResponse } from '@/fsd/5-shared/lib/tacticus-api';

import type { GuildTokenUsageResponse } from '../guild-performance.api';
import { resolvePlayerName } from '../guild-performance.utils';

export type TokenEntry = { tokens: number; bombs: number };
export type PlayerSeasonLookup = Map<string, Map<number, TokenEntry>>;

export interface LookupAndSeasonsResult {
    lookup: PlayerSeasonLookup;
    seasons: number[];
    currentSeasonNumber: number | undefined;
}

export function buildLookupAndSeasons(
    tokenUsageData: GuildTokenUsageResponse | undefined,
    currentData: TacticusGuildRaidResponse | undefined
): LookupAndSeasonsResult {
    const lookup: PlayerSeasonLookup = new Map();
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

    return { lookup, seasons, currentSeasonNumber };
}

export function getPlayerIdsSorted(
    lookup: PlayerSeasonLookup,
    selectedPlayerId: string | undefined,
    names: Map<string, string>
): string[] {
    return [...lookup.keys()]
        .filter(userId => selectedPlayerId == undefined || userId === selectedPlayerId)
        .toSorted((a, b) => resolvePlayerName(a, names).localeCompare(resolvePlayerName(b, names)));
}

export function computeSeasonTokenStats(
    seasons: number[],
    playerIds: string[],
    lookup: PlayerSeasonLookup,
    currentSeasonNumber: number | undefined,
    colorMode: 'gradient' | 'threshold'
): Map<number, { min: number; max: number }> {
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
    return seasonTokenStats;
}
