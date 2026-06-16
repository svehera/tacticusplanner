import { makeApiCall } from '@/fsd/5-shared/api';
import { TacticusUnit } from '@/fsd/5-shared/lib';
import { Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';
import { ISnapshotCharacter, ISnapshotMachineOfWar } from '@/fsd/5-shared/ui/unit-portrait';

export interface GuildMemberRoster {
    source: string;
    playerName: string;
    units: TacticusUnit[];
}

export interface GuildApiError {
    code: string;
    message: string;
    data?: { playerName?: string };
}

export interface PlayerOverride {
    userId: string;
    name: string;
    apiKey?: string;
}

export interface GuildOverridesResponse {
    overrides: PlayerOverride[];
    sequenceNumber: number;
}

export interface OverrideRow {
    userId: string;
    name: string;
    apiKey: string;
}

export interface ParsedUnit {
    char?: ISnapshotCharacter;
    mow?: ISnapshotMachineOfWar;
    power: number;
}

export interface ParsedRoster {
    units: ParsedUnit[];
}

export type MemberState =
    | { status: 'loading' }
    | { status: 'success'; playerName: string; roster: GuildMemberRoster; parsed: ParsedRoster }
    | { status: 'not-shared' }
    | { status: 'name-only'; playerName: string }
    | { status: 'error'; message: string };

export type OverridesLoadState =
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'loaded'; sequenceNumber: number };

export type GuildTab = 'rosters' | 'roster-snapshots' | 'members';

export const API_KEY_PATTERN = /^[a-zA-Z0-9-]*$/;

export const getGuildMembersApi = () => makeApiCall<string[]>('GET', 'guild/members');

export const getGuildMemberRosterApi = (userId: string) =>
    makeApiCall<GuildMemberRoster>('GET', `guild/roster/member?userId=${encodeURIComponent(userId)}`);

export const getGuildOverridesApi = () => makeApiCall<GuildOverridesResponse>('GET', 'guild/members/overrides');

export const putGuildOverridesApi = (sequenceNumber: number, overrides: PlayerOverride[]) =>
    makeApiCall<{ sequenceNumber: number }>('PUT', 'guild/members/overrides', { sequenceNumber, overrides });

/** Structurally identical to ISnapshotUnitDiff in input-roster-snapshots/models. */
export interface GuildUnitDiff {
    id: string;
    rank?: Rank;
    rarity?: Rarity;
    stars?: RarityStars;
    shards?: number;
    mythicShards?: number;
    xpLevel?: number;
    active?: number;
    passive?: number;
    locked?: boolean;
    equip0?: string;
    equip1?: string;
    equip2?: string;
    equip0Level?: number;
    equip1Level?: number;
    equip2Level?: number;
}

export interface GuildRosterSnapshotMember {
    userId: string;
    /** Present on first occurrence — full base snapshot. */
    chars?: ISnapshotCharacter[];
    mows?: ISnapshotMachineOfWar[];
    /** Present on subsequent occurrences — compact diffs from the previous entry. */
    charDiffs?: GuildUnitDiff[];
    mowDiffs?: GuildUnitDiff[];
}

export interface GuildRosterSnapshot {
    name: string;
    members?: GuildRosterSnapshotMember[];
}

export interface GuildRosterHistoryResponse {
    sequenceNumber: number;
    snapshots: GuildRosterSnapshot[];
}

// ---------------------------------------------------------------------------
// GET /guild/roster/snapshots
// ---------------------------------------------------------------------------

export interface CurrentRosterMember {
    userId: string;
    playerName: string;
}

export interface RosterSnapshotInfo {
    snapshotId: string;
    name: string;
    createdAt: string;
    /** User IDs of players who have a chain entry for this snapshot. */
    memberIds: string[];
}

export interface GuildRosterSnapshotsMetaResponse {
    snapshots: RosterSnapshotInfo[];
    atCapacity: boolean;
    maxSnapshots: number;
    currentRosterMembers: CurrentRosterMember[];
}

export const getGuildRosterSnapshotsMetaApi = () =>
    makeApiCall<GuildRosterSnapshotsMetaResponse>('GET', 'guild/roster/snapshots');

// ---------------------------------------------------------------------------
// DELETE /guild/roster/snapshot/{snapshotId}
// ---------------------------------------------------------------------------

export const deleteGuildRosterSnapshotByIdApi = (snapshotId: string) =>
    makeApiCall<{ snapshotId: string; deleted: boolean }>(
        'DELETE',
        `guild/roster/snapshot/${encodeURIComponent(snapshotId)}`
    );

// ---------------------------------------------------------------------------
// GET /guild/roster/player-chain
// ---------------------------------------------------------------------------

export interface PlayerRosterChainEntry {
    snapshotId: string;
    name: string;
    createdAt: string;
    /** chain[0] has full chars/mows; subsequent entries have charDiffs/mowDiffs. */
    memberData?: GuildRosterSnapshotMember;
}

export interface PlayerRosterChainResponse {
    userId: string;
    chain: PlayerRosterChainEntry[];
}

export const getGuildRosterPlayerChainApi = (userId: string) =>
    makeApiCall<PlayerRosterChainResponse>('GET', `guild/roster/player-chain?userId=${encodeURIComponent(userId)}`);

// ---------------------------------------------------------------------------
// POST /guild/roster/migrate
// ---------------------------------------------------------------------------

export const postGuildRosterMigrateApi = () =>
    makeApiCall<{ migrated: number; skipped: number }>('POST', 'guild/roster/migrate');

// ---------------------------------------------------------------------------
// PUT /guild/roster/history
// ---------------------------------------------------------------------------

export const postGuildRosterSnapshotApi = (snapshot: GuildRosterSnapshot) =>
    makeApiCall<{ snapshotId: string }>('PUT', 'guild/roster/history', { snapshot });
