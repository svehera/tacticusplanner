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
    Box,
    Typography,
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
    diffStyle: RosterSnapshotDiffStyle;
    onShowShardsChange: (value: RosterSnapshotShowVariableSettings) => void;
    onShowMythicShardsChange: (value: RosterSnapshotShowVariableSettings) => void;
    onShowXpLevelChange: (value: RosterSnapshotShowVariableSettings) => void;
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
    diffStyle,
    onShowShardsChange,
    onShowMythicShardsChange,
    onShowXpLevelChange,
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
                .map((d, i) => ({ name: d.name, index: i, deleted: d.deletedDateMillisUtc !== undefined }))
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
                .map((d, i) => ({ name: d.name, index: i, deleted: d.deletedDateMillisUtc !== undefined }))
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
                <div className="flex flex-col gap-4 rounded border border-gray-200 p-4 dark:border-gray-700">
                    <Typography variant="h6" gutterBottom>
                        Display Options
                    </Typography>
                    <FormControl fullWidth>
                        <InputLabel>Show Shards</InputLabel>
                        <Select
                            label="Show Shards"
                            value={showShards}
                            onChange={e => onShowShardsChange(e.target.value as RosterSnapshotShowVariableSettings)}>
                            <MenuItem value={RosterSnapshotShowVariableSettings.Never}>Never</MenuItem>
                            <MenuItem value={RosterSnapshotShowVariableSettings.WhenNonZero}>When Non-Zero</MenuItem>
                            <MenuItem value={RosterSnapshotShowVariableSettings.Always}>Always</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Show Mythic Shards</InputLabel>
                        <Select
                            label="Show Mythic Shards"
                            value={showMythicShards}
                            onChange={e =>
                                onShowMythicShardsChange(e.target.value as RosterSnapshotShowVariableSettings)
                            }>
                            <MenuItem value={RosterSnapshotShowVariableSettings.Never}>Never</MenuItem>
                            <MenuItem value={RosterSnapshotShowVariableSettings.WhenNonZero}>When Non-Zero</MenuItem>
                            <MenuItem value={RosterSnapshotShowVariableSettings.Always}>Always</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Show XP Level</InputLabel>
                        <Select
                            label="Show XP Level"
                            value={showXpLevel}
                            onChange={e => onShowXpLevelChange(e.target.value as RosterSnapshotShowVariableSettings)}>
                            <MenuItem value={RosterSnapshotShowVariableSettings.Never}>Never</MenuItem>
                            <MenuItem value={RosterSnapshotShowVariableSettings.Always}>Always</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Diff Style</InputLabel>
                        <Select
                            label="Diff Style"
                            value={diffStyle}
                            onChange={e => onDiffStyleChange(e.target.value as RosterSnapshotDiffStyle)}>
                            <MenuItem value={RosterSnapshotDiffStyle.SideBySide}>Side by Side</MenuItem>
                            <MenuItem value={RosterSnapshotDiffStyle.Detailed}>Detailed</MenuItem>
                        </Select>
                    </FormControl>
                </div>
                <div className="h-5"></div>
                <div className="flex flex-col gap-4 rounded border border-gray-200 p-4 dark:border-gray-700">
                    <Typography variant="h6" gutterBottom>
                        Snapshot Management
                    </Typography>
                    <FormControl fullWidth disabled={allLiveSnapshots.length === 0}>
                        <InputLabel>Select Snapshot</InputLabel>
                        <Select
                            value={selectedIndex}
                            label="Select Snapshot"
                            onChange={e => setSelectedIndex(Number(e.target.value))}>
                            {allLiveSnapshots.map(s => (
                                <MenuItem key={s.index} value={s.index}>
                                    {s.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Rename Section */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <TextField
                            disabled={allLiveSnapshots.length === 0}
                            fullWidth
                            label="Change Snapshot Name To"
                            value={allLiveSnapshots.length === 0 ? '' : editName}
                            error={!!error}
                            helperText={error}
                            onChange={e => setEditName(e.target.value)}
                        />
                        <Button
                            variant="contained"
                            onClick={handleRename}
                            sx={{ mt: 1 }}
                            disabled={allLiveSnapshots.length === 0}>
                            Rename
                        </Button>
                    </Box>

                    {/* Restore Deleted Section */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <FormControl fullWidth disabled={allDeletedSnapshots.length === 0}>
                            <InputLabel>Restore Deleted Snapshot</InputLabel>
                            <Select
                                value={selectedDeletedIndex}
                                label="Restore Deleted Snapshot"
                                onChange={e => setSelectedDeletedIndex(Number(e.target.value))}>
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
                            sx={{ mt: 1 }}
                            disabled={allDeletedSnapshots.length === 0}>
                            Restore
                        </Button>
                    </Box>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                        <Typography variant="body2" color="text.secondary">
                            Danger Zone
                        </Typography>
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
