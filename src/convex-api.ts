import { type FunctionReference, anyApi } from "convex/server";
import { type GenericId as Id } from "convex/values";

export const api: PublicApiType = anyApi as unknown as PublicApiType;
export const internal: InternalApiType = anyApi as unknown as InternalApiType;

export type PublicApiType = {
  user_settings: {
    getUserSettings: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      any
    >;
    upsertUserSettings: FunctionReference<
      "mutation",
      "public",
      { apiKey: string },
      any
    >;
  };
  legacy_data: {
    getLegacyData: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      {
        clerkUserId: string;
        pendingTeamsCount: number;
        rejectedTeamsCount: number;
        role: "user" | "moderator" | "admin";
        tacticusApiKey?: string;
        tacticusGuildApiKey?: string;
        tacticusUserId?: string;
        username?: string;
      }
    >;
    upsertLegacyData: FunctionReference<
      "mutation",
      "public",
      {
        clerkUserId: string;
        pendingTeamsCount?: number;
        rejectedTeamsCount?: number;
        role?: "user" | "moderator" | "admin";
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
