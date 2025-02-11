import Dialog from '@mui/material/Dialog';
import React, { useContext, useState } from 'react';
import { DialogProps } from 'src/v2/models/dialog.props';
import { DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Button from '@mui/material/Button';
import { getTacticusPlayerData } from 'src/v2/features/tacticus-integration/tacticus-integration.endpoints';
import { enqueueSnackbar } from 'notistack';
import { useLoader } from 'src/contexts/loader.context';
import { DispatchContext } from 'src/reducers/store.provider';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface Props extends DialogProps {
    tacticusApiKey: string;
}

export const TacticusIntegrationDialog: React.FC<Props> = ({ isOpen, onClose, tacticusApiKey }) => {
    const dispatch = useContext(DispatchContext);
    const loader = useLoader();

    const [showApiKey, setShowApiKey] = useState(false);
    const [apiKey, setApiKey] = useState<string>(tacticusApiKey);

    async function syncWithTacticus() {
        onClose();
        try {
            loader.startLoading('Syncing data via Tacticus API. Please wait...');
            const result = await getTacticusPlayerData();
            loader.endLoading();

            if (result.data) {
                console.log('Tacticus API data for debug', result.data);

                dispatch.mows({ type: 'SyncWithTacticus', units: result.data.player.units });
                dispatch.characters({ type: 'SyncWithTacticus', units: result.data.player.units });
                dispatch.inventory({ type: 'SyncWithTacticus', inventory: result.data.player.inventory });
                enqueueSnackbar('Successfully synced with Tacticus API', { variant: 'success' });
            } else {
                enqueueSnackbar('There was an error while syncing with Tacticus API', { variant: 'error' });
            }
        } catch (e) {
            console.error(e);
            enqueueSnackbar('There was an error while syncing with Tacticus API', { variant: 'error' });
        }
    }
    return (
        <Dialog open={isOpen} onClose={onClose} fullWidth>
            <DialogTitle>Sync with Tacticus via API</DialogTitle>
            <DialogContent>
                <TextField
                    label="Your API key"
                    variant="outlined"
                    fullWidth
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={() => setShowApiKey(!showApiKey)} edge="end">
                                    {showApiKey ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={syncWithTacticus}>
                    Sync
                </Button>
            </DialogActions>
        </Dialog>
    );
};
