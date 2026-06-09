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

export interface PlayerIdentity {
    // The in-game user ID, looks like five groups of alphanumeric character separated by dashes.
    userId: string;
    // This is either the in-game name of the player, if they've shared it, or the obfuscated
    // user ID (we hide all but the first and last three character of the ID).
    displayName: string;
}

// Sentinel to distinguish "not yet loaded" from "loaded but empty"
export const LOADING = Symbol('loading');
export type LoadingOrData<T> = T | typeof LOADING;
