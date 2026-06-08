/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { makeApiCall } from '@/fsd/5-shared/api';
import {
    TacticusDamageType,
    getTacticusGuildData,
    safeParseSharedLeaderboards,
    SeasonFetchStatus,
    type GuildSeasonHistoryEntry,
    type GuildSeasonHistoryResponse,
    type SharedLeaderboardsResponse,
    type TacticusGuildRaidResponse,
} from '@/fsd/5-shared/lib/tacticus-api';
import { useAuth } from '@/fsd/5-shared/model';

import {
    type CurrentSeasonRaidApiResponse,
    type GuildPerformanceIndexApiResponse,
    type GuildRaidSeasonsResponse,
    type HistoricalSeasonApiResponse,
    getGuildPerformanceIndexApi,
    getGuildRaidSeasonApi,
    getGuildRaidSeasonsApi,
} from './guild-performance.api';
import { LOADING, type GuildMemberName, type GuildTokenEntry, type LoadingOrData } from './guild-performance.types';
import { buildAvgDamageMap, getAllGuildPlayers } from './guild-performance.utils';

// ---------------------------------------------------------------------------
// Module-level cache — persists across navigations within a session
// ---------------------------------------------------------------------------

let cachedCurrent: TacticusGuildRaidResponse | undefined;
let cachedSeasonList: GuildRaidSeasonsResponse | undefined;
let cachedPerformanceIndex: GuildPerformanceIndexApiResponse | undefined;
// Map<seasonNumber, GuildSeasonHistoryEntry> — populated on-demand per season
let cachedSeasonDataMap: Map<number, GuildSeasonHistoryEntry> = new Map();
let cachedSharedLeaderboards: SharedLeaderboardsResponse | undefined;
let cachedGuildInfo: { tag: string; name: string } | undefined;
let cachedNames: Map<string, string> | undefined;
let cachedRawNames: GuildMemberName[] | undefined;
let cachedTokens: GuildTokenEntry[] | undefined;
/** Gates the one-shot auto-fetch (the cache vars above can legitimately stay undefined for members). */
let cachedFetched = false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function errorText(error: unknown): string | undefined {
    if (error === undefined) return undefined;
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    return String(error);
}

function isCurrentSeasonResponse(
    response: CurrentSeasonRaidApiResponse | HistoricalSeasonApiResponse
): response is CurrentSeasonRaidApiResponse {
    return 'raidResponse' in response;
}

function mapHistoricalApiResponse(response: HistoricalSeasonApiResponse): GuildSeasonHistoryEntry {
    return {
        season: response.season,
        status: response.status as SeasonFetchStatus,
        summary: response.summary as GuildSeasonHistoryEntry['summary'],
    };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGuildPerformance() {
    const { userInfo } = useAuth();
    const hasGuildApiKey = !!userInfo?.tacticusGuildApiKey;
    const hasGuildTag = !!userInfo?.guildTag;
    const isMember = !hasGuildApiKey && hasGuildTag;
    const hasAccess = hasGuildApiKey || hasGuildTag;
    const ownUserId = userInfo?.tacticusUserId;
    const memberUserId = isMember && ownUserId ? ownUserId : undefined;

    const authIdentity = `${userInfo?.tacticusGuildApiKey ?? ''}|${userInfo?.tacticusUserId ?? ''}|${userInfo?.guildTag ?? ''}`;
    const previousIdentityReference = useRef<string | undefined>(undefined);

    const [current, setCurrent] = useState<LoadingOrData<TacticusGuildRaidResponse>>(cachedCurrent ?? LOADING);
    const [performanceIndex, setPerformanceIndex] = useState<GuildPerformanceIndexApiResponse | undefined>(
        cachedPerformanceIndex
    );
    const [seasonList, setSeasonList] = useState<GuildRaidSeasonsResponse | undefined>(cachedSeasonList);
    const [seasonDataMap, setSeasonDataMap] = useState<Map<number, GuildSeasonHistoryEntry>>(cachedSeasonDataMap);
    const [sharedLeaderboards, setSharedLeaderboards] = useState<SharedLeaderboardsResponse | undefined>(
        cachedSharedLeaderboards
    );
    const [guildInfo, setGuildInfo] = useState<{ tag: string; name: string } | undefined>(cachedGuildInfo);
    const [historyError, setHistoryError] = useState<string | undefined>();
    const [names, setNames] = useState<Map<string, string>>(cachedNames ?? new Map());
    const [rawNames, setRawNames] = useState<GuildMemberName[] | undefined>(cachedRawNames);
    const [tokens, setTokens] = useState<GuildTokenEntry[] | typeof LOADING>(cachedTokens ?? LOADING);
    const [tokenError, setTokenError] = useState<string | undefined>();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingHistoricalSeason, setIsLoadingHistoricalSeason] = useState(false);

    // Reset all caches when auth identity changes
    useEffect(() => {
        const previous = previousIdentityReference.current;
        previousIdentityReference.current = authIdentity;
        if (previous === undefined || previous === authIdentity) return;
        cachedCurrent = undefined;
        cachedSeasonList = undefined;
        cachedSeasonDataMap = new Map();
        cachedSharedLeaderboards = undefined;
        cachedGuildInfo = undefined;
        cachedNames = undefined;
        cachedRawNames = undefined;
        cachedTokens = undefined;
        cachedPerformanceIndex = undefined;
        cachedFetched = false;
        setCurrent(LOADING);
        setSeasonList(undefined);
        setSeasonDataMap(new Map());
        setSharedLeaderboards(undefined);
        setGuildInfo(undefined);
        setHistoryError(undefined);
        setNames(new Map());
        setRawNames(undefined);
        setTokens(LOADING);
        setTokenError(undefined);
        setPerformanceIndex(undefined);
    }, [authIdentity]);

    const currentData = current === LOADING ? undefined : current;
    const tokenData = tokens === LOADING ? undefined : tokens;

    // Computed season history (backward-compat shape for tabs)
    const seasonHistory = useMemo((): GuildSeasonHistoryResponse => {
        const seasonData = [...seasonDataMap.values()].toSorted((a, b) => a.season - b.season);
        return { sequenceNumber: 0, seasonData };
    }, [seasonDataMap]);

    // All seasons known from the list + whatever is in the data map
    const availableSeasons = useMemo(() => {
        const set = new Set<number>();
        if (seasonList?.currentSeason != undefined) set.add(seasonList.currentSeason);
        for (const entry of seasonList?.seasons ?? []) set.add(entry.season);
        for (const season of seasonDataMap.keys()) set.add(season);
        if (currentData?.season != undefined) set.add(currentData.season);
        return [...set].toSorted((a, b) => b - a);
    }, [seasonList, seasonDataMap, currentData]);

    const allPlayers = useMemo(
        () => getAllGuildPlayers(currentData?.entries ?? [], seasonHistory.seasonData, names),
        [currentData, seasonHistory, names]
    );

    const avgDamageMap = useMemo(() => {
        const allEntries = (currentData?.entries ?? []).filter(
            entry => entry.damageType !== TacticusDamageType.Bomb && entry.remainingHp !== 0
        );
        return buildAvgDamageMap(allEntries);
    }, [currentData]);

    const refreshSharedLeaderboards = useCallback(async () => {
        const response = await makeApiCall<unknown>('GET', 'guild/sharedLeaderboards');
        const parsedSharedLb = response.data === undefined ? undefined : safeParseSharedLeaderboards(response.data);
        cachedSharedLeaderboards = parsedSharedLb?.success ? parsedSharedLb.data : undefined;
        setSharedLeaderboards(cachedSharedLeaderboards);
    }, []);

    /**
     * Fetch (or re-fetch) current-season data plus the season list, names, tokens, and shared
     * leaderboards.  Pass `forceRefreshAfter = Date.now()` to bypass the backend cache for the
     * current season only.
     */
    const fetchData = useCallback(
        async (forceRefreshAfter?: number) => {
            setIsRefreshing(true);
            try {
                const [seasonsResponse, namesResponse, tokensResponse, sharedLbResponse, guildResponse, piResponse] =
                    await Promise.all([
                        getGuildRaidSeasonsApi(),
                        makeApiCall<GuildMemberName[]>('GET', 'guild/members/names'),
                        makeApiCall<GuildTokenEntry[]>('GET', 'guild/tokens'),
                        makeApiCall<unknown>('GET', 'guild/sharedLeaderboards'),
                        getTacticusGuildData(),
                        getGuildPerformanceIndexApi(),
                    ]);

                // --- season list ---
                if (seasonsResponse.data) {
                    cachedSeasonList = seasonsResponse.data;
                    setSeasonList(cachedSeasonList);
                }

                // --- current season ---
                const currentSeasonNumber = seasonsResponse.data?.currentSeason;
                if (currentSeasonNumber != undefined) {
                    const seasonResponse = await getGuildRaidSeasonApi(currentSeasonNumber, forceRefreshAfter);
                    if (seasonResponse.data) {
                        if (isCurrentSeasonResponse(seasonResponse.data)) {
                            // Guild leader: raw per-hit Tacticus response
                            const raw = seasonResponse.data.raidResponse as unknown as
                                | TacticusGuildRaidResponse
                                | undefined;
                            if (raw) {
                                cachedCurrent = raw;
                                setCurrent(raw);
                            }
                        } else {
                            // Keyless member: anonymized summary — goes into the season data map
                            const entry = mapHistoricalApiResponse(seasonResponse.data);
                            cachedSeasonDataMap = new Map(cachedSeasonDataMap).set(entry.season, entry);
                            setSeasonDataMap(new Map(cachedSeasonDataMap));
                        }
                    }
                }

                // --- names ---
                const nameMap = new Map<string, string>();
                for (const member of namesResponse.data ?? []) {
                    if (member.name) nameMap.set(member.userId, member.name);
                }
                if (isMember && ownUserId) nameMap.set(ownUserId, nameMap.get(ownUserId) ?? 'You');
                cachedRawNames = namesResponse.data;
                setRawNames(namesResponse.data);
                cachedNames = nameMap;
                setNames(nameMap);

                // Surface a backend access error when no data at all
                if (isMember && !seasonsResponse.data && !cachedSeasonList) {
                    setHistoryError(errorText(seasonsResponse.error) ?? 'Unable to load season data');
                } else {
                    setHistoryError(undefined);
                }

                // --- tokens ---
                if (tokensResponse.data) {
                    cachedTokens = tokensResponse.data;
                    setTokens(tokensResponse.data);
                    setTokenError(undefined);
                } else if (tokensResponse.error) {
                    const error = tokensResponse.error;
                    setTokenError(typeof error === 'string' ? error : ((error as Error).message ?? 'Unknown error'));
                    setTokens([]);
                }

                // --- shared leaderboards ---
                const parsedSharedLb =
                    sharedLbResponse.data === undefined
                        ? undefined
                        : safeParseSharedLeaderboards(sharedLbResponse.data);
                cachedSharedLeaderboards = parsedSharedLb?.success ? parsedSharedLb.data : undefined;
                setSharedLeaderboards(cachedSharedLeaderboards);

                // --- guild info ---
                if (guildResponse.data?.guild) {
                    const { guildTag, name } = guildResponse.data.guild;
                    cachedGuildInfo = { tag: guildTag, name };
                    setGuildInfo({ tag: guildTag, name });
                }

                // --- performance index ---
                if (piResponse.data) {
                    cachedPerformanceIndex = piResponse.data;
                    setPerformanceIndex(cachedPerformanceIndex);
                }

                cachedFetched = true;
            } finally {
                setIsRefreshing(false);
            }
        },
        [isMember, ownUserId]
    );

    /**
     * Fetch a single historical season on demand.  No-ops if already cached.
     */
    const fetchSeasonData = useCallback(async (season: number) => {
        if (cachedSeasonDataMap.has(season)) return;
        setIsLoadingHistoricalSeason(true);
        try {
            const response = await getGuildRaidSeasonApi(season);
            if (response.data && !isCurrentSeasonResponse(response.data)) {
                const entry = mapHistoricalApiResponse(response.data);
                cachedSeasonDataMap = new Map(cachedSeasonDataMap).set(season, entry);
                setSeasonDataMap(new Map(cachedSeasonDataMap));
            }
        } finally {
            setIsLoadingHistoricalSeason(false);
        }
    }, []);

    useEffect(() => {
        if (!hasAccess) return;
        if (cachedFetched) return;
        void fetchData();
    }, [hasAccess, fetchData]);

    return {
        hasGuildApiKey,
        hasAccess,
        isMember,
        memberUserId,
        currentData,
        seasonList,
        seasonDataMap,
        seasonHistory,
        sharedLeaderboards,
        guildInfo,
        historyError,
        names,
        rawNames,
        tokenData,
        tokenError,
        isRefreshing,
        isLoadingHistoricalSeason,
        availableSeasons,
        allPlayers,
        avgDamageMap,
        performanceIndex,
        fetchData,
        fetchSeasonData,
        refreshSharedLeaderboards,
    };
}
