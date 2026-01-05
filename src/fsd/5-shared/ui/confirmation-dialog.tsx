import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import React from 'react';

interface ConfirmationDialogProps {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    open,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'OK',
    cancelText = 'Cancel',
}) => {
    return (
        <Dialog open={open} onClose={onCancel}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{message}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} color="primary">
                    {cancelText}
                </Button>
                <Button onClick={onConfirm} color="primary" variant="contained" autoFocus>
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
