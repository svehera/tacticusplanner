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
                    <strong>Time:</strong> {`${formattedTimestamp}`}
                </div>

                <div className="mt-4 p-3 border rounded bg-gray-100 dark:bg-gray-800 h-20 overflow-y-auto">
                    {Object.entries(unitsByFaction).map(([faction, units]) => (
                        <div key={faction} className="mb-2">
                            <div className="font-bold mb-1">{faction}</div>
                            <ul className="list-disc list-inside">
                                {units.map(unit => (
                                    <li key={unit.id}>
                                        {unit.name} - Rank {'rank' in unit ? unit.rank : 'N/A'}, Stars {unit.stars}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
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
