/* eslint-disable import-x/no-internal-modules */
/* eslint-disable boundaries/element-types */
import { UnitType } from '@/fsd/5-shared/model';
import { ISnapshotCharacter, ISnapshotMachineOfWar } from '@/fsd/5-shared/ui/unit-portrait';

import { CharactersPowerService } from '@/fsd/4-entities/unit';

import { IRosterSnapshot, IRosterSnapshotDiff, ISnapshotUnitDiff } from '../input-roster-snapshots/models';
import { RosterSnapshotsService } from '../input-roster-snapshots/roster-snapshots-service';

import {
    CurrentRosterMember,
    GuildRosterSnapshotMember,
    GuildUnitDiff,
    MemberState,
    PlayerRosterChainEntry,
    PlayerRosterChainResponse,
} from './guild-roster-snapshots.models';

export interface DiffEntry {
    char?: ISnapshotCharacter;
    mow?: ISnapshotMachineOfWar;
    diff: ISnapshotUnitDiff;
    hasChanged: boolean;
    power: number;
}

// ---------------------------------------------------------------------------
// Chain reconstruction
// ---------------------------------------------------------------------------

/**
 * Reconstructs a player's roster state at a given snapshot by walking their
 * chain from the base entry (index 0) forward, applying deltas in order.
 * Returns undefined if the player has no entry for that snapshotId.
 */
export function getRosterAtSnapshot(chain: PlayerRosterChainEntry[], snapshotId: string): IRosterSnapshot | undefined {
    let current: IRosterSnapshot | undefined;

    for (const entry of chain) {
        const member = entry.memberData as GuildRosterSnapshotMember | undefined;
        if (!member) {
            if (entry.snapshotId === snapshotId) return current;
            continue;
        }

        if (member.chars !== undefined) {
            current = {
                name: entry.name,
                dateMillisUtc: new Date(entry.createdAt).getTime(),
                chars: member.chars,
                mows: member.mows ?? [],
            };
        } else if (current && (member.charDiffs !== undefined || member.mowDiffs !== undefined)) {
            const diff: IRosterSnapshotDiff = {
                name: entry.name,
                dateMillisUtc: new Date(entry.createdAt).getTime(),
                charDiffs: (member.charDiffs ?? []) as ISnapshotUnitDiff[],
                mowDiffs: (member.mowDiffs ?? []) as ISnapshotUnitDiff[],
            };
            current = RosterSnapshotsService.resolveSnapshotDiff(current, diff);
        }

        if (entry.snapshotId === snapshotId) return current;
    }

    return undefined;
}

// ---------------------------------------------------------------------------
// Save snapshot construction
// ---------------------------------------------------------------------------

function charToFullDiff(char: ISnapshotCharacter): GuildUnitDiff {
    return {
        id: char.id,
        rank: char.rank,
        rarity: char.rarity,
        stars: char.stars,
        shards: char.shards,
        mythicShards: char.mythicShards,
        xpLevel: char.xpLevel,
        active: char.activeAbilityLevel,
        passive: char.passiveAbilityLevel,
        equip0: char.equip0?.id,
        equip1: char.equip1?.id,
        equip2: char.equip2?.id,
        equip0Level: char.equip0Level,
        equip1Level: char.equip1Level,
        equip2Level: char.equip2Level,
    };
}

function mowToFullDiff(mow: ISnapshotMachineOfWar): GuildUnitDiff {
    return {
        id: mow.id,
        rarity: mow.rarity,
        stars: mow.stars,
        shards: mow.shards,
        mythicShards: mow.mythicShards,
        active: mow.primaryAbilityLevel,
        passive: mow.secondaryAbilityLevel,
        locked: mow.locked,
    };
}

/**
 * Builds the new snapshot payload to POST. Uses each player's cached chain to
 * diff against their last known state; falls back to full-base when the player
 * has no history in the chain cache.
 */
export function buildNewSnapshot(
    name: string,
    memberStates: Map<string, MemberState>,
    playerChainCache: Map<string, PlayerRosterChainResponse>,
    latestSnapshotId: string | undefined
): { name: string; members: GuildRosterSnapshotMember[] } {
    const members: GuildRosterSnapshotMember[] = [];

    for (const [userId, state] of memberStates) {
        if (state.status !== 'success') continue;

        const currentChars = state.parsed.units.flatMap(u => (u.char ? [u.char] : []));
        const currentMows = state.parsed.units.flatMap(u => (u.mow ? [u.mow] : []));

        const chain = playerChainCache.get(userId);
        const latestRoster = latestSnapshotId && chain ? getRosterAtSnapshot(chain.chain, latestSnapshotId) : undefined;

        if (!latestRoster) {
            members.push({ userId, chars: currentChars, mows: currentMows });
            continue;
        }

        const fixedLatest = RosterSnapshotsService.fixSnapshot(latestRoster);
        const charDiffs: GuildUnitDiff[] = [];
        const mowDiffs: GuildUnitDiff[] = [];

        for (const currentChar of currentChars) {
            const baseChar = fixedLatest.chars.find(c => c.id === currentChar.id);
            if (baseChar) {
                const diff = RosterSnapshotsService.diffCharacter(baseChar, currentChar) as GuildUnitDiff;
                if (Object.keys(diff).length > 1) charDiffs.push(diff);
            } else {
                charDiffs.push(charToFullDiff(currentChar));
            }
        }

        for (const currentMow of currentMows) {
            const baseMow = fixedLatest.mows.find(m => m.id === currentMow.id);
            if (baseMow) {
                const diff = RosterSnapshotsService.diffMachineOfWar(baseMow, currentMow) as GuildUnitDiff;
                if (Object.keys(diff).length > 1) mowDiffs.push(diff);
            } else {
                mowDiffs.push(mowToFullDiff(currentMow));
            }
        }

        if (charDiffs.length > 0 || mowDiffs.length > 0) {
            members.push({ userId, charDiffs, mowDiffs });
        }
    }

    return { name, members };
}

// ---------------------------------------------------------------------------
// Name helpers
// ---------------------------------------------------------------------------

export function getPlayerName(
    userId: string,
    memberStates: Map<string, MemberState>,
    currentRosterMembers: CurrentRosterMember[]
): string {
    const state = memberStates.get(userId);
    if (state?.status === 'success' || state?.status === 'name-only') return state.playerName;
    const member = currentRosterMembers.find(m => m.userId === userId);
    if (member) return member.playerName;
    return userId;
}

export function makeDefaultSnapshotName(): string {
    return `${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC`;
}

// ---------------------------------------------------------------------------
// Power helpers (unchanged)
// ---------------------------------------------------------------------------

export function snapshotCharPower(char: ISnapshotCharacter): number {
    return CharactersPowerService.getCharacterPower({
        unitType: UnitType.character,
        rank: char.rank,
        rarity: char.rarity,
        stars: char.stars,
        activeAbilityLevel: char.activeAbilityLevel,
        passiveAbilityLevel: char.passiveAbilityLevel,
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function snapshotMowPower(mow: ISnapshotMachineOfWar): number {
    return CharactersPowerService.getCharacterAbilityPower({
        unitType: UnitType.mow,
        unlocked: !mow.locked,
        rarity: mow.rarity,
        stars: mow.stars,
        primaryAbilityLevel: mow.primaryAbilityLevel,
        secondaryAbilityLevel: mow.secondaryAbilityLevel,
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
}
