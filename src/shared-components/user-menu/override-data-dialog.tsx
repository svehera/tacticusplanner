import React, { useContext } from 'react';
import Dialog from '@mui/material/Dialog';
import { DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Button from '@mui/material/Button';

import Box from '@mui/material/Box';

import { DispatchContext } from '../../reducers/store.provider';
import { enqueueSnackbar } from 'notistack';
import { GlobalState } from '../../models/global-state';
import { defaultData } from '../../models/constants';

export const OverrideDataDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: (proceed: boolean) => void }) => {
    const { setStore } = useContext(DispatchContext);

    const resetData = () => {
        setStore(new GlobalState(defaultData), false, true);
        enqueueSnackbar('Data was reset to default', { variant: 'success' });
        onClose(true);
    };
    return (
        <Dialog open={isOpen} onClose={() => onClose(false)} fullWidth>
            <DialogTitle>Data Override Warning</DialogTitle>
            <DialogContent>
                <Box>
                    <h3>Decide how to handle local changes</h3>
                    <p>
                        <span style={{ fontWeight: 'bold' }}>Discard</span> if you sure there is nothing important in
                        you local changes
                    </p>
                    <p>
                        <span style={{ fontWeight: 'bold' }}>Accept</span> if you sure there are changes that you want
                        to preserve
                    </p>
                    <p>
                        <span style={{ fontWeight: 'bold' }}>Backup</span> your data with{' '}
                        <span style={{ fontWeight: 'bold' }}>{'"Export"'}</span> option in user menu before proceed if
                        you not sure which one to choose
                    </p>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose(false)}>Cancel</Button>
                <Button onClick={resetData}>Discard</Button>
                <Button onClick={() => onClose(true)}>Accept</Button>
            </DialogActions>
        </Dialog>
    );
};
