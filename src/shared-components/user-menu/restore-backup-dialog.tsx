import React, { useContext, useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Button from '@mui/material/Button';

import Box from '@mui/material/Box';

import { IPersonalData2 } from '../../models/interfaces';
import { DispatchContext } from '../../reducers/store.provider';
import { enqueueSnackbar } from 'notistack';
import { GlobalState } from '../../models/global-state';
import { PersonalDataLocalStorage } from '../../services';

export const RestoreBackupDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { setStore } = useContext(DispatchContext);
    const [data, setData] = useState<IPersonalData2 | null>(null);

    useEffect(() => {
        const localStorage = new PersonalDataLocalStorage();
        const restoredData = localStorage.restoreData();
        if (!restoredData) {
            enqueueSnackbar('No Backup Found', { variant: 'error' });
        } else {
            setData(restoredData);
        }
    }, [isOpen]);

    const restoreData = () => {
        if (data) {
            setStore(new GlobalState(data), true);
            enqueueSnackbar('Data restored', { variant: 'success' });
        }
        onClose();
    };
    return (
        <Dialog open={isOpen} onClose={onClose}>
            <DialogTitle>Restore Backup</DialogTitle>
            <DialogContent>
                <Box>
                    <h5>Backup contains:</h5>
                    {data ? (
                        <ul>
                            <li>{data?.characters.length} Characters unlocked</li>
                            <li>
                                {data?.goals.length} Goals ({data.goals.map(goal => goal.character).join(', ')})
                            </li>
                        </ul>
                    ) : undefined}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={restoreData}>Restore</Button>
            </DialogActions>
        </Dialog>
    );
};
