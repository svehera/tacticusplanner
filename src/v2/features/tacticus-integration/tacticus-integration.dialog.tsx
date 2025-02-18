import React, { useContext, useState } from 'react';
import { DialogProps } from 'src/v2/models/dialog.props';
import {
    getTacticusPlayerData,
    updateTacticusApiKey,
} from 'src/v2/features/tacticus-integration/tacticus-integration.endpoints';
import { enqueueSnackbar } from 'notistack';
import { useLoader } from 'src/contexts/loader.context';
import { DispatchContext } from 'src/reducers/store.provider';
import { Button, Checkbox, CheckboxGroup, Modal, TextField } from '@/shared/ui';
import { useAuth } from '@/contexts/auth';

interface Props extends DialogProps {
    tacticusApiKey: string;
    initialSyncOptions: string[];
}

export const TacticusIntegrationDialog: React.FC<Props> = ({ isOpen, onClose, tacticusApiKey, initialSyncOptions }) => {
    const dispatch = useContext(DispatchContext);
    const loader = useLoader();
    const auth = useAuth();

    const [apiKey, setApiKey] = useState<string>(tacticusApiKey);
    const [currentApiKey, setCurrentApiKey] = useState<string>(tacticusApiKey);
    const [syncOptions, setSyncOptions] = useState<Array<string>>(initialSyncOptions);

    async function syncWithTacticus() {
        onClose();
        dispatch.viewPreferences({ type: 'Update', setting: 'apiIntegrationSyncOptions', value: syncOptions });
        try {
            loader.startLoading('Syncing data via Tacticus API. Please wait...');
            const result = await getTacticusPlayerData();
            loader.endLoading();

            if (result.data) {
                console.log('Tacticus API data for debug', result.data);
                if (syncOptions.includes('roster')) {
                    dispatch.mows({ type: 'SyncWithTacticus', units: result.data.player.units });
                    dispatch.characters({ type: 'SyncWithTacticus', units: result.data.player.units });
                }

                if (syncOptions.includes('inventory')) {
                    dispatch.inventory({ type: 'SyncWithTacticus', inventory: result.data.player.inventory });
                }

                if (syncOptions.includes('campaignProgress')) {
                    dispatch.campaignsProgress({
                        type: 'SyncWithTacticus',
                        campaigns: result.data.player.progress.campaigns,
                    });
                }

                if (syncOptions.includes('raidedLocations')) {
                    dispatch.dailyRaids({
                        type: 'SyncWithTacticus',
                        progress: result.data.player.progress.campaigns,
                    });
                }

                enqueueSnackbar('Successfully synced with Tacticus API', { variant: 'success' });
            } else {
                enqueueSnackbar('There was an error while syncing with Tacticus API', { variant: 'error' });
            }
        } catch (e) {
            console.error(e);
            enqueueSnackbar('There was an error while syncing with Tacticus API', { variant: 'error' });
        }
    }

    async function updateApiKey() {
        loader.startLoading('Updating Tacticus API key. Please wait...');
        try {
            const response = await updateTacticusApiKey(apiKey);

            if (!response.data) {
                enqueueSnackbar('Failed to update Tacticus API key', { variant: 'error' });
                return;
            }

            auth.setUserInfo({ ...auth.userInfo, tacticusApiKey: apiKey });
            setCurrentApiKey(apiKey);
            if (apiKey) {
                enqueueSnackbar('Tacticus API key is set', { variant: 'success' });
            } else {
                enqueueSnackbar('Tacticus API key is removed', { variant: 'success' });
            }
        } catch (error) {
            console.error(error);
            enqueueSnackbar('Failed to update Tacticus API key', { variant: 'error' });
        } finally {
            loader.endLoading();
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={value => {
                if (!value) {
                    onClose();
                }
            }}>
            <Modal.Content>
                <Modal.Header>
                    <Modal.Title>Sync with Tacticus via API</Modal.Title>
                    <Modal.Description>
                        Disclaimer:The Planner is in early stage of integration with Tacticus API. There could be
                        unexpected issues
                        <br />
                        Acquire API key{' '}
                        <a href="https://api.tacticusgame.com/" target="_blank" rel="noreferrer">
                            here
                        </a>
                    </Modal.Description>
                </Modal.Header>
                <Modal.Body className="pb-1">
                    <div className="flex justify-between items-center">
                        <TextField
                            name={`apikey-${Math.random()}`}
                            type="password"
                            label="Your API key"
                            className="w-[80%]"
                            description="Enter your Tacticus API key"
                            value={apiKey}
                            onChange={setApiKey}
                            autoComplete="new-password"
                            isRevealable
                        />
                        <Button intent="primary" isDisabled={apiKey === currentApiKey} onPress={updateApiKey}>
                            Update
                        </Button>
                    </div>
                    <br />
                    <CheckboxGroup value={syncOptions} onChange={setSyncOptions} label="Options">
                        <Checkbox value="roster">Roster (Characters and MoWs)</Checkbox>
                        <Checkbox value="inventory">Inventory (Upgrades)</Checkbox>
                        <Checkbox value="campaignProgress">Campaign Progress (Campaign Events excluded)</Checkbox>
                        <Checkbox value="raidedLocations">Daily Raids (raided locations)</Checkbox>
                    </CheckboxGroup>
                </Modal.Body>
                <Modal.Footer>
                    <Button intent="secondary" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button
                        intent="primary"
                        onPress={syncWithTacticus}
                        isDisabled={syncOptions.length === 0 || !currentApiKey}>
                        Sync
                    </Button>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
};
