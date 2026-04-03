import { type FunctionReference, anyApi } from 'convex/server';

export const api: PublicApiType = anyApi as unknown as PublicApiType;
export const internal: InternalApiType = anyApi as unknown as InternalApiType;

export type PublicApiType = {
    user_settings: {
        getUserSettings: FunctionReference<
            'query',
            'public',
            Record<string, never>,
            { apiKey: string; clerkUserId: string }
        >;
        upsertUserSettings: FunctionReference<'mutation', 'public', { apiKey: string; clerkUserId: string }, any>;
    };
    legacy_data: {
        getLegacyData: FunctionReference<
            'query',
            'public',
            Record<string, never>,
            {
                clerkUserId: string;
                pendingTeamsCount: number;
                rejectedTeamsCount: number;
                role: 'user' | 'moderator' | 'admin';
                shareToken?: string;
                tacticusApiKey?: string;
                tacticusGuildApiKey?: string;
                tacticusUserId?: string;
                username?: string;
            }
        >;
        upsertLegacyData: FunctionReference<
            'mutation',
            'public',
            {
                clerkUserId: string;
                pendingTeamsCount?: number;
                rejectedTeamsCount?: number;
                role?: 'user' | 'moderator' | 'admin';
                shareToken?: string;
                tacticusApiKey?: string;
                tacticusGuildApiKey?: string;
                tacticusUserId?: string;
                username?: string;
            },
            any
        >;
    };
};
export type InternalApiType = {};
