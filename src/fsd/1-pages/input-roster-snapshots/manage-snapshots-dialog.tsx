import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
} from '@mui/material';
import React, { useState, useEffect, useMemo } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { RosterSnapshotDiffStyle, RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { IRosterSnapshotsState } from './models';

interface ManageSnapshotsDialogProps {
    rosterSnapshots: IRosterSnapshotsState;
    isOpen: boolean;
    showShards: RosterSnapshotShowVariableSettings;
    showMythicShards: RosterSnapshotShowVariableSettings;
    showXpLevel: RosterSnapshotShowVariableSettings;
    showEquipment: RosterSnapshotShowVariableSettings;
    showShardDiffs: RosterSnapshotShowVariableSettings;
    showMythicShardsDiffs: RosterSnapshotShowVariableSettings;
    showXpLevelDiffs: RosterSnapshotShowVariableSettings;
    showEquipmentDiffs: RosterSnapshotShowVariableSettings;
    diffStyle: RosterSnapshotDiffStyle;
    onShowShardsChange: (value: RosterSnapshotShowVariableSettings) => void;
    onShowMythicShardsChange: (value: RosterSnapshotShowVariableSettings) => void;
    onShowXpLevelChange: (value: RosterSnapshotShowVariableSettings) => void;
    onShowEquipmentChange: (value: RosterSnapshotShowVariableSettings) => void;
    onShowShardDiffsChange: (value: RosterSnapshotShowVariableSettings) => void;
    onShowMythicShardsDiffsChange: (value: RosterSnapshotShowVariableSettings) => void;
    onShowXpLevelDiffsChange: (value: RosterSnapshotShowVariableSettings) => void;
    onShowEquipmentDiffsChange: (value: RosterSnapshotShowVariableSettings) => void;
    onDiffStyleChange: (value: RosterSnapshotDiffStyle) => void;
    onDeleteSnapshot: (index: number) => void;
    onDeleteAllSnapshots: () => void;
    onPurgeDeleted: () => void;
    onRenameSnapshot: (index: number, newName: string) => void;
    onRestoreSnapshot: (index: number) => void;
    onDone: () => void;
}

export const ManageSnapshotsDialog: React.FC<ManageSnapshotsDialogProps> = ({
    rosterSnapshots,
    isOpen,
    showShards,
    showMythicShards,
    showXpLevel,
    showEquipment,
    showShardDiffs,
    showMythicShardsDiffs,
    showXpLevelDiffs,
    showEquipmentDiffs,
    diffStyle,
    onShowShardsChange,
    onShowMythicShardsChange,
    onShowXpLevelChange,
    onShowEquipmentChange,
    onShowShardDiffsChange,
    onShowMythicShardsDiffsChange,
    onShowXpLevelDiffsChange,
    onShowEquipmentDiffsChange,
    onDiffStyleChange,
    onDeleteSnapshot,
    onDeleteAllSnapshots,
    onPurgeDeleted,
    onRenameSnapshot,
    onRestoreSnapshot,
    onDone,
}) => {
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);
    const [selectedDeletedIndex, setSelectedDeletedIndex] = useState<number>(-1);
    const [editName, setEditName] = useState<string>('');
    const [error, setError] = useState<string>('');

    // Map snapshots to a flat array for easier indexing: -1 is base, 0+ are diffs
    const allLiveSnapshots = useMemo(
        () => [
            ...(rosterSnapshots.base !== undefined && rosterSnapshots.base.deletedDateMillisUtc === undefined
                ? [{ name: rosterSnapshots.base.name, index: -1 }]
                : []),
            ...rosterSnapshots.diffs
                .map((d, index) => ({ name: d.name, index, deleted: d.deletedDateMillisUtc !== undefined }))
                .filter(d => !d.deleted),
        ],
        [rosterSnapshots]
    );

    const allDeletedSnapshots = useMemo(
        () => [
            ...(rosterSnapshots.base !== undefined && rosterSnapshots.base.deletedDateMillisUtc !== undefined
                ? [{ name: rosterSnapshots.base.name, index: -1 }]
                : []),
            ...rosterSnapshots.diffs
                .map((d, index) => ({ name: d.name, index, deleted: d.deletedDateMillisUtc !== undefined }))
                .filter(d => d.deleted),
        ],
        [rosterSnapshots]
    );

    // Reset local state when dialog opens or selection changes
    useEffect(() => {
        const current = allLiveSnapshots.find(s => s.index === selectedIndex);
        if (current) {
            setEditName(current.name);
            setError('');
        }
    }, [selectedIndex, isOpen, allLiveSnapshots]);

    const handleRename = () => {
        const trimmed = editName.trim();

        // Validation Logic
        if (trimmed.length === 0 || trimmed.length >= 100) {
            setError('Name must be between 1 and 99 characters.');
            return;
        }

        const isDuplicate = allLiveSnapshots.some(
            s => s.index !== selectedIndex && s.name.toLowerCase() === trimmed.toLowerCase()
        );

        if (isDuplicate) {
            setError('This name is already used by another snapshot.');
            return;
        }

        setError('');
        onRenameSnapshot(selectedIndex, trimmed);
    };

    const handleDelete = () => {
        onDeleteSnapshot(selectedIndex);
    };

    return (
        <Dialog open={isOpen} onClose={onDone} fullWidth maxWidth="sm">
            <DialogTitle>Manage Roster Snapshots</DialogTitle>
            <DialogContent dividers>
                {/* Display Options Section */}
                <div className="flex flex-col gap-4 rounded border border-(--border) p-4">
                    <h3>Display Options</h3>
                    <div className="flex flex-col gap-4">
                        {/* Row 1: Shards */}
                        <div className="flex gap-4">
                            <FormControl fullWidth>
                                <InputLabel>Show Shards</InputLabel>
                                <Select
                                    label="Show Shards"
                                    value={showShards}
                                    onChange={event =>
                                        onShowShardsChange(event.target.value as RosterSnapshotShowVariableSettings)
                                    }>
                                    <MenuItem value={RosterSnapshotShowVariableSettings.Never}>Never</MenuItem>
                                    <MenuItem value={RosterSnapshotShowVariableSettings.WhenNonZero}>
                                        When Non-Zero
                                    </MenuItem>
                                    <MenuItem value={RosterSnapshotShowVariableSettings.Always}>Always</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Diff Shards</InputLabel>
                                <Select
                                    label="Diff Shards"
                                    value={showShardDiffs}
                                    onChange={event =>
                                        onShowShardDiffsChange(event.target.value as RosterSnapshotShowVariableSettings)
                                    }>
                                    <MenuItem value={RosterSnapshotShowVariableSettings.Never}>No</MenuItem>
                                    <MenuItem value={RosterSnapshotShowVariableSettings.Always}>Yes</MenuItem>
                                </Select>
                            </FormControl>
                        </div>

                        {/* Row 2: Mythic Shards */}
                        <div className="flex gap-4">
                            <FormControl fullWidth>
                                <InputLabel>Show Mythic Shards</InputLabel>
                                <Select
                                    label="Show Mythic Shards"
                                    value={showMythicShards}
                                    onChange={event =>
                                        onShowMythicShardsChange(
                                            event.target.value as RosterSnapshotShowVariableSettings
                                        )
                                    }>
                                    <MenuItem value={RosterSnapshotShowVariableSettings.Never}>Never</MenuItem>
                                    <MenuItem value={RosterSnapshotShowVariableSettings.WhenNonZero}>
                                        When Non-Zero
                                    </MenuItem>
                                    <MenuItem value={RosterSnapshotShowVariableSettings.Always}>Always</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Diff Mythic Shards</InputLabel>
                                <Select
                                    label="Diff Mythic Shards"
                                    value={showMythicShardsDiffs}
                                    onChange={event =>
                                        onShowMythicShardsDiffsChange(
                                            event.target.value as RosterSnapshotShowVariableSettings
                                        )
                                    }>
                                    <MenuItem value={RosterSnapshotShowVariableSettings.Never}>No</MenuItem>
                                    <MenuItem value={RosterSnapshotShowVariableSettings.Always}>Yes</MenuItem>
                                </Select>
                            </FormControl>
                        </div>

                        {/* Row 3: XP Level */}
                        <div className="flex gap-4">
                            <FormControl fullWidth>
                                <InputLabel>Show XP Level</InputLabel>
                                <Select
                                    label="Show XP Level"
                                    value={showXpLevel}
                                    onChange={event =>
                                        onShowXpLevelChange(event.target.value as RosterSnapshotShowVariableSettings)
                                    }>
                                    <MenuItem value={RosterSnapshotShowVariableSettings.Never}>Never</MenuItem>
                                    <MenuItem value={RosterSnapshotShowVariableSettings.Always}>Always</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Diff XP Level</InputLabel>
                                <Select
                                    label="Diff XP Level"
                                    value={showXpLevelDiffs}
                                    onChange={event =>
                                        onShowXpLevelDiffsChange(
                                            event.target.value as RosterSnapshotShowVariableSettings
                                        )
                                    }>
                                    <MenuItem value={RosterSnapshotShowVariableSettings.Never}>No</MenuItem>
                                    <MenuItem value={RosterSnapshotShowVariableSettings.Always}>Yes</MenuItem>
                                </Select>
                            </FormControl>
                        </div>

                        {/* Row 4: Equipment */}
                        <div className="flex gap-4">
                            <FormControl fullWidth>
                                <InputLabel>Show Equipment</InputLabel>
                                <Select
                                    label="Show Equipment"
                                    value={showEquipment}
                                    onChange={event =>
                                        onShowEquipmentChange(event.target.value as RosterSnapshotShowVariableSettings)
                                    }>
                                    <MenuItem value={RosterSnapshotShowVariableSettings.Never}>Never</MenuItem>
                                    <MenuItem value={RosterSnapshotShowVariableSettings.Always}>Always</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Diff Equipment</InputLabel>
                                <Select
                                    label="Diff Equipment"
                                    value={showEquipmentDiffs}
                                    onChange={event =>
                                        onShowEquipmentDiffsChange(
                                            event.target.value as RosterSnapshotShowVariableSettings
                                        )
                                    }>
                                    <MenuItem value={RosterSnapshotShowVariableSettings.Never}>No</MenuItem>
                                    <MenuItem value={RosterSnapshotShowVariableSettings.Always}>Yes</MenuItem>
                                </Select>
                            </FormControl>
                        </div>

                        {/* Single Row: Diff Style */}
                        <FormControl fullWidth>
                            <InputLabel>Diff Style</InputLabel>
                            <Select
                                label="Diff Style"
                                value={diffStyle}
                                onChange={event => onDiffStyleChange(event.target.value as RosterSnapshotDiffStyle)}>
                                <MenuItem value={RosterSnapshotDiffStyle.SideBySide}>Side by Side</MenuItem>
                                <MenuItem value={RosterSnapshotDiffStyle.Detailed}>Detailed</MenuItem>
                            </Select>
                        </FormControl>
                    </div>
                </div>
                <div className="mt-5 flex flex-col gap-4 rounded border border-(--border) p-4">
                    <h3>Snapshot Management</h3>
                    <FormControl fullWidth disabled={allLiveSnapshots.length === 0}>
                        <InputLabel>Select Snapshot</InputLabel>
                        <Select
                            value={selectedIndex}
                            label="Select Snapshot"
                            onChange={event => setSelectedIndex(Number(event.target.value))}>
                            {allLiveSnapshots.map(s => (
                                <MenuItem key={s.index} value={s.index}>
                                    {s.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Rename Section */}
                    <div className="flex items-start gap-2">
                        <TextField
                            disabled={allLiveSnapshots.length === 0}
                            fullWidth
                            label="Change Snapshot Name To"
                            value={allLiveSnapshots.length === 0 ? '' : editName}
                            error={!!error}
                            helperText={error}
                            onChange={event => setEditName(event.target.value)}
                        />
                        <Button
                            variant="contained"
                            onClick={handleRename}
                            className="mt-2"
                            disabled={allLiveSnapshots.length === 0}>
                            Rename
                        </Button>
                    </div>

                    {/* Restore Deleted Section */}
                    <div className="flex items-start gap-2">
                        <FormControl fullWidth disabled={allDeletedSnapshots.length === 0}>
                            <InputLabel>Restore Deleted Snapshot</InputLabel>
                            <Select
                                value={selectedDeletedIndex}
                                label="Restore Deleted Snapshot"
                                onChange={event => setSelectedDeletedIndex(Number(event.target.value))}>
                                {allDeletedSnapshots.map(s => (
                                    <MenuItem key={s.index} value={s.index}>
                                        {s.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button
                            variant="contained"
                            onClick={() => onRestoreSnapshot(selectedDeletedIndex)}
                            className="mt-2"
                            disabled={allDeletedSnapshots.length === 0}>
                            Restore
                        </Button>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm text-(--soft-fg)">Danger Zone</p>
                        <div>
                            <Button
                                disabled={allLiveSnapshots.length === 0}
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={handleDelete}
                                className="mr-2">
                                Delete Selected
                            </Button>
                            <Button
                                disabled={rosterSnapshots.base === undefined}
                                color="error"
                                variant="outlined"
                                onClick={onDeleteAllSnapshots}
                                className="mr-2">
                                Delete All
                            </Button>
                            <Button
                                disabled={allDeletedSnapshots.length === 0}
                                color="error"
                                variant="outlined"
                                startIcon={<DeleteForeverIcon />}
                                onClick={onPurgeDeleted}>
                                Empty Trash
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onDone} variant="contained">
                    Done
                </Button>
            </DialogActions>
        </Dialog>
    );
};
