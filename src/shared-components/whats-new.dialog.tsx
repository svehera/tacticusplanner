import React, { useContext } from 'react';
import Dialog from '@mui/material/Dialog';
import { DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { DispatchContext, StoreContext } from '../reducers/store.provider';

export const WhatsNewDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { seenAppVersion } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const handleClose = () => {
        const currentAppVersion = localStorage.getItem('appVersion');
        if (seenAppVersion !== currentAppVersion) {
            dispatch.seenAppVersion(currentAppVersion);
        }
        onClose();
    };

    return (
        <Dialog open={isOpen}>
            <DialogTitle>{"What's New"}</DialogTitle>
            <DialogContent>
                <Box>SOme changes </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>OK</Button>
            </DialogActions>
        </Dialog>
    );
};
