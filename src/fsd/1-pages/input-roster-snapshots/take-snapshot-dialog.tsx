import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Tooltip } from '@mui/material';
import { useEffect, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { ICharacter2 } from '@/models/interfaces';

import { IMow2 } from '@/fsd/4-entities/mow';

interface TakeSnapshotDialogProps {
    chars: ICharacter2[];
    mows: IMow2[];
    snapshotNames: string[];
    currentTimeMillis: number;
    isOpen: boolean;
    onSave: (snapshotName: string) => void;
    onCancel: () => void;
}

export const TakeSnapshotDialog: React.FC<TakeSnapshotDialogProps> = ({
    chars,
    mows,
    snapshotNames,
    currentTimeMillis,
    isOpen,
    onSave,
    onCancel,
}: TakeSnapshotDialogProps) => {
    const currentTimestamp: number = currentTimeMillis;
    const [formattedTime, setFormattedTime] = useState<string>(new Date(currentTimestamp).toLocaleString());
    const [snapshotName, setSnapshotName] = useState<string>('');

    useEffect(() => {
        setFormattedTime(new Date(currentTimestamp).toLocaleString());
        setSnapshotName(`Snapshot ${formattedTime}`);
    }, [isOpen, currentTimeMillis]);

    const unitsByFaction: Record<string, Array<ICharacter2 | IMow2>> = {};
    chars.forEach(char => {
        if (!unitsByFaction[char.faction]) {
            unitsByFaction[char.faction] = [];
        }
        unitsByFaction[char.faction].push(char);
    });
    mows.forEach(mow => {
        if (!unitsByFaction[mow.faction]) {
            unitsByFaction[mow.faction] = [];
        }
        unitsByFaction[mow.faction].push(mow);
    });

    return (
        <Dialog open={isOpen} onClose={onCancel} fullWidth maxWidth="sm">
            <DialogTitle>Take Roster Snapshot</DialogTitle>
            <DialogContent dividers>
                <TextField
                    autoFocus
                    margin="dense"
                    id="snapshot-name"
                    label="Snapshot Name"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={snapshotName}
                    onChange={e => setSnapshotName(e.target.value)}
                    placeholder={`e.g., Guild Raid Setup - ${currentTimestamp}`}
                />

                <div className="mt-4">
                    <strong>Time:</strong> {formattedTime}
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} color="inherit">
                    Cancel
                </Button>
                <Tooltip
                    placement="top"
                    title={
                        snapshotName.trim().length < 1
                            ? 'Snapshot name cannot be empty.'
                            : snapshotNames.includes(snapshotName.trim())
                              ? 'Snapshot name must be unique.'
                              : ''
                    }>
                    <div>
                        <Button
                            onClick={() => onSave(snapshotName)}
                            color="primary"
                            variant="contained"
                            disabled={snapshotName.trim().length < 1 || snapshotNames.includes(snapshotName.trim())}>
                            Save Snapshot
                        </Button>
                    </div>
                </Tooltip>
            </DialogActions>
        </Dialog>
    );
};
