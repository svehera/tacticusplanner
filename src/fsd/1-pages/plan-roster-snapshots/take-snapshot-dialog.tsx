import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { ICharacter2 } from '@/models/interfaces';

import { IMow2 } from '@/fsd/4-entities/mow';

interface TakeSnapshotDialogProps {
    chars: ICharacter2[];
    mows: IMow2[];
    isOpen: boolean;
    onSave: (snapshotName: string) => void;
    onCancel: () => void;
}

export const TakeSnapshotDialog: React.FC<TakeSnapshotDialogProps> = ({
    chars,
    mows,
    isOpen,
    onSave,
    onCancel,
}: TakeSnapshotDialogProps) => {
    const currentTimestamp: number = Date.now();
    const formattedTimestamp: string = new Date(currentTimestamp).toLocaleString();
    const [snapshotName, setSnapshotName] = useState(`Snapshot ${formattedTimestamp}`);

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
                    <strong>Time:</strong> {`${formattedTimestamp}`}
                </div>

                <div className="mt-4 p-3 border rounded bg-gray-100 dark:bg-gray-800 h-20 overflow-y-auto">
                    <strong>Current Roster Summary:</strong>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        (Placeholder: This area would show a summary of your {chars.length} characters and {mows.length}{' '}
                        Machines of War for confirmation)
                    </p>
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} color="inherit">
                    Cancel
                </Button>
                <Button
                    onClick={() => onSave(snapshotName)}
                    color="primary"
                    variant="contained"
                    disabled={!snapshotName.trim()} // Disable if name is empty
                >
                    Save Snapshot
                </Button>
            </DialogActions>
        </Dialog>
    );
};
