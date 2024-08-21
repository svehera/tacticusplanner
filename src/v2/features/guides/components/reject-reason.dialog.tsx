import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Button from '@mui/material/Button';

interface Props {
    onClose: (reason: string) => void;
}

export const RejectReasonDialog: React.FC<Props> = ({ onClose }) => {
    const [reason, setReason] = useState<string>('');
    return (
        <Dialog open={true} fullWidth>
            <DialogTitle>Provide Reject Reason</DialogTitle>
            <DialogContent>
                <br />
                <TextField
                    fullWidth
                    id="outlined-textarea"
                    label="Reason"
                    placeholder="Reason"
                    multiline
                    maxRows={5}
                    value={reason}
                    onChange={event => setReason(event.target.value.slice(0, 200))}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="error"
                    onClick={() => {
                        onClose(reason);
                    }}>
                    Reject
                </Button>
            </DialogActions>
        </Dialog>
    );
};
