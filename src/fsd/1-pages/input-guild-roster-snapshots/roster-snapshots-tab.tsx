/* eslint-disable import-x/no-internal-modules */
/* eslint-disable boundaries/element-types */
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useMemo, useState } from 'react';

import { UnitType } from '@/fsd/5-shared/model';
import { Button } from '@/fsd/5-shared/ui/button';
import { ISnapshotCharacter, ISnapshotMachineOfWar } from '@/fsd/5-shared/ui/unit-portrait';

import { CharactersPowerService } from '@/fsd/4-entities/unit';

import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings';

import { RosterSnapshotsUnit } from '@/fsd/2-widgets/roster-snapshots-unit';

import { IRosterSnapshot, IRosterSnapshotDiff, ISnapshotUnitDiff } from '../input-roster-snapshots/models';
import { RosterSnapshotsService } from '../input-roster-snapshots/roster-snapshots-service';
import { RosterSnapshotsUnitDiffDetailed } from '../input-roster-snapshots/roster-snapshots-unit-diff-detailed';

import {
    GuildRosterHistoryResponse,
    GuildRosterSnapshot,
    GuildRosterSnapshotMember,
    GuildUnitDiff,
    MemberState,
    getGuildRosterHistoryApi,
    postGuildRosterSnapshotApi,
} from './guild-roster-snapshots.models';

const SHOW_ALL = RosterSnapshotShowVariableSettings.Always;
const SNAPSHOT_LIMIT = 20;

// ---------------------------------------------------------------------------
// Pure helpers (defined outside component)
// ---------------------------------------------------------------------------

interface MemberHistoryEntry {
    globalIndex: number;
    resolvedRoster: IRosterSnapshot;
}

function buildMemberHistoryMap(history: GuildRosterHistoryResponse | undefined): Map<string, MemberHistoryEntry[]> {
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
function getMemberRosterAtIndex(memberHistory: MemberHistoryEntry[], targetIndex: number): IRosterSnapshot | undefined {
    let result: IRosterSnapshot | undefined;
    for (const entry of memberHistory) {
        if (entry.globalIndex <= targetIndex) {
            result = entry.resolvedRoster;
        }
    }
    return result;
}

function getPlayerName(userId: string, memberStates: Map<string, MemberState>): string {
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
function buildNewSnapshot(
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
            // New member: store full base data
            members.push({ userId, chars: currentChars, mows: currentMows });
        } else {
            const latestRoster = RosterSnapshotsService.fixSnapshot(memberHistory.at(-1).resolvedRoster);
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
function applyCapTrimming(history: GuildRosterHistoryResponse): GuildRosterHistoryResponse {
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

function makeDefaultSnapshotName(): string {
    return `${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC`;
}

interface DiffEntry {
    char?: ISnapshotCharacter;
    mow?: ISnapshotMachineOfWar;
    diff: ISnapshotUnitDiff;
    hasChanged: boolean;
    power: number;
}

function snapshotCharPower(char: ISnapshotCharacter): number {
    return CharactersPowerService.getCharacterPower({
        unitType: UnitType.character,
        rank: char.rank,
        rarity: char.rarity,
        stars: char.stars,
        activeAbilityLevel: char.activeAbilityLevel,
        passiveAbilityLevel: char.passiveAbilityLevel,
    } as any);
}

function snapshotMowPower(mow: ISnapshotMachineOfWar): number {
    return CharactersPowerService.getCharacterAbilityPower({
        unitType: UnitType.mow,
        unlocked: !mow.locked,
        rarity: mow.rarity,
        stars: mow.stars,
        primaryAbilityLevel: mow.primaryAbilityLevel,
        secondaryAbilityLevel: mow.secondaryAbilityLevel,
    } as any);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RosterSnapshotsTabProps {
    members: string[] | undefined;
    memberStates: Map<string, MemberState>;
    onLoadMembers: () => Promise<void>;
}

export const RosterSnapshotsTab = ({ members, memberStates, onLoadMembers }: RosterSnapshotsTabProps) => {
    const [history, setHistory] = useState<GuildRosterHistoryResponse | undefined>();
    const [historyError, setHistoryError] = useState<string | undefined>();
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [hasLoadedHistoryOnce, setHasLoadedHistoryOnce] = useState(false);
    const [leftSnapshotIndex, setLeftSnapshotIndex] = useState<number | undefined>();
    const [rightSnapshotSelection, setRightSnapshotSelection] = useState<number | 'current' | undefined>();
    const [selectedUserId, setSelectedUserId] = useState<string | undefined>();

    // Save dialog
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [snapshotName, setSnapshotName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | undefined>();

    const loadHistory = async () => {
        setIsLoadingHistory(true);
        setHistoryError(undefined);
        const { data, error } = await getGuildRosterHistoryApi();
        if (error) {
            setHistoryError(typeof error === 'string' ? error : (error.message ?? 'Failed to load history'));
        } else {
            setHistory(data);
            if (members === undefined) {
                void onLoadMembers();
            }
        }
        setIsLoadingHistory(false);
        setHasLoadedHistoryOnce(true);
    };

    const snapshots = useMemo(() => history?.snapshots ?? [], [history]);
    const memberHistoryMap = useMemo(() => buildMemberHistoryMap(history), [history]);

    // Save dialog derived state
    const existingNames = useMemo(() => new Set(snapshots.map(s => s.name)), [snapshots]);
    const trimmedName = snapshotName.trim();
    const isDuplicateName = existingNames.has(trimmedName);
    const isNameValid = trimmedName.length > 0 && !isDuplicateName;
    const approachingLimit = snapshots.length === SNAPSHOT_LIMIT - 1;
    const willRemoveOnSave = snapshots.length >= SNAPSHOT_LIMIT;

    const openSaveDialog = () => {
        setSnapshotName(makeDefaultSnapshotName());
        setSaveError(undefined);
        setSaveDialogOpen(true);
    };

    const closeSaveDialog = () => setSaveDialogOpen(false);

    const handleSaveSnapshot = async () => {
        if (!isNameValid || !history) return;

        setIsSaving(true);
        setSaveError(undefined);

        const newSnapshot = buildNewSnapshot(trimmedName, memberStates, memberHistoryMap);
        const { data, error } = await postGuildRosterSnapshotApi(history.sequenceNumber, newSnapshot);

        if (error) {
            setSaveError(typeof error === 'string' ? error : (error.message ?? 'Failed to save snapshot'));
            setIsSaving(false);
            return;
        }

        let updatedHistory: GuildRosterHistoryResponse = { ...history };
        if (updatedHistory.snapshots.length >= SNAPSHOT_LIMIT) {
            updatedHistory = applyCapTrimming(updatedHistory);
        }
        updatedHistory = {
            ...updatedHistory,
            sequenceNumber: data?.sequenceNumber ?? updatedHistory.sequenceNumber,
            snapshots: [...updatedHistory.snapshots, newSnapshot],
        };

        setHistory(updatedHistory);
        setIsSaving(false);
        setSaveDialogOpen(false);
    };

    const rightOptions = useMemo((): Array<{ value: number | 'current'; label: string }> => {
        if (leftSnapshotIndex === undefined) return [];
        const options: Array<{ value: number | 'current'; label: string }> = [];
        for (let index = leftSnapshotIndex + 1; index < snapshots.length; index++) {
            options.push({ value: index, label: snapshots[index].name });
        }
        const membersLoadedLabel = members === undefined ? 'Current Rosters (loading\u2026)' : 'Current Rosters';
        options.push({ value: 'current', label: membersLoadedLabel });
        return options;
    }, [leftSnapshotIndex, snapshots, members]);

    /**
     * Members eligible for the Player dropdown. Includes members present in the "to" snapshot,
     * with an isNew flag for those absent from the "from" snapshot. Falls back to the current
     * loaded roster when there is no history.
     */
    const membersInComparison = useMemo((): Array<{ userId: string; isNew: boolean }> => {
        if (leftSnapshotIndex === undefined || rightSnapshotSelection === undefined) {
            if (hasLoadedHistoryOnce && snapshots.length === 0) {
                return (
                    members
                        ?.filter(id => memberStates.get(id)?.status === 'success')
                        .map(id => ({ userId: id, isNew: false })) ?? []
                );
            }
            return [];
        }

        const result: Array<{ userId: string; isNew: boolean }> = [];
        for (const userId of memberHistoryMap.keys()) {
            const memberHistory = memberHistoryMap.get(userId);
            if (!memberHistory) continue;

            const hasRight =
                rightSnapshotSelection === 'current'
                    ? memberStates.get(userId)?.status === 'success'
                    : getMemberRosterAtIndex(memberHistory, rightSnapshotSelection) !== undefined;
            if (!hasRight) continue;

            const hasLeft = getMemberRosterAtIndex(memberHistory, leftSnapshotIndex) !== undefined;
            result.push({ userId, isNew: !hasLeft });
        }
        return result;
    }, [
        leftSnapshotIndex,
        rightSnapshotSelection,
        memberHistoryMap,
        memberStates,
        members,
        hasLoadedHistoryOnce,
        snapshots,
    ]);

    const diffEntries = useMemo((): DiffEntry[] => {
        if (selectedUserId === undefined || leftSnapshotIndex === undefined || rightSnapshotSelection === undefined) {
            return [];
        }
        const memberHistory = memberHistoryMap.get(selectedUserId);
        if (!memberHistory) return [];

        let rightRoster: IRosterSnapshot | undefined;
        if (rightSnapshotSelection === 'current') {
            const state = memberStates.get(selectedUserId);
            if (state?.status !== 'success') return [];
            rightRoster = {
                name: 'Current',
                dateMillisUtc: 0,
                chars: state.parsed.units.flatMap(u => (u.char ? [u.char] : [])),
                mows: state.parsed.units.flatMap(u => (u.mow ? [u.mow] : [])),
            };
        } else {
            rightRoster = getMemberRosterAtIndex(memberHistory, rightSnapshotSelection);
        }
        if (!rightRoster) return [];

        const fixedRight = RosterSnapshotsService.fixSnapshot(rightRoster);
        const leftRoster = getMemberRosterAtIndex(memberHistory, leftSnapshotIndex);

        // New member: no left roster — show their full roster with empty diffs
        if (!leftRoster) {
            return [
                ...fixedRight.chars.map(char => ({
                    char,
                    diff: { id: char.id } as ISnapshotUnitDiff,
                    hasChanged: false,
                    power: snapshotCharPower(char),
                })),
                ...fixedRight.mows.map(mow => ({
                    mow,
                    diff: { id: mow.id } as ISnapshotUnitDiff,
                    hasChanged: false,
                    power: snapshotMowPower(mow),
                })),
            ];
        }

        const fixedLeft = RosterSnapshotsService.fixSnapshot(leftRoster);
        const results: DiffEntry[] = [];
        for (const rightChar of fixedRight.chars) {
            const leftChar = fixedLeft.chars.find(c => c.id === rightChar.id);
            const diff = leftChar
                ? RosterSnapshotsService.diffCharacter(leftChar, rightChar)
                : ({ id: rightChar.id } as ISnapshotUnitDiff);
            results.push({
                char: leftChar ?? rightChar,
                diff,
                hasChanged: Object.keys(diff).length > 1,
                power: snapshotCharPower(rightChar),
            });
        }
        for (const rightMow of fixedRight.mows) {
            const leftMow = fixedLeft.mows.find(m => m.id === rightMow.id);
            const diff = leftMow
                ? RosterSnapshotsService.diffMachineOfWar(leftMow, rightMow)
                : ({ id: rightMow.id } as ISnapshotUnitDiff);
            results.push({
                mow: leftMow ?? rightMow,
                diff,
                hasChanged: Object.keys(diff).length > 1,
                power: snapshotMowPower(rightMow),
            });
        }
        return results;
    }, [selectedUserId, leftSnapshotIndex, rightSnapshotSelection, memberHistoryMap, memberStates]);

    const isNoHistoryMode = hasLoadedHistoryOnce && snapshots.length === 0;

    // Current-roster fallback (no-history mode)
    const selectedMemberState = selectedUserId === undefined ? undefined : memberStates.get(selectedUserId);
    const currentUnits =
        isNoHistoryMode && selectedMemberState?.status === 'success' ? selectedMemberState.parsed.units : undefined;

    const selectClass =
        'rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100';
    const labelClass = 'text-sm font-semibold text-gray-700 dark:text-gray-300';
    const canSave = hasLoadedHistoryOnce && !isLoadingHistory && members !== undefined;

    return (
        <div className="flex flex-col gap-4">
            {/* Action buttons */}
            <div className="flex items-center gap-4">
                <Button intent="primary" isDisabled={isLoadingHistory} onPress={loadHistory}>
                    {hasLoadedHistoryOnce ? 'Refresh History' : 'Load History'}
                </Button>
                <Button intent="secondary" isDisabled={!canSave} onPress={openSaveDialog}>
                    Save Snapshot
                </Button>
                {isLoadingHistory && (
                    <span className="inline-block size-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                )}
            </div>

            {historyError && <p className="text-sm text-red-600 dark:text-red-400">{historyError}</p>}

            {!hasLoadedHistoryOnce && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click &ldquo;Load History&rdquo; to get started.
                </p>
            )}

            {/* Snapshot comparison dropdowns */}
            {hasLoadedHistoryOnce && (
                <div className="flex flex-wrap items-center gap-4">
                    {snapshots.length > 0 && (
                        <>
                            <div className="flex items-center gap-2">
                                <label htmlFor="left-snapshot-select" className={labelClass}>
                                    From:
                                </label>
                                <select
                                    id="left-snapshot-select"
                                    value={leftSnapshotIndex ?? ''}
                                    onChange={event_ => {
                                        const value = event_.target.value;
                                        setLeftSnapshotIndex(value === '' ? undefined : Number(value));
                                        setRightSnapshotSelection(undefined);
                                        setSelectedUserId(undefined);
                                    }}
                                    className={selectClass}>
                                    <option value="">— select a snapshot —</option>
                                    {snapshots.map((snapshot, index) => (
                                        <option key={snapshot.name} value={index}>
                                            {snapshot.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <label htmlFor="right-snapshot-select" className={labelClass}>
                                    To:
                                </label>
                                <select
                                    id="right-snapshot-select"
                                    disabled={leftSnapshotIndex === undefined}
                                    value={rightSnapshotSelection ?? ''}
                                    onChange={event_ => {
                                        const value = event_.target.value;
                                        if (value === '') {
                                            setRightSnapshotSelection(undefined);
                                        } else if (value === 'current') {
                                            setRightSnapshotSelection('current');
                                        } else {
                                            setRightSnapshotSelection(Number(value));
                                        }
                                        setSelectedUserId(undefined);
                                    }}
                                    className={`${selectClass} disabled:opacity-50`}>
                                    <option value="">— select a snapshot —</option>
                                    {rightOptions.map(option => (
                                        <option key={String(option.value)} value={String(option.value)}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {membersInComparison.length > 0 && (
                        <div className="flex items-center gap-2">
                            <label htmlFor="history-member-select" className={labelClass}>
                                Player:
                            </label>
                            <select
                                id="history-member-select"
                                value={selectedUserId ?? ''}
                                onChange={event_ => setSelectedUserId(event_.target.value || undefined)}
                                className={selectClass}>
                                <option value="">— select a player —</option>
                                {membersInComparison.map(({ userId, isNew }) => (
                                    <option key={userId} value={userId}>
                                        {getPlayerName(userId, memberStates)}
                                        {isNew ? ' (new)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}

            {isNoHistoryMode && <p className="text-sm text-gray-500 dark:text-gray-400">No roster history found.</p>}

            {/* Diff view */}
            {diffEntries.length > 0 &&
                (() => {
                    const changed = diffEntries.filter(event => event.hasChanged).toSorted((a, b) => b.power - a.power);
                    const unchanged = diffEntries
                        .filter(event => !event.hasChanged)
                        .toSorted((a, b) => b.power - a.power);
                    return (
                        <div className="flex flex-wrap gap-2">
                            {changed.map(({ char, mow, diff }) => (
                                <RosterSnapshotsUnitDiffDetailed
                                    key={diff.id}
                                    char={char}
                                    mow={mow}
                                    diff={diff}
                                    showShards={SHOW_ALL}
                                    showMythicShards={SHOW_ALL}
                                    showXpLevel={SHOW_ALL}
                                    showAbilities={SHOW_ALL}
                                    showEquipment={SHOW_ALL}
                                />
                            ))}
                            {unchanged.map(({ char, mow, diff }) =>
                                char ? (
                                    <RosterSnapshotsUnit
                                        key={diff.id}
                                        char={char}
                                        showShards={SHOW_ALL}
                                        showMythicShards={SHOW_ALL}
                                        showXpLevel={SHOW_ALL}
                                        showAbilities={SHOW_ALL}
                                        showEquipment={SHOW_ALL}
                                        showTooltip
                                        isEnabled
                                    />
                                ) : mow ? (
                                    <RosterSnapshotsUnit
                                        key={diff.id}
                                        mow={mow}
                                        showShards={SHOW_ALL}
                                        showMythicShards={SHOW_ALL}
                                        showXpLevel={SHOW_ALL}
                                        showAbilities={SHOW_ALL}
                                        showEquipment={SHOW_ALL}
                                        showTooltip
                                        isEnabled
                                    />
                                ) : undefined
                            )}
                        </div>
                    );
                })()}

            {/* No-history fallback: show current roster for selected member */}
            {currentUnits !== undefined && (
                <div className="flex flex-wrap gap-2">
                    {currentUnits.map(({ char, mow }) =>
                        char ? (
                            <RosterSnapshotsUnit
                                key={char.id}
                                char={char}
                                showShards={SHOW_ALL}
                                showMythicShards={SHOW_ALL}
                                showXpLevel={SHOW_ALL}
                                showAbilities={SHOW_ALL}
                                showEquipment={SHOW_ALL}
                                showTooltip
                                isEnabled
                            />
                        ) : mow ? (
                            <RosterSnapshotsUnit
                                key={mow.id}
                                mow={mow}
                                showShards={SHOW_ALL}
                                showMythicShards={SHOW_ALL}
                                showXpLevel={SHOW_ALL}
                                showAbilities={SHOW_ALL}
                                showEquipment={SHOW_ALL}
                                showTooltip
                                isEnabled
                            />
                        ) : undefined
                    )}
                </div>
            )}

            {/* Save Snapshot dialog */}
            <Dialog open={saveDialogOpen} onClose={closeSaveDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Save Snapshot</DialogTitle>
                <DialogContent>
                    <div className="flex flex-col gap-4 pt-2">
                        {willRemoveOnSave && (
                            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                ⚠ You have reached the {SNAPSHOT_LIMIT}-snapshot limit. Saving will remove the oldest
                                snapshot.
                            </p>
                        )}
                        {approachingLimit && (
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                You have {snapshots.length}/{SNAPSHOT_LIMIT} snapshots. After saving, further saves will
                                remove the oldest snapshot.
                            </p>
                        )}
                        <div className="flex flex-col gap-1">
                            <label htmlFor="snapshot-name-input" className={labelClass}>
                                Snapshot Name
                            </label>
                            <input
                                id="snapshot-name-input"
                                type="text"
                                value={snapshotName}
                                onChange={event_ => setSnapshotName(event_.target.value)}
                                className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                                autoFocus
                            />
                            {isDuplicateName && (
                                <p className="text-xs text-red-500">A snapshot with this name already exists.</p>
                            )}
                        </div>
                        {saveError && <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>}
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button intent="secondary" onPress={closeSaveDialog}>
                        Cancel
                    </Button>
                    <Button intent="primary" isDisabled={!isNameValid || isSaving} onPress={handleSaveSnapshot}>
                        {isSaving ? 'Saving…' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};
