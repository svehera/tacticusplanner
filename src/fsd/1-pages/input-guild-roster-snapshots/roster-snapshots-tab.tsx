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
    CurrentRosterMember,
    MemberState,
    PlayerRosterChainResponse,
    RosterSnapshotInfo,
    deleteGuildRosterSnapshotByIdApi,
    getGuildRosterPlayerChainApi,
    getGuildRosterSnapshotsMetaApi,
    postGuildRosterMigrateApi,
    postGuildRosterSnapshotApi,
} from './guild-roster-snapshots.models';
import { RaidTeamFilterDropdown } from './raid-team-filter-dropdown';
import {
    DiffEntry,
    buildNewSnapshot,
    getRosterAtSnapshot,
    getPlayerName,
    makeDefaultSnapshotName,
    snapshotCharPower,
    snapshotMowPower,
} from './roster-snapshots-tab.utils';

const SHOW_ALL = RosterSnapshotShowVariableSettings.Always;

// ---------------------------------------------------------------------------
// Module-level cache — persists across navigations within a session
// ---------------------------------------------------------------------------

const cache = {
    snapshotMeta: undefined as RosterSnapshotInfo[] | undefined,
    atCapacity: false,
    maxSnapshots: 0,
    sequenceNumber: 0,
    currentRosterMembers: [] as CurrentRosterMember[],
    playerChainCache: new Map<string, PlayerRosterChainResponse>(),
    metaFetched: false,
};

function cacheSetMeta(
    snapshots: RosterSnapshotInfo[],
    atCapacity: boolean,
    maxSnapshots: number,
    sequenceNumber: number,
    currentRosterMembers: CurrentRosterMember[]
) {
    cache.snapshotMeta = snapshots;
    cache.atCapacity = atCapacity;
    cache.maxSnapshots = maxSnapshots;
    cache.sequenceNumber = sequenceNumber;
    cache.currentRosterMembers = currentRosterMembers;
    cache.metaFetched = true;
}

function cacheSetPlayerChainCache(map: Map<string, PlayerRosterChainResponse>) {
    cache.playerChainCache = map;
}

function cacheSetSequenceNumber(n: number) {
    cache.sequenceNumber = n;
}

function cacheSetAfterDelete(
    snapshotMeta: RosterSnapshotInfo[] | undefined,
    playerChainCache: Map<string, PlayerRosterChainResponse>
) {
    cache.snapshotMeta = snapshotMeta;
    cache.playerChainCache = playerChainCache;
    cache.atCapacity = false;
}

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

async function fetchWithRetry<T>(
    function_: () => Promise<{ data: T | null; error: unknown }>,
    maxAttempts = 3
): Promise<{ data: T | null; error: unknown }> {
    // eslint-disable-next-line unicorn/no-null
    let lastResult: { data: T | null; error: unknown } = { data: null, error: 'Not started' };
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (attempt > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** (attempt - 1)));
        }
        lastResult = await function_();
        if (!lastResult.error && lastResult.data !== null) return lastResult;
    }
    return lastResult;
}

// ---------------------------------------------------------------------------
// Save dialog state
// ---------------------------------------------------------------------------

type SaveStage = 'closed' | 'naming' | 'fetching' | 'computing' | 'saving' | 'error';

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
    const [sequenceNumber, setSequenceNumber] = useState(cache.sequenceNumber);
    const [currentRosterMembers, setCurrentRosterMembers] = useState<CurrentRosterMember[]>(cache.currentRosterMembers);
    const [isLoadingMeta, setIsLoadingMeta] = useState(false);
    const [metaError, setMetaError] = useState<string | undefined>();

    // ---- player chain cache ----
    const [playerChainCache, setPlayerChainCache] = useState<Map<string, PlayerRosterChainResponse>>(
        cache.playerChainCache
    );
    const [isLoadingChain, setIsLoadingChain] = useState(false);

    // ---- comparison state ----
    const [leftSnapshotId, setLeftSnapshotId] = useState<string | undefined>();
    const [rightSnapshotId, setRightSnapshotId] = useState<string | 'current' | undefined>();
    const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
    const [selectedRaidTeamNames, setSelectedRaidTeamNames] = useState<string[]>([]);

    // ---- migration state ----
    const [isMigrating, setIsMigrating] = useState(false);
    const [migrateError, setMigrateError] = useState<string | undefined>();

    // ---- save dialog state ----
    const [saveStage, setSaveStage] = useState<SaveStage>('closed');
    const [snapshotName, setSnapshotName] = useState('');
    const [saveError, setSaveError] = useState<string | undefined>();
    const [chainLoadProgress, setChainLoadProgress] = useState<{ loaded: number; total: number }>({
        loaded: 0,
        total: 0,
    });

    // ---- delete dialog ----
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedSnapshotToDelete, setSelectedSnapshotToDelete] = useState<string | undefined>();
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | undefined>();

    const { teams2 } = useContext(StoreContext);

    // ---------------------------------------------------------------------------
    // Metadata load
    // ---------------------------------------------------------------------------

    const loadMeta = useCallback(async () => {
        setIsLoadingMeta(true);
        setMetaError(undefined);
        const { data, error } = await getGuildRosterSnapshotsMetaApi();
        if (error || !data) {
            setMetaError(typeof error === 'string' ? error : ((error as Error)?.message ?? 'Failed to load snapshots'));
        } else {
            const seq = data.sequenceNumber ?? 0;
            cacheSetMeta(data.snapshots, data.atCapacity, data.maxSnapshots, seq, data.currentRosterMembers);
            setSnapshotMeta(data.snapshots);
            setAtCapacity(data.atCapacity);
            setMaxSnapshots(data.maxSnapshots);
            setSequenceNumber(seq);
            setCurrentRosterMembers(data.currentRosterMembers);
        }
        setIsLoadingMeta(false);
    }, []);

    useEffect(() => {
        if (cache.metaFetched) return;
        void loadMeta();
    }, [loadMeta]);

    // ---------------------------------------------------------------------------
    // Per-player chain load (diff view)
    // ---------------------------------------------------------------------------

    const loadPlayerChain = useCallback(
        async (userId: string) => {
            if (playerChainCache.has(userId)) return;
            setIsLoadingChain(true);
            const result = await fetchWithRetry(() => getGuildRosterPlayerChainApi(userId));
            if (result.data) {
                const next = new Map(playerChainCache);
                next.set(userId, result.data);
                cacheSetPlayerChainCache(next);
                setPlayerChainCache(next);
            }
            setIsLoadingChain(false);
        },
        [playerChainCache]
    );

    // ---------------------------------------------------------------------------
    // Migration
    // ---------------------------------------------------------------------------

    const handleMigrate = async () => {
        setIsMigrating(true);
        setMigrateError(undefined);
        const { error } = await postGuildRosterMigrateApi();
        if (error) {
            setMigrateError(typeof error === 'string' ? error : ((error as Error)?.message ?? 'Migration failed'));
        } else {
            await loadMeta();
        }
        setIsMigrating(false);
    };

    // ---------------------------------------------------------------------------
    // Derived data
    // ---------------------------------------------------------------------------

    const sortedMeta = useMemo(
        () => [...(snapshotMeta ?? [])].toSorted((a, b) => a.createdAt.localeCompare(b.createdAt)),
        [snapshotMeta]
    );

    const needsMigration = useMemo(
        () => (snapshotMeta?.length ?? 0) > 0 && snapshotMeta!.every(s => s.memberIds.length === 0),
        [snapshotMeta]
    );

    const existingNames = useMemo(() => new Set(sortedMeta.map(s => s.name)), [sortedMeta]);
    const trimmedName = snapshotName.trim();
    const isDuplicateName = existingNames.has(trimmedName);
    const isNameValid = trimmedName.length > 0 && !isDuplicateName;
    const approachingLimit = maxSnapshots > 0 && (snapshotMeta?.length ?? 0) === maxSnapshots - 1;

    // "To" dropdown: all other snapshots + "Current Rosters"
    const rightOptions = useMemo((): Array<{ value: string | 'current'; label: string }> => {
        if (leftSnapshotId === undefined) return [];
        const options: Array<{ value: string | 'current'; label: string }> = sortedMeta
            .filter(s => s.snapshotId !== leftSnapshotId)
            .map(s => ({ value: s.snapshotId, label: s.name }));
        const currentLabel = members === undefined ? 'Current Rosters (loading…)' : 'Current Rosters';
        options.push({ value: 'current', label: currentLabel });
        return options;
    }, [leftSnapshotId, sortedMeta, members]);

    // Players eligible for comparison: strict intersection of both sides' memberIds
    const membersInComparison = useMemo((): string[] => {
        if (leftSnapshotId === undefined || rightSnapshotId === undefined) return [];
        const fromIds = new Set(sortedMeta.find(s => s.snapshotId === leftSnapshotId)?.memberIds);
        if (fromIds.size === 0) return [];
        const toIds =
            rightSnapshotId === 'current'
                ? new Set(currentRosterMembers.map(m => m.userId))
                : new Set(sortedMeta.find(s => s.snapshotId === rightSnapshotId)?.memberIds);
        return [...fromIds].filter(id => toIds.has(id));
    }, [leftSnapshotId, rightSnapshotId, sortedMeta, currentRosterMembers]);

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
        if (!selectedUserId || !leftSnapshotId || !rightSnapshotId) return [];
        const chainResp = playerChainCache.get(selectedUserId);
        if (!chainResp) return []; // still loading

        const leftRoster = getRosterAtSnapshot(chainResp.chain, leftSnapshotId);

        let rightRoster: IRosterSnapshot | undefined;
        if (rightSnapshotId === 'current') {
            const state = memberStates.get(selectedUserId);
            if (state?.status !== 'success') return [];
            rightRoster = {
                name: 'Current',
                dateMillisUtc: 0,
                chars: state.parsed.units.flatMap(u => (u.char ? [u.char] : [])),
                mows: state.parsed.units.flatMap(u => (u.mow ? [u.mow] : [])),
            };
        } else {
            rightRoster = getRosterAtSnapshot(chainResp.chain, rightSnapshotId);
        }

        if (!rightRoster) return [];
        const fixedRight = RosterSnapshotsService.fixSnapshot(rightRoster);

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
    }, [selectedUserId, leftSnapshotId, rightSnapshotId, playerChainCache, memberStates]);

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

    // No-snapshot mode: view a single player's current roster
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
    // Selection handlers
    // ---------------------------------------------------------------------------

    const handleLeftSnapshotSelect = (snapshotId: string) => {
        setLeftSnapshotId(snapshotId);
        setRightSnapshotId(undefined);
        setSelectedUserId(undefined);
        if (members === undefined) void onLoadMembers();
    };

    const handlePlayerSelect = (userId: string | undefined) => {
        setSelectedUserId(userId);
        if (userId) void loadPlayerChain(userId);
    };

    // ---------------------------------------------------------------------------
    // Save dialog handlers
    // ---------------------------------------------------------------------------

    const openSaveDialog = () => {
        setSnapshotName(makeDefaultSnapshotName());
        setSaveError(undefined);
        setSaveStage('naming');
        // Start loading member rosters in the background so they're ready when Save is confirmed.
        if (members === undefined) void onLoadMembers();
    };

    const closeSaveDialog = () => setSaveStage('closed');

    const handleSaveSnapshot = async () => {
        if (!isNameValid) return;

        // Step 1: determine which chains need fetching
        const latestSnapshot = sortedMeta.at(-1);
        const latestSnapshotId = latestSnapshot?.snapshotId;
        const latestMemberIds = latestSnapshot?.memberIds ?? [];
        const uncached = latestMemberIds.filter(id => !playerChainCache.has(id));

        // Step 2: fetch missing chains with retry
        setSaveStage('fetching');
        setChainLoadProgress({ loaded: 0, total: uncached.length });

        const nextCache = new Map(playerChainCache);
        for (const [index, userId] of uncached.entries()) {
            const result = await fetchWithRetry(() => getGuildRosterPlayerChainApi(userId));
            if (result.error || !result.data) {
                // Persist whatever was loaded so far before surfacing the error
                cacheSetPlayerChainCache(nextCache);
                setPlayerChainCache(nextCache);
                setSaveError(
                    `Failed to load roster history for ${isLikelyUserId(userId) ? obfuscateUserId(userId) : userId}. ` +
                        `${index} / ${uncached.length} histories were loaded and cached — ` +
                        `try again to resume.`
                );
                setSaveStage('error');
                return;
            }
            nextCache.set(userId, result.data);
            setChainLoadProgress({ loaded: index + 1, total: uncached.length });
        }

        // Persist the full updated cache
        cacheSetPlayerChainCache(nextCache);
        setPlayerChainCache(nextCache);

        // Step 3: compute diffs
        setSaveStage('computing');
        const newSnapshot = buildNewSnapshot(trimmedName, memberStates, nextCache, latestSnapshotId);

        // Step 4: POST
        setSaveStage('saving');
        const { data, error } = await postGuildRosterSnapshotApi(sequenceNumber, newSnapshot);

        if (error) {
            const message = typeof error === 'string' ? error : ((error as Error)?.message ?? 'Failed to save');
            const isSequenceConflict = message.toLowerCase().includes('sequence');
            setSaveError(
                isSequenceConflict
                    ? 'Another guild member saved a snapshot while you were working. Please refresh and try again.'
                    : message
            );
            setSaveStage('error');
            return;
        }

        if (data?.sequenceNumber !== undefined) {
            cacheSetSequenceNumber(data.sequenceNumber);
            setSequenceNumber(data.sequenceNumber);
        }

        setSaveStage('closed');
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

        const newMeta = snapshotMeta?.filter(s => s.snapshotId !== selectedSnapshotToDelete);
        // Invalidate the entire chain cache — server has pruned chain entries for this snapshot
        const emptyChainCache = new Map<string, PlayerRosterChainResponse>();
        cacheSetAfterDelete(newMeta, emptyChainCache);
        setSnapshotMeta(newMeta);
        setPlayerChainCache(emptyChainCache);
        setAtCapacity(false);

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
    // Styles
    // ---------------------------------------------------------------------------

    const selectClass = 'rounded border border-(--border) bg-(--bg) px-2 py-1 text-sm text-(--fg)';
    const labelClass = 'text-sm font-semibold text-(--fg)';
    const canSave =
        snapshotMeta !== undefined &&
        !isLoadingMeta &&
        !atCapacity &&
        (members !== undefined || currentRosterMembers.length > 0);
    const canDelete = snapshotMeta !== undefined && snapshotMeta.length > 0 && !isLoadingMeta;

    // ---------------------------------------------------------------------------
    // Save dialog content helper
    // ---------------------------------------------------------------------------

    const renderSaveDialogContent = () => {
        switch (saveStage) {
            case 'naming': {
                const latestMemberCount = sortedMeta.at(-1)?.memberIds.length ?? 0;
                const uncachedCount = (sortedMeta.at(-1)?.memberIds ?? []).filter(
                    id => !playerChainCache.has(id)
                ).length;
                return (
                    <>
                        <DialogTitle>Save Snapshot</DialogTitle>
                        <DialogContent>
                            <div className="flex flex-col gap-4 pt-2">
                                {approachingLimit && (
                                    <p className="text-sm text-amber-600 dark:text-amber-400">
                                        You have {snapshotMeta?.length ?? 0}/{maxSnapshots} snapshots. This is the last
                                        slot available.
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
                                        className="rounded border border-(--input-border) bg-(--bg) px-3 py-1.5 text-sm text-(--fg) focus:border-(--primary) focus:outline-none"
                                        autoFocus
                                    />
                                    {isDuplicateName && (
                                        <p className="text-danger text-xs">A snapshot with this name already exists.</p>
                                    )}
                                </div>
                                {latestMemberCount > 0 && uncachedCount > 0 && (
                                    <p className="rounded border border-(--border) bg-(--soft) px-3 py-2 text-sm text-(--fg)">
                                        Saving will fetch roster history for <strong>{uncachedCount}</strong> player
                                        {uncachedCount === 1 ? '' : 's'} to compute diffs. This may take a few seconds.
                                    </p>
                                )}
                            </div>
                        </DialogContent>
                        <DialogActions>
                            <Button intent="secondary" onPress={closeSaveDialog}>
                                Cancel
                            </Button>
                            <Button intent="primary" isDisabled={!isNameValid} onPress={handleSaveSnapshot}>
                                Save
                            </Button>
                        </DialogActions>
                    </>
                );
            }

            case 'fetching': {
                return (
                    <>
                        <DialogTitle>Save Snapshot</DialogTitle>
                        <DialogContent>
                            <div className="flex flex-col items-center gap-3 py-4">
                                <span className="inline-block size-6 animate-spin rounded-full border-4 border-(--border) border-t-(--primary)" />
                                <p className="text-sm text-(--fg)">
                                    Loading roster histories ({chainLoadProgress.loaded} / {chainLoadProgress.total})…
                                </p>
                            </div>
                        </DialogContent>
                    </>
                );
            }

            case 'computing': {
                return (
                    <>
                        <DialogTitle>Save Snapshot</DialogTitle>
                        <DialogContent>
                            <div className="flex flex-col items-center gap-3 py-4">
                                <span className="inline-block size-6 animate-spin rounded-full border-4 border-(--border) border-t-(--primary)" />
                                <p className="text-sm text-(--fg)">Computing diffs…</p>
                            </div>
                        </DialogContent>
                    </>
                );
            }

            case 'saving': {
                return (
                    <>
                        <DialogTitle>Save Snapshot</DialogTitle>
                        <DialogContent>
                            <div className="flex flex-col items-center gap-3 py-4">
                                <span className="inline-block size-6 animate-spin rounded-full border-4 border-(--border) border-t-(--primary)" />
                                <p className="text-sm text-(--fg)">Saving…</p>
                            </div>
                        </DialogContent>
                    </>
                );
            }

            case 'error': {
                return (
                    <>
                        <DialogTitle>Save Snapshot</DialogTitle>
                        <DialogContent>
                            <p className="text-danger pt-2 text-sm">{saveError}</p>
                        </DialogContent>
                        <DialogActions>
                            <Button intent="secondary" onPress={closeSaveDialog}>
                                Close
                            </Button>
                        </DialogActions>
                    </>
                );
            }

            default: {
                return;
            }
        }
    };

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

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
                {isLoadingMeta && (
                    <span className="inline-block size-4 animate-spin rounded-full border-2 border-(--border) border-t-(--primary)" />
                )}
            </div>

            {metaError && <p className="text-danger text-sm">{metaError}</p>}

            {atCapacity && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                    At capacity ({maxSnapshots} snapshots). Delete one before saving another.
                </p>
            )}

            {/* Migration banner */}
            {needsMigration && (
                <div className="flex items-center gap-3 rounded border border-(--border) bg-(--soft) px-3 py-2">
                    <p className="flex-1 text-sm text-(--fg)">
                        This guild has existing snapshots that need to be migrated to the new format before the diff
                        view is available.
                    </p>
                    <Button intent="primary" isDisabled={isMigrating} onPress={handleMigrate}>
                        {isMigrating ? (
                            <span className="flex items-center gap-2">
                                <span className="inline-block size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                Migrating…
                            </span>
                        ) : (
                            'Migrate Data'
                        )}
                    </Button>
                    {migrateError && <p className="text-danger text-sm">{migrateError}</p>}
                </div>
            )}

            <DebugJson label="guild/roster/snapshots (meta)" value={snapshotMeta ?? 'loading…'} />
            <DebugJson label="guild/roster/player-chain (cache)" value={Object.fromEntries(playerChainCache)} />

            {apiKeyErrorIds.length > 0 && (
                <section className="flex flex-col gap-2">
                    <h2 className="text-danger text-sm font-semibold">API key errors ({apiKeyErrorIds.length})</h2>
                    <ul className="flex flex-wrap gap-2">
                        {apiKeyErrorIds.map(id => (
                            <li key={id} className="bg-danger/10 text-danger rounded px-2 py-0.5 font-mono text-xs">
                                {isLikelyUserId(id) ? obfuscateUserId(id) : id}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {snapshotMeta === undefined && !isLoadingMeta && (
                <p className="text-sm text-(--soft-fg)">Loading snapshot list…</p>
            )}

            {/* Snapshot comparison dropdowns */}
            {snapshotMeta !== undefined && (
                <div className="relative flex flex-wrap items-center gap-4">
                    {/* Chain loading spinner */}
                    {isLoadingChain && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded bg-(--bg)/60">
                            <span className="inline-block size-6 animate-spin rounded-full border-4 border-(--border) border-t-(--primary)" />
                        </div>
                    )}

                    {sortedMeta.length === 0 && (
                        <>
                            <div className="flex items-center gap-2">
                                <label htmlFor="left-snapshot-select" className={labelClass}>
                                    From:
                                </label>
                                <select id="left-snapshot-select" disabled className={`${selectClass} opacity-50`}>
                                    <option>— no snapshots yet —</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label htmlFor="right-snapshot-select" className={labelClass}>
                                    To:
                                </label>
                                <select id="right-snapshot-select" disabled className={`${selectClass} opacity-50`}>
                                    <option value="current">Current Rosters</option>
                                </select>
                            </div>
                            {currentRosterMembers.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <label htmlFor="current-member-select" className={labelClass}>
                                        Player:
                                    </label>
                                    <select
                                        id="current-member-select"
                                        value={selectedUserId ?? ''}
                                        onChange={event_ => {
                                            const id = event_.target.value || undefined;
                                            setSelectedUserId(id);
                                            if (id && members === undefined) void onLoadMembers();
                                        }}
                                        className={selectClass}>
                                        <option value="">— select a player —</option>
                                        {currentRosterMembers.map(m => (
                                            <option key={m.userId} value={m.userId}>
                                                {m.playerName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </>
                    )}

                    {sortedMeta.length > 0 && !needsMigration && (
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

                    {/* Comparison mode: player picker from intersection */}
                    {membersInComparison.length > 0 && (
                        <div className="flex items-center gap-2">
                            <label htmlFor="history-member-select" className={labelClass}>
                                Player:
                            </label>
                            <select
                                id="history-member-select"
                                value={selectedUserId ?? ''}
                                onChange={event_ => handlePlayerSelect(event_.target.value || undefined)}
                                className={selectClass}>
                                <option value="">— select a player —</option>
                                {membersInComparison.map(userId => (
                                    <option key={userId} value={userId}>
                                        {getPlayerName(userId, memberStates, currentRosterMembers)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
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

            {/* No-snapshot mode: loading indicator */}
            {isNoHistoryMode && selectedUserId !== undefined && selectedMemberState?.status === 'loading' && (
                <div className="flex items-center gap-2 text-sm text-(--soft-fg)">
                    <span className="inline-block size-4 animate-spin rounded-full border-2 border-(--border) border-t-(--primary)" />
                    Loading roster…
                </div>
            )}

            {/* No-snapshot mode: current roster for selected player */}
            {filteredNonDiffEntries !== undefined && (
                <div className="flex flex-wrap gap-2">
                    {filteredNonDiffEntries
                        .toSorted((a, b) => b.power - a.power)
                        .map(({ char, mow }) =>
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
            <Dialog
                open={saveStage !== 'closed'}
                onClose={saveStage === 'naming' ? closeSaveDialog : undefined}
                maxWidth="sm"
                fullWidth>
                {renderSaveDialogContent()}
            </Dialog>

            {/* Delete Snapshot dialog */}
            <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Delete Snapshot</DialogTitle>
                <DialogContent>
                    <div className="flex flex-col gap-3 pt-2">
                        <p className="text-sm text-(--soft-fg)">Select a snapshot to permanently delete:</p>
                        <div className="max-h-64 overflow-y-auto rounded border border-(--border)">
                            {sortedMeta.map(snapshot => (
                                <button
                                    key={snapshot.snapshotId}
                                    type="button"
                                    onClick={() => setSelectedSnapshotToDelete(snapshot.snapshotId)}
                                    className={[
                                        'w-full px-3 py-2 text-left text-sm transition-colors',
                                        selectedSnapshotToDelete === snapshot.snapshotId
                                            ? 'bg-(--primary)/10 font-medium text-(--primary)'
                                            : 'hover:bg-(--neutral)',
                                    ].join(' ')}>
                                    {snapshot.name}
                                </button>
                            ))}
                        </div>
                        {deleteError && <p className="text-danger text-sm">{deleteError}</p>}
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button intent="secondary" onPress={closeDeleteDialog}>
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
