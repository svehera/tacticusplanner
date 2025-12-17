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
import { RosterSnapshotsUnitDiff2 } from './roster-snapshots-unit-diff2';

const MAX_SNAPSHOTS: number = 20;

export const RosterSnapshots = () => {
    const { characters, mows: unresolvedMows, rosterSnapshots, viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const { syncWithTacticus } = useSyncWithTacticus();
    const chars = CharactersService.resolveStoredCharacters(characters);
    const mows = MowsService.resolveAllFromStorage(unresolvedMows);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [snapshotName, setSnapshotName] = useState('');

    useEffect(() => { }, [rosterSnapshots]);

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
                    type: 'Set',
                    value: {
                        base: snapshot,
                        diffs: [],
                    },
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
            if (newSnapshots.diffs.length > MAX_SNAPSHOTS - 1) {
                newSnapshots.diffs.splice(0, newSnapshots.diffs.length - (MAX_SNAPSHOTS - 1));
            }
            dispatch.rosterSnapshots({ type: 'Set', value: newSnapshots });
        },
        [chars, mows, rosterSnapshots, dispatch]
    );

    const openSettings = () => { };

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
            <div className="flex flex-wrap gap-4 p-4">
                {
                    <RosterSnapshotsUnit
                        key={`demo-leg-locked`}
                        char={{
                            id: 'bloodMephiston',
                            rarity: Rarity.Legendary,
                            rank: Rank.Locked,
                            stars: RarityStars.RedThreeStars,
                            active: 0,
                            passive: 0,
                        }}
                    />
                }
                {
                    [RarityStars.None, RarityStars.OneStar, RarityStars.TwoStars].map((stars) => (
                        <RosterSnapshotsUnit
                            key={`demo-common-${stars}`}
                            char={{
                                id: 'bloodDante',
                                rarity: Rarity.Common,
                                rank: Rank.Iron1,
                                stars: stars,
                                active: 1,
                                passive: 8,
                            }}
                        />
                    ))
                }
                {
                    [RarityStars.TwoStars, RarityStars.ThreeStars, RarityStars.FourStars].map((stars) => (
                        <RosterSnapshotsUnit
                            key={`demo-uncommon-${stars}`}
                            char={{
                                id: 'custoTrajann',
                                rarity: Rarity.Uncommon,
                                rank: Rank.Bronze1,
                                stars: stars,
                                active: 9,
                                passive: 17,
                            }}
                        />
                    ))
                }
                {
                    [RarityStars.FourStars, RarityStars.FiveStars, RarityStars.RedOneStar].map((stars) => (
                        <RosterSnapshotsUnit
                            key={`demo-rare-${stars}`}
                            char={{
                                id: 'blackAbaddon',
                                rarity: Rarity.Rare,
                                rank: Rank.Silver1,
                                stars: stars,
                                active: 18,
                                passive: 26,
                            }}
                        />
                    ))
                }
                {
                    [RarityStars.RedOneStar, RarityStars.RedTwoStars, RarityStars.RedThreeStars].map((stars) => (
                        <RosterSnapshotsUnit
                            key={`demo-epic-${stars}`}
                            char={{
                                id: 'worldKharn',
                                rarity: Rarity.Epic,
                                rank: Rank.Gold1,
                                stars: stars,
                                active: 27,
                                passive: 35,
                            }}
                        />
                    ))
                }
                {
                    [RarityStars.RedThreeStars, RarityStars.RedFourStars, RarityStars.RedFiveStars, RarityStars.OneBlueStar].map((stars) => (
                        <RosterSnapshotsUnit
                            key={`demo-legendary-${stars}`}
                            char={{
                                id: 'custoBladeChampion',
                                rarity: Rarity.Legendary,
                                rank: Rank.Diamond3,
                                stars: stars,
                                active: 36,
                                passive: 50,
                            }}
                        />
                    ))
                }
                {
                    [RarityStars.OneBlueStar, RarityStars.TwoBlueStars, RarityStars.ThreeBlueStars, RarityStars.MythicWings].map((stars) => (
                        <RosterSnapshotsUnit
                            key={`demo-legendary-${stars}`}
                            char={{
                                id: 'thousAhriman',
                                rarity: Rarity.Mythic,
                                rank: Rank.Adamantine3,
                                stars: stars,
                                active: 51,
                                passive: 55,
                            }}
                        />
                    ))
                }
            </div>
            <div className="flex flex-wrap">
                <RosterSnapshotsUnitDiff
                    char={{
                        id: 'bloodDante',
                        rarity: Rarity.Rare,
                        rank: Rank.Silver1,
                        stars: RarityStars.FiveStars,
                        active: 36,
                        passive: 50,
                    }}
                    diff={{
                        id: 'bloodDante',
                        rarity: Rarity.Legendary,
                        rank: Rank.Adamantine1,
                        stars: RarityStars.RedFiveStars,
                        active: 40,
                    }}
                />
                <RosterSnapshotsUnitDiff
                    char={{
                        id: 'worldKharn',
                        rarity: Rarity.Common,
                        rank: Rank.Stone1,
                        stars: RarityStars.OneStar,
                        active: 55,
                        passive: 55,
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
                <RosterSnapshotsUnitDiff
                    mow={{
                        id: 'adeptExorcist',
                        rarity: Rarity.Common,
                        stars: RarityStars.OneStar,
                        active: 55,
                        passive: 55,
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
            <div className="flex flex-wrap">
                <RosterSnapshotsUnitDiff2
                    char={{
                        id: 'bloodDante',
                        rarity: Rarity.Rare,
                        rank: Rank.Silver1,
                        stars: RarityStars.FiveStars,
                        active: 36,
                        passive: 50,
                    }}
                    diff={{
                        id: 'bloodDante',
                        rarity: Rarity.Legendary,
                        rank: Rank.Adamantine1,
                        stars: RarityStars.RedFiveStars,
                        active: 40,
                    }}
                />
                <RosterSnapshotsUnitDiff2
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
                <RosterSnapshotsUnitDiff2
                    mow={{
                        id: 'adeptExorcist',
                        rarity: Rarity.Common,
                        stars: RarityStars.None,
                        active: 0,
                        passive: 0,
                        locked: true,
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
