import { type AxiosError } from 'axios';

import { type IErrorResponse } from '@/fsd/5-shared/api';

import {
    getGuildOverridesApi,
    putGuildOverridesApi,
    type GuildOverridesResponse,
    type PlayerOverride,
} from './guild-roster-snapshots.models';

type ApiError = AxiosError<IErrorResponse> | string | undefined;

// ---------------------------------------------------------------------------
// Module-level shared cache — one copy for the whole app session.
// ---------------------------------------------------------------------------

let cached: GuildOverridesResponse | undefined;
// Deduplicates concurrent callers: if two pages fetch at the same time, only
// one HTTP request is made; both await the same promise.
let inflight: Promise<{ data: GuildOverridesResponse | undefined; error: ApiError }> | undefined;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getGuildOverridesCached(): Promise<{
    data: GuildOverridesResponse | undefined;
    error: ApiError;
}> {
    if (cached !== undefined) return Promise.resolve({ data: cached, error: undefined });
    if (inflight !== undefined) return inflight;
    const promise = getGuildOverridesApi().then(result => {
        if (inflight === promise) {
            inflight = undefined;
            if (result.data) cached = result.data;
        }
        return result;
    });
    inflight = promise;
    return promise;
}

export async function putGuildOverridesCached(
    sequenceNumber: number,
    overrides: PlayerOverride[]
): Promise<{ data: { sequenceNumber: number } | undefined; error: ApiError }> {
    const result = await putGuildOverridesApi(sequenceNumber, overrides);
    if (result.data) {
        cached = { overrides, sequenceNumber: result.data.sequenceNumber };
    }
    return result;
}

export function invalidateGuildOverridesCache(): void {
    cached = undefined;
    inflight = undefined;
}
