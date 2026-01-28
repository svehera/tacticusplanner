import AddAPhoto from '@mui/icons-material/AddAPhoto';
import Settings from '@mui/icons-material/Settings';
import { Button, Tooltip } from '@mui/material';
import { cloneDeep, orderBy } from 'lodash';
import { useCallback, useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line import-x/no-internal-modules
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { Rank } from '@/fsd/5-shared/model';
import { SyncButton } from '@/fsd/5-shared/ui/sync-button';

import { CharactersService, ICharacter2 } from '@/fsd/4-entities/character';
// eslint-disable-next-line import-x/order
import { IMow2, MowsService } from '@/fsd/4-entities/mow';

// eslint-disable-next-line import-x/no-internal-modules
import { CharactersPowerService } from '@/fsd/4-entities/unit/characters-power.service';

// eslint-disable-next-line import-x/no-internal-modules
import { RosterSnapshotDiffStyle, RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { ManageSnapshotsDialog } from './manage-snapshots-dialog';
import { IRosterSnapshot, IRosterSnapshotsState } from './models';
import { RosterSnapshotsService } from './roster-snapshots-service';
import { RosterSnapshotsUnit } from './roster-snapshots-unit';
import { RosterSnapshotsUnitDiff } from './roster-snapshots-unit-diff';
import { TakeSnapshotDialog } from './take-snapshot-dialog';

function getDisplay(
    chars: ICharacter2[],
    mows: IMow2[],
    rosterSnapshots: IRosterSnapshotsState,
    left: number,
    right: number,
    diffStyle: RosterSnapshotDiffStyle,
    showShards: RosterSnapshotShowVariableSettings,
    showMythicShards: RosterSnapshotShowVariableSettings,
    showXpLevel: RosterSnapshotShowVariableSettings,
    showShardDiffs: RosterSnapshotShowVariableSettings,
    showMythicShardsDiffs: RosterSnapshotShowVariableSettings,
    showXpLevelDiffs: RosterSnapshotShowVariableSettings
) {
    let leftIndex = left;
    let rightIndex = right;
    if (leftIndex < -1) leftIndex = -1;
    if (leftIndex > rosterSnapshots.diffs.length - 1) leftIndex = rosterSnapshots.diffs.length - 1;
    if (rightIndex <= leftIndex) rightIndex = leftIndex + 1;
    if (rightIndex > rosterSnapshots.diffs.length) rightIndex = rosterSnapshots.diffs.length;
    if (rosterSnapshots.base === undefined) {
        const powerChars = RosterSnapshotsService.createSnapshot("sum'n", Date.now(), chars, mows).chars.map(c => ({
            ...c,
            power: CharactersPowerService.getCharacterPower(chars.find(char => char.snowprintId! === c.id)!),
        }));
        const poweredMows = RosterSnapshotsService.createSnapshot("sum'n", Date.now(), chars, mows).mows.map(m => ({
            ...m,
            power: CharactersPowerService.getCharacterPower(mows.find(mow => mow.snowprintId! === m.id)!),
        }));

        const powerUnits = orderBy([...powerChars, ...poweredMows], 'power', 'desc');
        return (
            <div className="flex flex-wrap gap-5 p-4">
                {powerUnits.map(unit => (
                    <div key={`power-${unit.id}`}>
                        <RosterSnapshotsUnit
                            showShards={showShards}
                            showMythicShards={showMythicShards}
                            showXpLevel={showXpLevel}
                            char={'rank' in unit ? unit : undefined}
                            mow={'rank' in unit ? undefined : unit}
                        />
                    </div>
                ))}
            </div>
        );
    }
    let base = RosterSnapshotsService.fixSnapshot(rosterSnapshots.base);
    for (let i = 0; i <= leftIndex; i++) {
        base = RosterSnapshotsService.fixSnapshot(
            RosterSnapshotsService.resolveSnapshotDiff(base, rosterSnapshots.diffs[i])
        );
    }
    let compare: IRosterSnapshot = base;
    if (rightIndex < rosterSnapshots.diffs.length) {
        for (let i = leftIndex + 1; i <= rightIndex; i++) {
            compare = RosterSnapshotsService.fixSnapshot(
                RosterSnapshotsService.resolveSnapshotDiff(compare, rosterSnapshots.diffs[i])
            );
        }
    } else {
        compare = RosterSnapshotsService.fixSnapshot(
            RosterSnapshotsService.createSnapshot('Current Roster', Date.now(), chars, mows)
        );
    }
    const diff = RosterSnapshotsService.diffSnapshots(
        base,
        compare,
        showShardDiffs !== RosterSnapshotShowVariableSettings.Never,
        showMythicShardsDiffs !== RosterSnapshotShowVariableSettings.Never,
        showXpLevelDiffs !== RosterSnapshotShowVariableSettings.Never
    );

    interface CharDiff {
        before: ICharacter2;
        after: ICharacter2;
        powerDiff: number;
        logPowerDiff: number;
    }

    interface MachineOfWarDiff {
        before: IMow2;
        after: IMow2;
        powerDiff: number;
        logPowerDiff: number;
    }

    const diffChars: Array<CharDiff> = [];
    const diffMows: Array<MachineOfWarDiff> = [];

    const nonDiffChars: Array<ICharacter2 & { power: number }> = [];
    const nonDiffMows: Array<IMow2 & { power: number }> = [];

    const baseChars = base.chars;
    const compareChars = compare.chars;

    compareChars.forEach(compareChar => {
        const baseChar = baseChars.find(c => c.id === compareChar.id);
        const diffChar = diff.charDiffs.find(c => c.id === compareChar.id);
        const fullChar = chars.find(c => c.snowprintId === compareChar.id);

        if (fullChar === undefined) return;

        if (diffChar !== undefined && baseChar !== undefined) {
            const beforeChar = { ...fullChar, ...baseChar, level: baseChar.xpLevel, id: fullChar.id };
            const afterChar = { ...fullChar, ...compareChar, level: compareChar.xpLevel, id: fullChar.id };
            const powerBefore =
                beforeChar.rank === Rank.Locked ? 0 : CharactersPowerService.getCharacterPower(beforeChar);
            const powerAfter = afterChar.rank === Rank.Locked ? 0 : CharactersPowerService.getCharacterPower(afterChar);
            diffChars.push({
                before: beforeChar,
                after: afterChar,
                powerDiff: Math.abs(powerAfter - powerBefore),
                logPowerDiff: Math.abs(
                    (powerAfter === 0 ? 0 : Math.log(powerAfter)) - (powerBefore === 0 ? 0 : Math.log(powerBefore))
                ),
            });
        } else {
            const power = CharactersPowerService.getCharacterPower({ ...fullChar, ...compareChar, id: fullChar.id });
            nonDiffChars.push({ ...fullChar, ...compareChar, power });
        }
    });

    const baseMows = base.mows;
    const compareMows = compare.mows;

    compareMows.forEach(compareMow => {
        const baseMow = baseMows.find(m => m.id === compareMow.id);
        const diffMow = diff.mowDiffs.find(m => m.id === compareMow.id);
        const fullMow = mows.find(m => m.snowprintId === compareMow.id);

        if (!fullMow) return;

        if (diffMow && baseMow) {
            const beforeMow = { ...fullMow, ...baseMow, id: fullMow.id };
            const afterMow = { ...fullMow, ...compareMow, id: fullMow.id };
            const powerBefore = beforeMow.locked ? 0 : CharactersPowerService.getCharacterPower(beforeMow);
            const powerAfter = afterMow.locked ? 0 : CharactersPowerService.getCharacterPower(afterMow);
            diffMows.push({
                before: beforeMow,
                after: afterMow,
                powerDiff: Math.abs(powerAfter - powerBefore),
                logPowerDiff: Math.abs(
                    (powerAfter === 0 ? 0 : Math.log(powerAfter)) - (powerBefore === 0 ? 0 : Math.log(powerBefore))
                ),
            });
        } else {
            const power = CharactersPowerService.getCharacterPower({ ...fullMow, ...compareMow });
            nonDiffMows.push({ ...fullMow, ...compareMow, power });
        }
    });

    const diffUnits = orderBy([...diffChars, ...diffMows], 'powerDiff', 'desc');
    const nonDiffUnits = orderBy([...nonDiffChars, ...nonDiffMows], 'power', 'desc');

    return (
        <>
            <div className="flex flex-wrap gap-5 p-4">
                {diffUnits.map(unit => (
                    <div key={`diff-${unit.before.id}`}>
                        {'rank' in unit.before && (
                            <RosterSnapshotsUnitDiff
                                diffStyle={diffStyle}
                                showShards={showShards}
                                showMythicShards={showMythicShards}
                                showXpLevel={showXpLevel}
                                char={RosterSnapshotsService.snapshotCharacter(unit.before as ICharacter2)}
                                diff={RosterSnapshotsService.diffChar(
                                    unit.before as ICharacter2,
                                    unit.after as ICharacter2
                                )}
                            />
                        )}
                        {!('rank' in unit.before) && (
                            <RosterSnapshotsUnitDiff
                                diffStyle={diffStyle}
                                showShards={showShards}
                                showMythicShards={showMythicShards}
                                showXpLevel={showXpLevel}
                                mow={RosterSnapshotsService.snapshotMachineOfWar(unit.before as IMow2)}
                                diff={RosterSnapshotsService.diffMow(unit.before as IMow2, unit.after as IMow2)}
                            />
                        )}
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap gap-5 p-4">
                {nonDiffUnits.map(unit => (
                    <div key={`nondiff-${'rank' in unit ? unit.snowprintId : unit.id}`}>
                        {'rank' in unit ? (
                            <RosterSnapshotsUnit
                                showShards={showShards}
                                showMythicShards={showMythicShards}
                                showXpLevel={showXpLevel}
                                char={RosterSnapshotsService.snapshotCharacter(unit)}
                            />
                        ) : (
                            <RosterSnapshotsUnit
                                showShards={showShards}
                                showMythicShards={showMythicShards}
                                showXpLevel={showXpLevel}
                                mow={RosterSnapshotsService.snapshotMachineOfWar(unit)}
                            />
                        )}
                    </div>
                ))}
            </div>
        </>
    );
}

export const RosterSnapshots = () => {
    const { characters, mows: unresolvedMows, rosterSnapshots, viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const chars = CharactersService.resolveStoredCharacters(characters);
    const mows = MowsService.resolveAllFromStorage(unresolvedMows);
    const [isTakeSnapshotDialogOpen, setIsTakeSnapshotDialogOpen] = useState(false);
    const [currentTimeMillis, setCurrentTimeMillis] = useState<number>(Date.now());
    const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
    const [leftIndex, setLeftIndex] = useState<number>(rosterSnapshots.diffs.length - 1);
    const [rightIndex, setRightIndex] = useState<number>(rosterSnapshots.diffs.length);
    const [liveSnapshotIndices, setLiveSnapshotIndices] = useState<number[]>(
        RosterSnapshotsService.getLiveSnapshotInidices(rosterSnapshots)
    );
    const [diffStyleSetting, setDiffStyleSetting] = useState<RosterSnapshotDiffStyle>(
        viewPreferences.rosterSnapshotsDiffStyle
    );
    const [showShardsSetting, setShowShardsSetting] = useState<RosterSnapshotShowVariableSettings>(
        viewPreferences.showShardsInRosterSnapshots
    );
    const [showMythicShardsSetting, setShowMythicShardsSetting] = useState<RosterSnapshotShowVariableSettings>(
        viewPreferences.showMythicShardsInRosterSnapshots
    );
    const [showXpLevelSetting, setShowXpLevelSetting] = useState<RosterSnapshotShowVariableSettings>(
        viewPreferences.showXpLevelInRosterSnapshots
    );
    const [showShardDiffsSetting, setShowShardDiffsSetting] = useState<RosterSnapshotShowVariableSettings>(
        viewPreferences.showShardsInDiffs
    );
    const [showMythicShardsDiffsSetting, setShowMythicShardsDiffsSetting] =
        useState<RosterSnapshotShowVariableSettings>(viewPreferences.showMythicShardsInDiffs);
    const [showXpLevelDiffsSetting, setShowXpLevelDiffsSetting] = useState<RosterSnapshotShowVariableSettings>(
        viewPreferences.showXpLevelInDiffs
    );

    useEffect(() => {
        setLiveSnapshotIndices(RosterSnapshotsService.getLiveSnapshotInidices(rosterSnapshots));
        setDiffStyleSetting(viewPreferences.rosterSnapshotsDiffStyle);
        setShowShardsSetting(viewPreferences.showShardsInRosterSnapshots);
        setShowMythicShardsSetting(viewPreferences.showMythicShardsInRosterSnapshots);
        setShowXpLevelSetting(viewPreferences.showXpLevelInRosterSnapshots);
        setShowShardDiffsSetting(viewPreferences.showShardsInDiffs);
        setShowMythicShardsDiffsSetting(viewPreferences.showMythicShardsInDiffs);
        setShowXpLevelDiffsSetting(viewPreferences.showXpLevelInDiffs);
    }, [rosterSnapshots, viewPreferences]);

    const takeSnapshot = () => {
        setCurrentTimeMillis(Date.now());
        setIsTakeSnapshotDialogOpen(true);
    };

    const handleSaveSnapshot = (name: string) => {
        setIsTakeSnapshotDialogOpen(false);
        if (name.trim()) createAndDispatchSnapshot(name.trim());
    };

    const handleCancelSnapshot = () => {
        setIsTakeSnapshotDialogOpen(false);
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
            resolved.forEach((snap, index) => {
                if (index == 0) return;
                newSnapshots.diffs.push(
                    RosterSnapshotsService.diffSnapshots(
                        resolved[index - 1],
                        snap,
                        /*diffShards=*/ true,
                        /*diffMythicShards=*/ true,
                        /*diffXpLevel=*/ true
                    )
                );
            });
            if (newSnapshots.diffs.length > RosterSnapshotsService.MAX_SNAPSHOTS - 1) {
                newSnapshots.diffs.splice(0, newSnapshots.diffs.length - (RosterSnapshotsService.MAX_SNAPSHOTS - 1));
            }
            dispatch.rosterSnapshots({ type: 'Set', value: newSnapshots });
        },
        [chars, mows, rosterSnapshots, dispatch]
    );

    const openManage = () => {
        setIsManageDialogOpen(true);
    };

    const handleDeleteSnapshot = (index: number) => {
        const deletedLiveIndex = liveSnapshotIndices.indexOf(index);
        if (deletedLiveIndex === -1) return;

        if (leftIndex >= deletedLiveIndex) {
            const newLeftIndex = Math.max(0, leftIndex - 1);
            setLeftIndex(newLeftIndex);
            if (rightIndex <= newLeftIndex + 1) {
                setRightIndex(newLeftIndex + 1);
            }
        } else if (rightIndex > deletedLiveIndex) {
            setRightIndex(rightIndex - 1);
        }
        dispatch.rosterSnapshots({
            type: 'Set',
            value: RosterSnapshotsService.purgeOldestDeletedSnapshots(
                RosterSnapshotsService.deleteLiveSnapshot(rosterSnapshots, index, Date.now())
            ),
        });
    };

    const handleDeleteAllSnapshots = () => {
        const state: IRosterSnapshotsState = cloneDeep(rosterSnapshots);
        const timeMillis = Date.now();
        if (state.base) {
            state.base.deletedDateMillisUtc = timeMillis;
        }
        state.diffs.forEach(diff => {
            diff.deletedDateMillisUtc = timeMillis;
        });

        dispatch.rosterSnapshots({
            type: 'Set',
            value: RosterSnapshotsService.purgeOldestDeletedSnapshots(state),
        });
    };

    const handleRenameSnapshot = (index: number, newName: string) => {
        const state: IRosterSnapshotsState = cloneDeep(rosterSnapshots);
        if (index == -1) {
            state.base!.name = newName;
            dispatch.rosterSnapshots({
                type: 'Set',
                value: state,
            });
            return;
        }
        state.diffs[index].name = newName;
        dispatch.rosterSnapshots({
            type: 'Set',
            value: state,
        });
    };

    const handleManageDone = () => {
        setIsManageDialogOpen(false);
    };

    const handleRestoreSnapshot = (index: number) => {
        dispatch.rosterSnapshots({
            type: 'Set',
            value: RosterSnapshotsService.restoreSnapshot(rosterSnapshots, index),
        });
    };

    const handelPurgeAllDeleted = () => {
        if (rosterSnapshots.base === undefined) return;
        const snapshots: IRosterSnapshot[] = [];
        let current = cloneDeep(rosterSnapshots.base);
        if (current.deletedDateMillisUtc === undefined) {
            snapshots.push(current);
        }
        rosterSnapshots.diffs.forEach(diff => {
            current = RosterSnapshotsService.resolveSnapshotDiff(current, diff);
            if (current.deletedDateMillisUtc === undefined) {
                snapshots.push(current);
            }
        });

        const state: IRosterSnapshotsState = {
            base: snapshots.length > 0 ? snapshots[0] : undefined,
            diffs: [],
        };
        snapshots.forEach((snap, index) => {
            if (index == 0) return;
            state.diffs.push(
                RosterSnapshotsService.diffSnapshots(
                    snapshots[index - 1],
                    snap,
                    /*diffShards=*/ true,
                    /*diffMythicShards=*/ true,
                    /*diffXpLevel=*/ true
                )
            );
        });
        dispatch.rosterSnapshots({ type: 'Set', value: state });
    };

    const getTakeSnapshotTitle = () => {
        if (rosterSnapshots.diffs.length >= RosterSnapshotsService.MAX_SNAPSHOTS - 1) {
            return `Maximum of ${RosterSnapshotsService.MAX_SNAPSHOTS} snapshots reached. Please delete existing snapshots to take new ones.`;
        }
        return 'Take a snapshot of your current roster state.';
    };

    const handleDiffStyleChange = (value: RosterSnapshotDiffStyle) => {
        dispatch.viewPreferences({
            type: 'Update',
            setting: 'rosterSnapshotsDiffStyle',
            value,
        });
    };

    const handleShowShardsChange = (value: RosterSnapshotShowVariableSettings) => {
        dispatch.viewPreferences({
            type: 'Update',
            setting: 'showShardsInRosterSnapshots',
            value,
        });
    };

    const handleShowMythicShardsChange = (value: RosterSnapshotShowVariableSettings) => {
        dispatch.viewPreferences({
            type: 'Update',
            setting: 'showMythicShardsInRosterSnapshots',
            value,
        });
    };

    const handleShowXpLevelChange = (value: RosterSnapshotShowVariableSettings) => {
        dispatch.viewPreferences({
            type: 'Update',
            setting: 'showXpLevelInRosterSnapshots',
            value,
        });
    };

    const handleShowShardDiffsChange = (value: RosterSnapshotShowVariableSettings) => {
        dispatch.viewPreferences({
            type: 'Update',
            setting: 'showShardsInDiffs',
            value,
        });
    };

    const handleShowMythicShardsDiffsChange = (value: RosterSnapshotShowVariableSettings) => {
        dispatch.viewPreferences({
            type: 'Update',
            setting: 'showMythicShardsInDiffs',
            value,
        });
    };

    const handleShowXpLevelDiffsChange = (value: RosterSnapshotShowVariableSettings) => {
        dispatch.viewPreferences({
            type: 'Update',
            setting: 'showXpLevelInDiffs',
            value,
        });
    };

    return (
        <div>
            <div>
                <TakeSnapshotDialog
                    snapshotNames={[rosterSnapshots.base?.name ?? '', ...rosterSnapshots.diffs.map(d => d.name)]}
                    isOpen={isTakeSnapshotDialogOpen}
                    currentTimeMillis={currentTimeMillis}
                    onSave={handleSaveSnapshot}
                    onCancel={handleCancelSnapshot}
                />
            </div>
            <div>
                <ManageSnapshotsDialog
                    rosterSnapshots={rosterSnapshots}
                    isOpen={isManageDialogOpen}
                    showShards={showShardsSetting}
                    showMythicShards={showMythicShardsSetting}
                    showXpLevel={showXpLevelSetting}
                    diffStyle={viewPreferences.rosterSnapshotsDiffStyle}
                    showShardDiffs={showShardDiffsSetting}
                    showMythicShardsDiffs={showMythicShardsDiffsSetting}
                    showXpLevelDiffs={showXpLevelDiffsSetting}
                    onShowShardsChange={handleShowShardsChange}
                    onShowMythicShardsChange={handleShowMythicShardsChange}
                    onDiffStyleChange={handleDiffStyleChange}
                    onShowShardDiffsChange={handleShowShardDiffsChange}
                    onShowMythicShardsDiffsChange={handleShowMythicShardsDiffsChange}
                    onShowXpLevelDiffsChange={handleShowXpLevelDiffsChange}
                    onShowXpLevelChange={handleShowXpLevelChange}
                    onDeleteSnapshot={handleDeleteSnapshot}
                    onDeleteAllSnapshots={handleDeleteAllSnapshots}
                    onPurgeDeleted={handelPurgeAllDeleted}
                    onRenameSnapshot={handleRenameSnapshot}
                    onRestoreSnapshot={handleRestoreSnapshot}
                    onDone={handleManageDone}
                />
            </div>
            <div className="flex justify-begin p-2 border-b border-gray-600">
                <SyncButton showText={!isMobile} />
                <div className="w-1" />
                <Tooltip title={getTakeSnapshotTitle()}>
                    <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={takeSnapshot}
                        disabled={rosterSnapshots.diffs.length >= RosterSnapshotsService.MAX_SNAPSHOTS - 1}>
                        <AddAPhoto className="mr-1" />
                        {!isMobile && 'Take Snapshot'}
                    </Button>
                </Tooltip>
                <div className="w-1" />
                <Button size="small" variant="contained" color="primary" onClick={openManage}>
                    <Settings className="mr-1" />
                    {!isMobile && 'Manage'}
                </Button>
            </div>

            {liveSnapshotIndices.length > 0 && (
                <div className="flex items-center gap-4 p-2">
                    <div>
                        <label htmlFor="left-snapshot" className="mr-2">
                            Left:
                        </label>
                        <select
                            id="left-snapshot"
                            value={leftIndex}
                            className="p-1 border rounded bg-gray-700"
                            onChange={event => {
                                const newLeftIndex = parseInt(event.target.value, 10);
                                setLeftIndex(newLeftIndex);
                                if (rightIndex <= newLeftIndex) {
                                    setRightIndex(newLeftIndex + 1);
                                }
                            }}>
                            {liveSnapshotIndices.map((resolvedIndex, index) => (
                                <option key={index} value={index}>
                                    {RosterSnapshotsService.getSnapshotName(rosterSnapshots, resolvedIndex)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="right-snapshot" className="mr-2">
                            Right:
                        </label>
                        <select
                            id="right-snapshot"
                            value={rightIndex}
                            className="p-1 border rounded bg-gray-700"
                            onChange={event => {
                                setRightIndex(parseInt(event.target.value, 10));
                            }}>
                            {liveSnapshotIndices
                                .filter((_, index) => index > leftIndex)
                                .map((resolvedIndex, index) => (
                                    <option key={leftIndex + 1 + index} value={leftIndex + 1 + index}>
                                        {RosterSnapshotsService.getSnapshotName(rosterSnapshots, resolvedIndex)}
                                    </option>
                                ))}
                            <option value={liveSnapshotIndices.length}>Current</option>
                        </select>
                    </div>
                </div>
            )}
            {getDisplay(
                chars,
                mows,
                rosterSnapshots,
                liveSnapshotIndices[leftIndex],
                liveSnapshotIndices[rightIndex],
                diffStyleSetting,
                showShardsSetting,
                showMythicShardsSetting,
                showXpLevelSetting,
                showShardDiffsSetting,
                showMythicShardsDiffsSetting,
                showXpLevelDiffsSetting
            )}
        </div>
    );
};
