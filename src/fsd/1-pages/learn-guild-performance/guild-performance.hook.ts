/* eslint-disable import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
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
    getGuildOverridesCached,
    invalidateGuildOverridesCache,
} from '../input-guild-roster-snapshots/guild-overrides.cache';
import { type RaidComp } from '../input-guild-roster-snapshots/guild-roster-snapshots.models';

import {
    type CurrentSeasonRaidApiResponse,
    type GuildPerformanceIndexApiResponse,
    type GuildRaidSeasonsResponse,
    type GuildTokenUsageResponse,
    type HistoricalSeasonApiResponse,
    getGuildPerformanceIndexApi,
    getGuildRaidSeasonApi,
    getGuildRaidSeasonsApi,
    getGuildTokenUsageApi,
    getMemberCurrentRaidSeasonApi,
    getMemberPerformanceIndexApi,
    getMemberRaidSeasonApi,
    getMemberSharedLeaderboardsApi,
    getMemberTokenUsageApi,
} from './guild-performance.api';
import { LOADING, type GuildMemberName, type GuildTokenEntry, type LoadingOrData } from './guild-performance.types';
import { buildAvgDamageMap, getAllGuildPlayers } from './guild-performance.utils';

// ---------------------------------------------------------------------------
// Module-level cache — persists across navigations within a session
// ---------------------------------------------------------------------------

let cachedCurrent: TacticusGuildRaidResponse | undefined;
let cachedSeasonList: GuildRaidSeasonsResponse | undefined;
let cachedPerformanceIndex: GuildPerformanceIndexApiResponse | undefined;
let cachedTokenUsageData: GuildTokenUsageResponse | undefined;
// Map<seasonNumber, GuildSeasonHistoryEntry> — populated on-demand per season
let cachedSeasonDataMap: Map<number, GuildSeasonHistoryEntry> = new Map();
let cachedSharedLeaderboards: SharedLeaderboardsResponse | undefined;
let cachedGuildInfo: { tag: string; name: string } | undefined;
let cachedNames: Map<string, string> | undefined;
let cachedRawNames: GuildMemberName[] | undefined;
let cachedTokens: GuildTokenEntry[] | undefined;
let cachedRaidCompsMap: Map<string, RaidComp[]> | undefined;
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
    const [tokenUsageData, setTokenUsageData] = useState<GuildTokenUsageResponse | undefined>(cachedTokenUsageData);
    const [raidCompsMap, setRaidCompsMap] = useState<Map<string, RaidComp[]> | undefined>(cachedRaidCompsMap);
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
        cachedTokenUsageData = undefined;
        cachedRaidCompsMap = undefined;
        invalidateGuildOverridesCache();
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
        setTokenUsageData(undefined);
        setRaidCompsMap(undefined);
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

    const refreshSharedLeaderboards = useCallback(
        async (season?: number) => {
            const response = isMember
                ? await getMemberSharedLeaderboardsApi(season)
                : await makeApiCall<unknown>('GET', 'guild/sharedLeaderboards');
            const parsedSharedLb = response.data === undefined ? undefined : safeParseSharedLeaderboards(response.data);
            cachedSharedLeaderboards = parsedSharedLb?.success ? parsedSharedLb.data : undefined;
            setSharedLeaderboards(cachedSharedLeaderboards);
        },
        [isMember]
    );

    /**
     * Fetch (or re-fetch) current-season data plus the season list, names, tokens, and shared
     * leaderboards.  Pass `forceRefreshAfter = Date.now()` to bypass the backend cache for the
     * current season only.
     */
    const fetchData = useCallback(
        async (forceRefreshAfter?: number) => {
            setIsRefreshing(true);
            try {
                if (isMember) {
                    // --- Member path ---
                    // Fetch current season, PI (historical list), and leaderboards in parallel.
                    const [currentSeasonResponse, piResponse, sharedLbResponse, tokenUsageResponse] = await Promise.all(
                        [
                            getMemberCurrentRaidSeasonApi(),
                            getMemberPerformanceIndexApi(),
                            getMemberSharedLeaderboardsApi(),
                            getMemberTokenUsageApi(),
                        ]
                    );

                    if (piResponse.data) {
                        cachedPerformanceIndex = piResponse.data;
                        setPerformanceIndex(cachedPerformanceIndex);
                    }

                    // Store current season data.
                    const currentEntry = currentSeasonResponse.data
                        ? mapHistoricalApiResponse(currentSeasonResponse.data as HistoricalSeasonApiResponse)
                        : undefined;
                    if (currentEntry) {
                        cachedSeasonDataMap = new Map(cachedSeasonDataMap).set(currentEntry.season, currentEntry);
                        setSeasonDataMap(new Map(cachedSeasonDataMap));
                    }

                    // Build a synthetic season list: current season + historical from PI (deduped).
                    const currentSeasonNumber = currentEntry?.season;
                    const piEntries = piResponse.data?.entries ?? [];
                    const piSeasons = piEntries.flatMap(entry => (entry.season == undefined ? [] : [entry.season]));
                    const allSeasons =
                        currentSeasonNumber == undefined
                            ? piSeasons
                            : [currentSeasonNumber, ...piSeasons.filter(s => s !== currentSeasonNumber)];

                    if (allSeasons.length > 0) {
                        const memberSeasonList: GuildRaidSeasonsResponse = {
                            currentSeason: allSeasons[0],
                            guildTag: piResponse.data?.guildTag ?? '',
                            seasons: allSeasons.map(s => ({ season: s, status: SeasonFetchStatus.Found })),
                        };
                        cachedSeasonList = memberSeasonList;
                        setSeasonList(memberSeasonList);
                        setHistoryError(undefined);
                    } else if (!cachedSeasonList) {
                        setHistoryError(
                            errorText(currentSeasonResponse.error ?? piResponse.error) ?? 'Unable to load season data'
                        );
                    }

                    // Names: only self (no guild names API for members)
                    const nameMap = new Map<string, string>();
                    if (ownUserId) nameMap.set(ownUserId, 'You');
                    cachedNames = nameMap;
                    cachedRawNames = undefined;
                    setNames(nameMap);
                    setRawNames(undefined);

                    // Tokens: not available for members
                    cachedTokens = [];
                    setTokens([]);
                    setTokenError(undefined);

                    if (tokenUsageResponse.data) {
                        cachedTokenUsageData = tokenUsageResponse.data;
                        setTokenUsageData(cachedTokenUsageData);
                    }

                    const parsedMemberLb =
                        sharedLbResponse.data === undefined
                            ? undefined
                            : safeParseSharedLeaderboards(sharedLbResponse.data);
                    cachedSharedLeaderboards = parsedMemberLb?.success ? parsedMemberLb.data : undefined;
                    setSharedLeaderboards(cachedSharedLeaderboards);
                } else {
                    // --- Keyholder path ---
                    const [
                        seasonsResponse,
                        namesResponse,
                        tokensResponse,
                        sharedLbResponse,
                        guildResponse,
                        piResponse,
                        tokenUsageResponse,
                        overridesResponse,
                    ] = await Promise.all([
                        getGuildRaidSeasonsApi(),
                        makeApiCall<GuildMemberName[]>('GET', 'guild/members/names'),
                        makeApiCall<GuildTokenEntry[]>('GET', 'guild/tokens'),
                        makeApiCall<unknown>('GET', 'guild/sharedLeaderboards'),
                        getTacticusGuildData(),
                        getGuildPerformanceIndexApi(),
                        getGuildTokenUsageApi(),
                        getGuildOverridesCached(),
                    ]);

                    if (seasonsResponse.data) {
                        cachedSeasonList = seasonsResponse.data;
                        setSeasonList(cachedSeasonList);
                    }

                    const currentSeasonNumber = seasonsResponse.data?.currentSeason;
                    if (currentSeasonNumber != undefined) {
                        const seasonResponse = await getGuildRaidSeasonApi(currentSeasonNumber, forceRefreshAfter);
                        if (seasonResponse.data) {
                            if (isCurrentSeasonResponse(seasonResponse.data)) {
                                const raw = seasonResponse.data.raidResponse as unknown as
                                    | TacticusGuildRaidResponse
                                    | undefined;
                                if (raw) {
                                    cachedCurrent = raw;
                                    setCurrent(raw);
                                }
                            } else {
                                const entry = mapHistoricalApiResponse(seasonResponse.data);
                                cachedSeasonDataMap = new Map(cachedSeasonDataMap).set(entry.season, entry);
                                setSeasonDataMap(new Map(cachedSeasonDataMap));
                            }
                        }
                    }

                    const nameMap = new Map<string, string>();
                    for (const member of namesResponse.data ?? []) {
                        if (member.name) nameMap.set(member.userId, member.name);
                    }
                    // Override names take precedence over shared names, field by field.
                    for (const override of overridesResponse.data?.overrides ?? []) {
                        if (override.name) nameMap.set(override.userId, override.name);
                    }
                    cachedRawNames = namesResponse.data;
                    setRawNames(namesResponse.data);
                    cachedNames = nameMap;
                    setNames(nameMap);
                    setHistoryError(undefined);

                    if (tokensResponse.data) {
                        cachedTokens = tokensResponse.data;
                        setTokens(tokensResponse.data);
                        setTokenError(undefined);
                    } else if (tokensResponse.error) {
                        const error = tokensResponse.error;
                        setTokenError(
                            typeof error === 'string' ? error : ((error as Error).message ?? 'Unknown error')
                        );
                        setTokens([]);
                    }

                    const parsedSharedLb =
                        sharedLbResponse.data === undefined
                            ? undefined
                            : safeParseSharedLeaderboards(sharedLbResponse.data);
                    cachedSharedLeaderboards = parsedSharedLb?.success ? parsedSharedLb.data : undefined;
                    setSharedLeaderboards(cachedSharedLeaderboards);

                    if (guildResponse.data?.guild) {
                        const { guildTag, name } = guildResponse.data.guild;
                        cachedGuildInfo = { tag: guildTag, name };
                        setGuildInfo({ tag: guildTag, name });
                    }

                    if (piResponse.data) {
                        cachedPerformanceIndex = piResponse.data;
                        setPerformanceIndex(cachedPerformanceIndex);
                    }

                    if (tokenUsageResponse.data) {
                        cachedTokenUsageData = tokenUsageResponse.data;
                        setTokenUsageData(cachedTokenUsageData);
                    }

                    const compsMap = new Map<string, RaidComp[]>();
                    for (const override of overridesResponse.data?.overrides ?? []) {
                        if (override.raidTeams && override.raidTeams.length > 0) {
                            compsMap.set(override.userId, override.raidTeams);
                        }
                    }
                    cachedRaidCompsMap = compsMap;
                    setRaidCompsMap(compsMap);
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
    const fetchSeasonData = useCallback(
        async (season: number) => {
            if (cachedSeasonDataMap.has(season)) return;
            setIsLoadingHistoricalSeason(true);
            try {
                const response = isMember ? await getMemberRaidSeasonApi(season) : await getGuildRaidSeasonApi(season);
                if (response.data && (isMember || !isCurrentSeasonResponse(response.data))) {
                    const entry = mapHistoricalApiResponse(response.data as HistoricalSeasonApiResponse);
                    cachedSeasonDataMap = new Map(cachedSeasonDataMap).set(season, entry);
                    setSeasonDataMap(new Map(cachedSeasonDataMap));
                }
            } finally {
                setIsLoadingHistoricalSeason(false);
            }
        },
        [isMember]
    );

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
        tokenUsageData,
        raidCompsMap,
        fetchData,
        fetchSeasonData,
        refreshSharedLeaderboards,
    };
}
