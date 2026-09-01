import { DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

import { useAuth } from '@/fsd/5-shared/model';

import { purgeUserData } from './auth.endpoints';

interface PurgeUserDataDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

/** Confirms and performs the irreversible deletion of the signed-in user's server account. */
export const PurgeUserDataDialog = ({ isOpen, onClose }: PurgeUserDataDialogProps) => {
    const { logout } = useAuth();
    const [isPurging, setIsPurging] = useState(false);
    const [confirmation, setConfirmation] = useState('');

    useEffect(() => {
        if (!isOpen) setConfirmation('');
    }, [isOpen]);

    const handlePurge = async () => {
        setIsPurging(true);
        const { error } = await purgeUserData();
        setIsPurging(false);

        if (error) {
            enqueueSnackbar('Could not delete your account. Please try again.', { variant: 'error' });
            return;
        }

        logout();
        enqueueSnackbar('Your account has been deleted.', { variant: 'success' });
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={isPurging ? undefined : onClose} fullWidth maxWidth="sm">
            <DialogTitle>Delete account?</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    This permanently deletes your account, likes, saved planner data, and linked guild roster data. It
                    cannot be undone.
                </DialogContentText>
                <DialogContentText className="mt-3">
                    Guides you authored or moderated remain available as community content, but no longer identify you.
                </DialogContentText>
                <TextField
                    autoComplete="off"
                    autoFocus
                    fullWidth
                    label="Type DELETE to confirm"
                    margin="normal"
                    onChange={event_ => setConfirmation(event_.target.value)}
                    value={confirmation}
                />
            </DialogContent>
            <DialogActions>
                <Button disabled={isPurging} onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    color="error"
                    disabled={isPurging || confirmation !== 'DELETE'}
                    variant="contained"
                    onClick={handlePurge}>
                    {isPurging ? 'Deleting…' : 'Delete account'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
