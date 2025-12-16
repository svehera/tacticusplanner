import AddAPhoto from '@mui/icons-material/AddAPhoto';
import Settings from '@mui/icons-material/Settings';
import SyncIcon from '@mui/icons-material/Sync';
import { Button } from '@mui/material';
import { useCallback, useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line import-x/no-internal-modules
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { Rank, RarityStars } from '@/fsd/5-shared/model';
// eslint-disable-next-line import-x/no-internal-modules
import { Rarity } from '@/fsd/5-shared/model/enums/rarity.enum';

import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';

// eslint-disable-next-line import-x/no-internal-modules
import { useSyncWithTacticus } from '@/v2/features/tacticus-integration/useSyncWithTacticus';

import { IRosterSnapshot, IRosterSnapshotsState } from './models';
import { RosterSnapshotsService } from './roster-snapshots-service';
import { RosterSnapshotsUnit } from './roster-snapshots-unit';
import { RosterSnapshotsUnitDiff } from './roster-snapshots-unit-diff';
import { TakeSnapshotDialog } from './take-snapshot-dialog';

const MAX_SNAPSHOTS: number = 20;

export const RosterSnapshots = () => {
    const { characters, mows: unresolvedMows, rosterSnapshots, viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const { syncWithTacticus } = useSyncWithTacticus();
    const chars = CharactersService.resolveStoredCharacters(characters);
    const mows = MowsService.resolveAllFromStorage(unresolvedMows);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [snapshotName, setSnapshotName] = useState('');

    useEffect(() => {}, [rosterSnapshots]);

    const sync = async () => {
        console.log('Syncing with Tacticus...');
        await syncWithTacticus(viewPreferences.apiIntegrationSyncOptions);
    };

    const takeSnapshot = () => {
        const defaultName = `Snapshot ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
        setSnapshotName(defaultName);
        setIsDialogOpen(true);
    };

    const handleSaveSnapshot = () => {
        setIsDialogOpen(false);
        if (snapshotName.trim()) createAndDispatchSnapshot(snapshotName.trim());
    };

    const handleCancelSnapshot = () => {
        setIsDialogOpen(false);
    };

    const createAndDispatchSnapshot = useCallback(
        (name: string) => {
            const snapshot = RosterSnapshotsService.createSnapshot(name, new Date().getTime(), chars, mows);
            if (rosterSnapshots.base === undefined) {
                dispatch.rosterSnapshots({
                    base: snapshot,
                    diffs: [],
                });
                return;
            }
            const resolved: IRosterSnapshot[] = [];
            resolved.push(rosterSnapshots.base);
            rosterSnapshots.diffs.forEach(diff => {
                resolved.push(RosterSnapshotsService.resolveSnapshotDiff(resolved[resolved.length - 1], diff));
            });
            resolved.push(snapshot);

            const newSnapshots: IRosterSnapshotsState = {
                base: resolved[0],
                diffs: [],
            };
            resolved.splice(0, 1).forEach((snap, index) => {
                if (index == 0) return;
                newSnapshots.diffs.push(RosterSnapshotsService.diffSnapshots(resolved[index - 1], snap));
            });
            // Limit number of snapshots stored
            if (newSnapshots.diffs.length > MAX_SNAPSHOTS - 1) {
                newSnapshots.diffs.splice(0, newSnapshots.diffs.length - (MAX_SNAPSHOTS - 1));
            }
            dispatch.rosterSnapshots(newSnapshots);
        },
        [chars, mows, rosterSnapshots, dispatch]
    );

    const openSettings = () => {};

    return (
        <div>
            <div>
                <TakeSnapshotDialog
                    chars={chars}
                    mows={mows}
                    isOpen={isDialogOpen}
                    onSave={handleSaveSnapshot}
                    onCancel={handleCancelSnapshot}
                />
            </div>
            <div className="flex justify-begin p-2 border-b border-gray-600">
                <Button size="small" variant="contained" color="primary" onClick={sync}>
                    <SyncIcon className="mr-1" />
                    {!isMobile && 'Sync'}
                </Button>
                <div className="w-1" />
                <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={takeSnapshot}
                    disabled={rosterSnapshots.diffs.length >= MAX_SNAPSHOTS - 1}>
                    <AddAPhoto className="mr-1" />
                    {!isMobile && 'Take Snapshot'}
                </Button>
                <div className="w-1" />
                <Button size="small" variant="contained" color="primary" onClick={openSettings}>
                    <Settings className="mr-1" />
                    {!isMobile && 'Settings'}
                </Button>
            </div>
            <div>
                <RosterSnapshotsUnit
                    char={{
                        id: 'bloodDante',
                        rarity: Rarity.Common,
                        rank: Rank.Diamond3,
                        stars: RarityStars.OneBlueStar,
                        active: 36,
                        passive: 50,
                    }}
                />
            </div>
            <div>
                <RosterSnapshotsUnit
                    mow={{
                        id: 'adeptExorcist',
                        rarity: Rarity.Mythic,
                        stars: RarityStars.OneBlueStar,
                        active: 36,
                        passive: 50,
                    }}
                />
            </div>
            <div>
                <RosterSnapshotsUnitDiff
                    char={{
                        id: 'bloodDante',
                        rarity: Rarity.Common,
                        rank: Rank.Diamond3,
                        stars: RarityStars.OneBlueStar,
                        active: 36,
                        passive: 50,
                    }}
                    diff={{
                        id: 'bloodDante',
                        rarity: Rarity.Rare,
                        rank: Rank.Adamantine1,
                        active: 40,
                    }}
                />
            </div>
            <div>
                <RosterSnapshotsUnitDiff
                    char={{
                        id: 'worldKharn',
                        rarity: Rarity.Common,
                        rank: Rank.Stone1,
                        stars: RarityStars.OneStar,
                        active: 1,
                        passive: 1,
                    }}
                    diff={{
                        id: 'worldKharn',
                        rank: Rank.Adamantine3,
                        rarity: Rarity.Mythic,
                        stars: RarityStars.MythicWings,
                        active: 65,
                        passive: 65,
                    }}
                />
            </div>
            <div>
                <RosterSnapshotsUnitDiff
                    mow={{
                        id: 'adeptExorcist',
                        rarity: Rarity.Common,
                        stars: RarityStars.OneStar,
                        active: 1,
                        passive: 1,
                    }}
                    diff={{
                        id: 'adeptExorcist',
                        rank: Rank.Adamantine3,
                        rarity: Rarity.Mythic,
                        stars: RarityStars.MythicWings,
                        active: 65,
                        passive: 65,
                    }}
                />
            </div>
        </div>
    );
};
