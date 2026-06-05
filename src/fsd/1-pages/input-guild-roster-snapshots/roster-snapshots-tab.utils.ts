/* eslint-disable import-x/no-internal-modules */
/* eslint-disable boundaries/element-types */
import { UnitType } from '@/fsd/5-shared/model';
import { ISnapshotCharacter, ISnapshotMachineOfWar } from '@/fsd/5-shared/ui/unit-portrait';

import { CharactersPowerService } from '@/fsd/4-entities/unit';

import { IRosterSnapshot, IRosterSnapshotDiff, ISnapshotUnitDiff } from '../input-roster-snapshots/models';
import { RosterSnapshotsService } from '../input-roster-snapshots/roster-snapshots-service';

import {
    GuildRosterHistoryResponse,
    GuildRosterSnapshot,
    GuildRosterSnapshotMember,
    GuildUnitDiff,
    MemberState,
} from './guild-roster-snapshots.models';

export interface MemberHistoryEntry {
    globalIndex: number;
    resolvedRoster: IRosterSnapshot;
}

export interface DiffEntry {
    char?: ISnapshotCharacter;
    mow?: ISnapshotMachineOfWar;
    diff: ISnapshotUnitDiff;
    hasChanged: boolean;
    power: number;
}

export function buildMemberHistoryMap(
    history: GuildRosterHistoryResponse | undefined
): Map<string, MemberHistoryEntry[]> {
    const map = new Map<string, MemberHistoryEntry[]>();
    if (!history) return map;

    const currentBase = new Map<string, IRosterSnapshot>();

    for (let globalIndex = 0; globalIndex < history.snapshots.length; globalIndex++) {
        const snapshot = history.snapshots[globalIndex];
        for (const member of snapshot.members ?? []) {
            if (member.chars !== undefined) {
                const resolvedRoster: IRosterSnapshot = {
                    name: snapshot.name,
                    dateMillisUtc: 0,
                    chars: member.chars,
                    mows: member.mows ?? [],
                };
                currentBase.set(member.userId, resolvedRoster);
                const entries = map.get(member.userId) ?? [];
                entries.push({ globalIndex, resolvedRoster });
                map.set(member.userId, entries);
            } else if (member.charDiffs !== undefined || member.mowDiffs !== undefined) {
                const base = currentBase.get(member.userId);
                if (!base) continue;

                const diffObject: IRosterSnapshotDiff = {
                    name: snapshot.name,
                    dateMillisUtc: 0,
                    // GuildUnitDiff is structurally identical to ISnapshotUnitDiff
                    charDiffs: (member.charDiffs ?? []) as ISnapshotUnitDiff[],
                    mowDiffs: (member.mowDiffs ?? []) as ISnapshotUnitDiff[],
                };
                const resolvedRoster = RosterSnapshotsService.resolveSnapshotDiff(base, diffObject);
                currentBase.set(member.userId, resolvedRoster);
                const entries = map.get(member.userId) ?? [];
                entries.push({ globalIndex, resolvedRoster });
                map.set(member.userId, entries);
            }
        }
    }

    return map;
}

/** Returns the member's last known resolved roster at or before targetIndex. */
export function getMemberRosterAtIndex(
    memberHistory: MemberHistoryEntry[],
    targetIndex: number
): IRosterSnapshot | undefined {
    let result: IRosterSnapshot | undefined;
    for (const entry of memberHistory) {
        if (entry.globalIndex <= targetIndex) {
            result = entry.resolvedRoster;
        }
    }
    return result;
}

export function getPlayerName(userId: string, memberStates: Map<string, MemberState>): string {
    const state = memberStates.get(userId);
    if (state?.status === 'success' || state?.status === 'name-only') {
        return state.playerName;
    }
    return userId;
}

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

/** Builds the new snapshot entry from current member rosters, diffing against the most recent history. */
export function buildNewSnapshot(
    name: string,
    memberStates: Map<string, MemberState>,
    memberHistoryMap: Map<string, MemberHistoryEntry[]>
): GuildRosterSnapshot {
    const members: GuildRosterSnapshotMember[] = [];

    for (const [userId, state] of memberStates) {
        if (state.status !== 'success') continue;

        const currentChars = state.parsed.units.flatMap(u => (u.char ? [u.char] : []));
        const currentMows = state.parsed.units.flatMap(u => (u.mow ? [u.mow] : []));
        const memberHistory = memberHistoryMap.get(userId);

        if (!memberHistory || memberHistory.length === 0) {
            members.push({ userId, chars: currentChars, mows: currentMows });
        } else {
            const latestRoster = RosterSnapshotsService.fixSnapshot(memberHistory.at(-1)!.resolvedRoster);
            const charDiffs: GuildUnitDiff[] = [];
            const mowDiffs: GuildUnitDiff[] = [];

            for (const currentChar of currentChars) {
                const baseChar = latestRoster.chars.find(c => c.id === currentChar.id);
                if (baseChar) {
                    const diff = RosterSnapshotsService.diffCharacter(baseChar, currentChar) as GuildUnitDiff;
                    if (Object.keys(diff).length > 1) charDiffs.push(diff);
                } else {
                    charDiffs.push(charToFullDiff(currentChar));
                }
            }

            for (const currentMow of currentMows) {
                const baseMow = latestRoster.mows.find(m => m.id === currentMow.id);
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
    }

    return { name, members };
}

/**
 * Removes the oldest snapshot and migrates the new oldest (formerly second-oldest) to full base
 * data so it no longer relies on the deleted entry as its diff base.
 */
export function applyCapTrimming(history: GuildRosterHistoryResponse): GuildRosterHistoryResponse {
    const memberMap = buildMemberHistoryMap(history);
    const migratedMembers: GuildRosterSnapshotMember[] = [];

    for (const [userId, memberEntries] of memberMap) {
        const roster = getMemberRosterAtIndex(memberEntries, 1);
        if (roster) {
            migratedMembers.push({ userId, chars: roster.chars, mows: roster.mows });
        }
    }

    const trimmed = history.snapshots.slice(1);
    return {
        ...history,
        snapshots: [{ ...trimmed[0], members: migratedMembers }, ...trimmed.slice(1)],
    };
}

export function makeDefaultSnapshotName(): string {
    return `${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC`;
}

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
