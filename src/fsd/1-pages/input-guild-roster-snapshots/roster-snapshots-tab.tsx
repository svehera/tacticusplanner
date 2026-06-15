/* eslint-disable import-x/no-internal-modules */
/* eslint-disable boundaries/element-types */
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { StoreContext } from '@/reducers/store.provider';

import { isLikelyUserId, obfuscateUserId } from '@/fsd/5-shared/lib';
import { DebugJson } from '@/fsd/5-shared/ui';
import { Button } from '@/fsd/5-shared/ui/button';

import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings';

import { RosterSnapshotsUnit } from '@/fsd/2-widgets/roster-snapshots-unit';

import { getUnitIdsFromTeamNames } from '@/fsd/1-pages/plan-teams2/team-filter.utils';

import { IRosterSnapshot, ISnapshotUnitDiff } from '../input-roster-snapshots/models';
import { RosterSnapshotsService } from '../input-roster-snapshots/roster-snapshots-service';
import { RosterSnapshotsUnitDiffDetailed } from '../input-roster-snapshots/roster-snapshots-unit-diff-detailed';

import {
    GuildRosterHistoryResponse,
    GuildRosterSnapshotMember,
    MemberState,
    RosterSnapshotDetail,
    RosterSnapshotInfo,
    deleteGuildRosterSnapshotByIdApi,
    getGuildRosterHistoryApi,
    getGuildRosterSnapshotDetailApi,
    getGuildRosterSnapshotsMetaApi,
    postGuildRosterSnapshotApi,
} from './guild-roster-snapshots.models';
import { RaidTeamFilterDropdown } from './raid-team-filter-dropdown';
import {
    DiffEntry,
    buildMemberHistoryMap,
    buildNewSnapshot,
    getMemberRosterAtIndex,
    getPlayerName,
    makeDefaultSnapshotName,
    snapshotCharPower,
    snapshotMowPower,
} from './roster-snapshots-tab.utils';

const SHOW_ALL = RosterSnapshotShowVariableSettings.Always;

// Module-level cache — persists across navigations within a session
const cache = {
    snapshotMeta: undefined as RosterSnapshotInfo[] | undefined,
    atCapacity: false,
    maxSnapshots: 0,
    snapshotDetailCache: new Map<string, RosterSnapshotDetail>(),
    sequenceNumber: 0,
    sequenceNumberFetched: false,
    metaFetched: false,
};

// Writes must happen in module-level functions so the React compiler doesn't
// flag them as side effects inside a component or hook.
function cacheSetMeta(snapshots: RosterSnapshotInfo[], atCapacity: boolean, maxSnapshots: number) {
    cache.snapshotMeta = snapshots;
    cache.atCapacity = atCapacity;
    cache.maxSnapshots = maxSnapshots;
    cache.metaFetched = true;
}
function cacheSetDetailCache(map: Map<string, RosterSnapshotDetail>) {
    cache.snapshotDetailCache = map;
}
function cacheSetSequenceNumber(n: number) {
    cache.sequenceNumber = n;
}
function cacheMarkSequenceNumberFetched() {
    cache.sequenceNumberFetched = true;
}
function cacheSetAfterDelete(
    snapshotMeta: RosterSnapshotInfo[] | undefined,
    snapshotDetailCache: Map<string, RosterSnapshotDetail>
) {
    cache.snapshotMeta = snapshotMeta;
    cache.snapshotDetailCache = snapshotDetailCache;
    cache.atCapacity = false;
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
    // ---- metadata state ----
    const [snapshotMeta, setSnapshotMeta] = useState<RosterSnapshotInfo[] | undefined>(cache.snapshotMeta);
    const [atCapacity, setAtCapacity] = useState(cache.atCapacity);
    const [maxSnapshots, setMaxSnapshots] = useState(cache.maxSnapshots);
    const [isLoadingMeta, setIsLoadingMeta] = useState(false);
    const [metaError, setMetaError] = useState<string | undefined>();

    // ---- detail cache state ----
    const [snapshotDetailCache, setSnapshotDetailCache] = useState<Map<string, RosterSnapshotDetail>>(
        cache.snapshotDetailCache
    );
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // ---- sequence number for saves (start at 0; updated after each successful save) ----
    const [sequenceNumber, setSequenceNumber] = useState(cache.sequenceNumber);
    const [sequenceNumberFetched, setSequenceNumberFetched] = useState(cache.sequenceNumberFetched);

    // ---- comparison state ----
    const [leftSnapshotId, setLeftSnapshotId] = useState<string | undefined>();
    const [rightSnapshotId, setRightSnapshotId] = useState<string | 'current' | undefined>();
    const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
    const [selectedRaidTeamNames, setSelectedRaidTeamNames] = useState<string[]>([]);

    // ---- save dialog ----
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [snapshotName, setSnapshotName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | undefined>();

    // ---- delete dialog ----
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedSnapshotToDelete, setSelectedSnapshotToDelete] = useState<string | undefined>();
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | undefined>();

    const { teams2 } = useContext(StoreContext);

    // ---------------------------------------------------------------------------
    // Metadata load (auto on mount + manual refresh)
    // ---------------------------------------------------------------------------

    const loadMeta = useCallback(async () => {
        setIsLoadingMeta(true);
        setMetaError(undefined);
        const { data, error } = await getGuildRosterSnapshotsMetaApi();
        if (error || !data) {
            setMetaError(typeof error === 'string' ? error : ((error as Error)?.message ?? 'Failed to load snapshots'));
        } else {
            cacheSetMeta(data.snapshots, data.atCapacity, data.maxSnapshots);
            setSnapshotMeta(data.snapshots);
            setAtCapacity(data.atCapacity);
            setMaxSnapshots(data.maxSnapshots);
        }
        setIsLoadingMeta(false);
    }, []);

    useEffect(() => {
        if (cache.metaFetched) return;
        void loadMeta();
    }, [loadMeta]);

    // ---------------------------------------------------------------------------
    // On-demand detail loading (loads ALL snapshot details at once for delta decoding)
    // ---------------------------------------------------------------------------

    const loadAllDetails = useCallback(
        async (meta: RosterSnapshotInfo[]) => {
            const unloaded = meta.filter(s => !snapshotDetailCache.has(s.snapshotId));
            if (unloaded.length === 0) return;
            setIsLoadingDetails(true);
            const results = await Promise.all(unloaded.map(s => getGuildRosterSnapshotDetailApi(s.snapshotId)));
            const next = new Map(snapshotDetailCache);
            for (const [index, result] of results.entries()) {
                const id = unloaded[index]?.snapshotId;
                if (id && result.data) next.set(id, result.data);
            }
            cacheSetDetailCache(next);
            setSnapshotDetailCache(next);
            setIsLoadingDetails(false);
        },
        [snapshotDetailCache]
    );

    // ---------------------------------------------------------------------------
    // Derived data
    // ---------------------------------------------------------------------------

    // Snapshots in chronological order (oldest first — required for delta decoding)
    const sortedMeta = useMemo(
        () => [...(snapshotMeta ?? [])].toSorted((a, b) => a.createdAt.localeCompare(b.createdAt)),
        [snapshotMeta]
    );

    // Reconstruct GuildRosterHistoryResponse from cached details (for buildMemberHistoryMap)
    const effectiveHistory = useMemo((): GuildRosterHistoryResponse => {
        const snapshots = sortedMeta
            .filter(meta => snapshotDetailCache.has(meta.snapshotId))
            .map(meta => ({
                name: meta.name,
                members: snapshotDetailCache.get(meta.snapshotId)!.members as GuildRosterSnapshotMember[],
            }));
        return { sequenceNumber, snapshots };
    }, [sortedMeta, snapshotDetailCache, sequenceNumber]);

    const memberHistoryMap = useMemo(() => buildMemberHistoryMap(effectiveHistory), [effectiveHistory]);

    // Subset of sortedMeta that have details loaded — mirrors effectiveHistory.snapshots index-for-index.
    const filteredMeta = useMemo(
        () => sortedMeta.filter(meta => snapshotDetailCache.has(meta.snapshotId)),
        [sortedMeta, snapshotDetailCache]
    );

    // Convert snapshotId → index in filteredMeta (= index in effectiveHistory / memberHistoryMap)
    const leftIndex = useMemo(
        () => (leftSnapshotId === undefined ? undefined : filteredMeta.findIndex(m => m.snapshotId === leftSnapshotId)),
        [leftSnapshotId, filteredMeta]
    );

    const rightIndexOrCurrent = useMemo((): number | 'current' | undefined => {
        if (rightSnapshotId === undefined) return undefined;
        if (rightSnapshotId === 'current') return 'current';
        const index = filteredMeta.findIndex(m => m.snapshotId === rightSnapshotId);
        return index === -1 ? undefined : index;
    }, [rightSnapshotId, filteredMeta]);

    // Save dialog: existing snapshot names for duplicate detection
    const existingNames = useMemo(() => new Set(sortedMeta.map(s => s.name)), [sortedMeta]);
    const trimmedName = snapshotName.trim();
    const isDuplicateName = existingNames.has(trimmedName);
    const isNameValid = trimmedName.length > 0 && !isDuplicateName;
    const approachingLimit = maxSnapshots > 0 && (snapshotMeta?.length ?? 0) === maxSnapshots - 1;

    // "To" dropdown options: snapshots NEWER than left selection + "Current Rosters"
    const rightOptions = useMemo((): Array<{ value: string | 'current'; label: string }> => {
        if (leftSnapshotId === undefined) return [];
        const leftSortedIndex = sortedMeta.findIndex(m => m.snapshotId === leftSnapshotId);
        if (leftSortedIndex === -1) return [];
        const options: Array<{ value: string | 'current'; label: string }> = [];
        for (let index = leftSortedIndex + 1; index < sortedMeta.length; index++) {
            options.push({ value: sortedMeta[index]!.snapshotId, label: sortedMeta[index]!.name });
        }
        const membersLoadedLabel = members === undefined ? 'Current Rosters (loading…)' : 'Current Rosters';
        options.push({ value: 'current', label: membersLoadedLabel });
        return options;
    }, [leftSnapshotId, sortedMeta, members]);

    // Players eligible for the Player dropdown
    const membersInComparison = useMemo((): Array<{ userId: string; isNew: boolean }> => {
        if (leftIndex === undefined || rightIndexOrCurrent === undefined) return [];
        const result: Array<{ userId: string; isNew: boolean }> = [];
        for (const userId of memberHistoryMap.keys()) {
            const memberHistory = memberHistoryMap.get(userId);
            if (!memberHistory) continue;
            const hasRight =
                rightIndexOrCurrent === 'current'
                    ? memberStates.get(userId)?.status === 'success'
                    : getMemberRosterAtIndex(memberHistory, rightIndexOrCurrent) !== undefined;
            if (!hasRight) continue;
            const hasLeft = getMemberRosterAtIndex(memberHistory, leftIndex) !== undefined;
            result.push({ userId, isNew: !hasLeft });
        }
        return result;
    }, [leftIndex, rightIndexOrCurrent, memberHistoryMap, memberStates]);

    const raidTeams = useMemo(() => teams2.filter(t => t.raid), [teams2]);

    const raidTeamFilterOptions = useMemo(
        () => raidTeams.map(t => ({ name: t.name, isSelected: selectedRaidTeamNames.includes(t.name) })),
        [raidTeams, selectedRaidTeamNames]
    );

    const toggleRaidTeam = (teamName: string) => {
        setSelectedRaidTeamNames(current => {
            const next = new Set(current);
            if (next.has(teamName)) {
                next.delete(teamName);
            } else {
                next.add(teamName);
            }
            return [...next];
        });
    };

    const diffEntries = useMemo((): DiffEntry[] => {
        if (selectedUserId === undefined || leftIndex === undefined || rightIndexOrCurrent === undefined) return [];
        const memberHistory = memberHistoryMap.get(selectedUserId);
        if (!memberHistory) return [];

        let rightRoster: IRosterSnapshot | undefined;
        if (rightIndexOrCurrent === 'current') {
            const state = memberStates.get(selectedUserId);
            if (state?.status !== 'success') return [];
            rightRoster = {
                name: 'Current',
                dateMillisUtc: 0,
                chars: state.parsed.units.flatMap(u => (u.char ? [u.char] : [])),
                mows: state.parsed.units.flatMap(u => (u.mow ? [u.mow] : [])),
            };
        } else {
            rightRoster = getMemberRosterAtIndex(memberHistory, rightIndexOrCurrent);
        }
        if (!rightRoster) return [];

        const fixedRight = RosterSnapshotsService.fixSnapshot(rightRoster);
        const leftRoster = getMemberRosterAtIndex(memberHistory, leftIndex);

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
    }, [selectedUserId, leftIndex, rightIndexOrCurrent, memberHistoryMap, memberStates]);

    const selectedUnitIds = useMemo(
        () => getUnitIdsFromTeamNames(raidTeams, selectedRaidTeamNames),
        [raidTeams, selectedRaidTeamNames]
    );

    const filteredDiffEntries = useMemo((): DiffEntry[] => {
        if (selectedUnitIds.size === 0) return diffEntries;
        return diffEntries.filter(
            ({ char, mow }) => (char && selectedUnitIds.has(char.id)) || (mow && selectedUnitIds.has(mow.id))
        );
    }, [diffEntries, selectedUnitIds]);

    // No-history fallback: show current roster for selected member
    const isNoHistoryMode = snapshotMeta !== undefined && snapshotMeta.length === 0;
    const selectedMemberState = selectedUserId === undefined ? undefined : memberStates.get(selectedUserId);
    const currentUnits =
        isNoHistoryMode && selectedMemberState?.status === 'success' ? selectedMemberState.parsed.units : undefined;

    const filteredNonDiffEntries = useMemo(() => {
        if (selectedUnitIds.size === 0) return currentUnits;
        return currentUnits?.filter(u =>
            u.char ? selectedUnitIds.has(u.char.id) : u.mow ? selectedUnitIds.has(u.mow.id) : false
        );
    }, [currentUnits, selectedUnitIds]);

    const apiKeyErrorIds = members?.filter(id => memberStates.get(id)?.status === 'error') ?? [];

    // ---------------------------------------------------------------------------
    // Save dialog handlers
    // ---------------------------------------------------------------------------

    const openSaveDialog = async () => {
        setSnapshotName(makeDefaultSnapshotName());
        setSaveError(undefined);
        // Lazily fetch the sequence number from the old endpoint on the first save of the session.
        if (!sequenceNumberFetched) {
            const { data } = await getGuildRosterHistoryApi();
            if (data?.sequenceNumber !== undefined) {
                cacheSetSequenceNumber(data.sequenceNumber);
                setSequenceNumber(data.sequenceNumber);
                cacheMarkSequenceNumberFetched();
                setSequenceNumberFetched(true);
            }
        }
        setSaveDialogOpen(true);
    };

    const closeSaveDialog = () => setSaveDialogOpen(false);

    const handleSaveSnapshot = async () => {
        if (!isNameValid) return;
        setIsSaving(true);
        setSaveError(undefined);

        const newSnapshot = buildNewSnapshot(trimmedName, memberStates, memberHistoryMap);
        const { data, error } = await postGuildRosterSnapshotApi(sequenceNumber, newSnapshot);

        if (error) {
            setSaveError(typeof error === 'string' ? error : ((error as Error).message ?? 'Failed to save snapshot'));
            setIsSaving(false);
            return;
        }

        if (data?.sequenceNumber !== undefined) {
            cacheSetSequenceNumber(data.sequenceNumber);
            setSequenceNumber(data.sequenceNumber);
        }
        setIsSaving(false);
        setSaveDialogOpen(false);
        // Reload metadata to pick up the new snapshot (and its server-assigned snapshotId).
        await loadMeta();
    };

    // ---------------------------------------------------------------------------
    // Delete dialog handlers
    // ---------------------------------------------------------------------------

    const openDeleteDialog = () => {
        setSelectedSnapshotToDelete(undefined);
        setDeleteError(undefined);
        setDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => setDeleteDialogOpen(false);

    const handleDeleteSnapshot = async () => {
        if (!selectedSnapshotToDelete) return;
        setIsDeleting(true);
        setDeleteError(undefined);

        const { data, error } = await deleteGuildRosterSnapshotByIdApi(selectedSnapshotToDelete);

        if (error || !data?.deleted) {
            setDeleteError(
                typeof error === 'string' ? error : ((error as Error)?.message ?? 'Failed to delete snapshot')
            );
            setIsDeleting(false);
            return;
        }

        // Remove from local state
        const newMeta = snapshotMeta?.filter(s => s.snapshotId !== selectedSnapshotToDelete);
        const newDetailCache = new Map(snapshotDetailCache);
        newDetailCache.delete(selectedSnapshotToDelete);
        cacheSetAfterDelete(newMeta, newDetailCache);
        setSnapshotMeta(newMeta);
        setSnapshotDetailCache(newDetailCache);
        setAtCapacity(false);

        // Reset comparison selections that referenced the deleted snapshot
        if (leftSnapshotId === selectedSnapshotToDelete) {
            setLeftSnapshotId(undefined);
            setRightSnapshotId(undefined);
            setSelectedUserId(undefined);
        } else if (rightSnapshotId === selectedSnapshotToDelete) {
            setRightSnapshotId(undefined);
            setSelectedUserId(undefined);
        }

        setIsDeleting(false);
        setDeleteDialogOpen(false);
    };

    // ---------------------------------------------------------------------------
    // Selection handler: when user picks a "From" snapshot, load all details
    // ---------------------------------------------------------------------------

    const handleLeftSnapshotSelect = (snapshotId: string) => {
        setLeftSnapshotId(snapshotId);
        setRightSnapshotId(undefined);
        setSelectedUserId(undefined);
        if (snapshotMeta) {
            void loadAllDetails(snapshotMeta);
            if (members === undefined) void onLoadMembers();
        }
    };

    // ---------------------------------------------------------------------------
    // Styles
    // ---------------------------------------------------------------------------

    const selectClass =
        'rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100';
    const labelClass = 'text-sm font-semibold text-gray-700 dark:text-gray-300';
    const canSave = snapshotMeta !== undefined && !isLoadingMeta && !atCapacity && members !== undefined;
    const canDelete = snapshotMeta !== undefined && snapshotMeta.length > 0 && !isLoadingMeta;

    return (
        <div className="flex flex-col gap-4">
            {/* Action buttons */}
            <div className="flex items-center gap-4">
                <Button intent="secondary" isDisabled={isLoadingMeta} onPress={loadMeta}>
                    {isLoadingMeta ? 'Refreshing…' : 'Refresh Snapshots'}
                </Button>
                <Button intent="primary" isDisabled={!canSave} onPress={openSaveDialog}>
                    Save Snapshot
                </Button>
                <Button intent="danger" isDisabled={!canDelete} onPress={openDeleteDialog}>
                    Delete Snapshot
                </Button>
                {(isLoadingMeta || isLoadingDetails) && (
                    <span className="inline-block size-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                )}
            </div>

            {metaError && <p className="text-sm text-red-600 dark:text-red-400">{metaError}</p>}

            {atCapacity && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                    At capacity ({maxSnapshots} snapshots). Delete one before saving another.
                </p>
            )}

            <DebugJson label="guild/roster/snapshots (meta)" value={snapshotMeta ?? 'loading…'} />
            <DebugJson
                label="guild/roster/snapshots (cached details)"
                value={Object.fromEntries(snapshotDetailCache)}
            />

            {apiKeyErrorIds.length > 0 && (
                <section className="flex flex-col gap-2">
                    <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">
                        API key errors ({apiKeyErrorIds.length})
                    </h2>
                    <ul className="flex flex-wrap gap-2">
                        {apiKeyErrorIds.map(id => (
                            <li
                                key={id}
                                className="rounded bg-red-100 px-2 py-0.5 font-mono text-xs text-red-700 dark:bg-red-900/50 dark:text-red-300">
                                {isLikelyUserId(id) ? obfuscateUserId(id) : id}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {snapshotMeta === undefined && !isLoadingMeta && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading snapshot list…</p>
            )}

            {/* Snapshot comparison dropdowns */}
            {snapshotMeta !== undefined && (
                <div className="relative flex flex-wrap items-center gap-4">
                    {/* Spinner overlay while details are loading */}
                    {isLoadingDetails && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded bg-white/60 dark:bg-gray-900/60">
                            <span className="inline-block size-6 animate-spin rounded-full border-4 border-gray-400 border-t-transparent" />
                        </div>
                    )}

                    {sortedMeta.length > 0 && (
                        <>
                            <div className="flex items-center gap-2">
                                <label htmlFor="left-snapshot-select" className={labelClass}>
                                    From:
                                </label>
                                <select
                                    id="left-snapshot-select"
                                    value={leftSnapshotId ?? ''}
                                    onChange={event_ => {
                                        const value = event_.target.value;
                                        if (value === '') {
                                            setLeftSnapshotId(undefined);
                                            setRightSnapshotId(undefined);
                                            setSelectedUserId(undefined);
                                        } else {
                                            handleLeftSnapshotSelect(value);
                                        }
                                    }}
                                    className={selectClass}>
                                    <option value="">— select a snapshot —</option>
                                    {sortedMeta.map(snapshot => (
                                        <option key={snapshot.snapshotId} value={snapshot.snapshotId}>
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
                                    disabled={leftSnapshotId === undefined}
                                    value={rightSnapshotId ?? ''}
                                    onChange={event_ => {
                                        const value = event_.target.value;
                                        setRightSnapshotId(
                                            value === '' ? undefined : value === 'current' ? 'current' : value
                                        );
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

                    {raidTeams.length > 0 && (
                        <RaidTeamFilterDropdown teams={raidTeamFilterOptions} onToggleTeam={toggleRaidTeam} />
                    )}

                    {sortedMeta.length === 0 && members !== undefined && (
                        <div className="flex items-center gap-2">
                            <label htmlFor="current-member-select" className={labelClass}>
                                Player:
                            </label>
                            <select
                                id="current-member-select"
                                value={selectedUserId ?? ''}
                                onChange={event_ => setSelectedUserId(event_.target.value || undefined)}
                                className={selectClass}>
                                <option value="">— select a player —</option>
                                {members
                                    .filter(id => memberStates.get(id)?.status === 'success')
                                    .map(id => (
                                        <option key={id} value={id}>
                                            {getPlayerName(id, memberStates)}
                                        </option>
                                    ))}
                            </select>
                        </div>
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

            {isNoHistoryMode && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {members === undefined
                        ? 'No roster snapshots yet. Load members above to view current rosters.'
                        : 'No roster snapshots yet. Save a snapshot to enable roster comparison.'}
                </p>
            )}

            {/* Diff view */}
            {filteredDiffEntries.length > 0 &&
                (() => {
                    const changed = filteredDiffEntries
                        .filter(event => event.hasChanged)
                        .toSorted((a, b) => b.power - a.power);
                    const unchanged = filteredDiffEntries
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
            {filteredNonDiffEntries !== undefined && (
                <div className="flex flex-wrap gap-2">
                    {/* Similar to the diff case, we need to filter currentUnits to show only characters and mows
                    from the selected raid teams (if any; if nothing selected, we show everything). */}
                    {filteredNonDiffEntries.map(({ char, mow }) =>
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
                        {approachingLimit && (
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                You have {snapshotMeta?.length ?? 0}/{maxSnapshots} snapshots. This is the last slot
                                available.
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
                    <Button intent="secondary" appearance="plain" onPress={closeSaveDialog}>
                        Cancel
                    </Button>
                    <Button intent="primary" isDisabled={!isNameValid || isSaving} onPress={handleSaveSnapshot}>
                        {isSaving ? 'Saving…' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Snapshot dialog */}
            <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Delete Snapshot</DialogTitle>
                <DialogContent>
                    <div className="flex flex-col gap-3 pt-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Select a snapshot to permanently delete:
                        </p>
                        <div className="max-h-64 overflow-y-auto rounded border border-gray-200 dark:border-gray-700">
                            {sortedMeta.map(snapshot => (
                                <button
                                    key={snapshot.snapshotId}
                                    type="button"
                                    onClick={() => setSelectedSnapshotToDelete(snapshot.snapshotId)}
                                    className={[
                                        'w-full px-3 py-2 text-left text-sm transition-colors',
                                        selectedSnapshotToDelete === snapshot.snapshotId
                                            ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800',
                                    ].join(' ')}>
                                    {snapshot.name}
                                </button>
                            ))}
                        </div>
                        {deleteError && <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>}
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button intent="secondary" appearance="plain" onPress={closeDeleteDialog}>
                        Cancel
                    </Button>
                    <Button
                        intent="danger"
                        isDisabled={!selectedSnapshotToDelete || isDeleting}
                        onPress={handleDeleteSnapshot}>
                        {isDeleting ? 'Deleting…' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};
