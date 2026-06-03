export interface GuildMemberName {
    userId: string;
    name: string | null;
}

export interface GuildTokenEntry {
    userId: string;
    name?: string | null;
    tokens?: number | null;
    nextTokenAtUtc?: number | null;
    bombAvailableAtUtc?: number | null;
}

// Sentinel to distinguish "not yet loaded" from "loaded but empty"
export const LOADING = Symbol('loading');
export type LoadingOrData<T> = T | typeof LOADING;
