/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { makeApiCall } from '@/fsd/5-shared/api';
import { SeasonFetchStatus, type GuildSeasonSummary } from '@/fsd/5-shared/lib/tacticus-api';

export interface GuildSeasonEntry {
    season: number;
    status: SeasonFetchStatus;
    aggregatedAt?: string;
}

export interface GuildRaidSeasonsResponse {
    currentSeason?: number;
    guildTag: string;
    seasons: GuildSeasonEntry[];
}

export interface CurrentSeasonRaidApiResponse {
    season: number;
    raidResponse: Record<string, unknown>;
}

export interface HistoricalSeasonApiResponse {
    season: number;
    status: SeasonFetchStatus;
    summary?: GuildSeasonSummary;
    aggregatedAt?: string;
}

export const getGuildRaidSeasonsApi = () => makeApiCall<GuildRaidSeasonsResponse>('GET', 'guild/raid/seasons');

export const getGuildRaidSeasonApi = (season: number, forceRefreshAfter?: number) => {
    const query = forceRefreshAfter === undefined ? '' : `?forceRefreshAfter=${forceRefreshAfter}`;
    return makeApiCall<CurrentSeasonRaidApiResponse | HistoricalSeasonApiResponse>(
        'GET',
        `guild/raid/${season}${query}`
    );
};

export interface GuildPerformanceIndexPlayerEntry {
    playerId?: string | null;
    performanceIndex?: number;
}

export interface GuildSeasonPerformanceIndex {
    season?: number;
    playerEntries?: GuildPerformanceIndexPlayerEntry[];
}

export interface GuildPerformanceIndexApiResponse {
    guildTag?: string;
    entries?: GuildSeasonPerformanceIndex[];
}

export const getGuildPerformanceIndexApi = () =>
    makeApiCall<GuildPerformanceIndexApiResponse>('GET', 'guild/raid/performance-index');

export const getMemberCurrentRaidSeasonApi = () => makeApiCall<HistoricalSeasonApiResponse>('GET', 'guild/member/raid');

export const getMemberRaidSeasonApi = (season: number, forceRefreshAfter?: number) => {
    const query = forceRefreshAfter === undefined ? '' : `?forceRefreshAfter=${forceRefreshAfter}`;
    return makeApiCall<HistoricalSeasonApiResponse>('GET', `guild/member/raid/${season}${query}`);
};

export const getMemberPerformanceIndexApi = () =>
    makeApiCall<GuildPerformanceIndexApiResponse>('GET', 'guild/member/raid/performance-index');

export const getMemberSharedLeaderboardsApi = (season?: number) =>
    makeApiCall<unknown>(
        'GET',
        season == undefined ? 'guild/member/sharedLeaderboards' : `guild/member/sharedLeaderboards?season=${season}`
    );
