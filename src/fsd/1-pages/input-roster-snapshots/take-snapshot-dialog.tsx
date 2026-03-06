import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Tooltip } from '@mui/material';
import { useEffect, useState } from 'react';

interface TakeSnapshotDialogProperties {
    snapshotNames: string[];
    currentTimeMillis: number;
    isOpen: boolean;
    onSave: (snapshotName: string) => void;
    onCancel: () => void;
}

export const TakeSnapshotDialog: React.FC<TakeSnapshotDialogProperties> = ({
    snapshotNames,
    currentTimeMillis,
    isOpen,
    onSave,
    onCancel,
}: TakeSnapshotDialogProperties) => {
    const currentTimestamp: number = currentTimeMillis;
    const [formattedTime, setFormattedTime] = useState<string>(new Date(currentTimestamp).toLocaleString());
    const [snapshotName, setSnapshotName] = useState<string>('');

    useEffect(() => {
        const formatted = new Date(currentTimestamp).toLocaleString();
        setFormattedTime(formatted);
        setSnapshotName(`Snapshot ${formatted}`);
    }, [isOpen, currentTimeMillis]);

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
                    onChange={event => setSnapshotName(event.target.value)}
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
                        snapshotName.trim().length === 0
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
                            disabled={snapshotName.trim().length === 0 || snapshotNames.includes(snapshotName.trim())}>
                            Save Snapshot
                        </Button>
                    </div>
                </Tooltip>
            </DialogActions>
        </Dialog>
    );
};
