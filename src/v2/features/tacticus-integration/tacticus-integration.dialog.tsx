import React, { useState } from 'react';
import { DialogProps } from 'src/v2/models/dialog.props';
import { updateTacticusApiKey } from './tacticus-integration.endpoints';
import { enqueueSnackbar } from 'notistack';
import { useLoader } from 'src/contexts/loader.context';
import { Button, Checkbox, CheckboxGroup, Modal, TextField } from '@/shared/ui';
import { useAuth } from '@/contexts/auth';
import { useSyncWithTacticus } from './useSyncWithTacticus';

interface Props extends DialogProps {
    tacticusApiKey: string;
    tacticusUserId: string;
    tacticusGuildApiKey: string;
    initialSyncOptions: string[];
}

export const TacticusIntegrationDialog: React.FC<Props> = ({
    isOpen,
    onClose,
    tacticusApiKey,
    tacticusUserId,
    tacticusGuildApiKey,
    initialSyncOptions,
}) => {
    const loader = useLoader();
    const auth = useAuth();
    const { syncWithTacticus } = useSyncWithTacticus();

    const [apiKey, setApiKey] = useState<string>(tacticusApiKey);
    const [currentApiKey, setCurrentApiKey] = useState<string>(tacticusApiKey);
    const [guildApiKey, setGuildApiKey] = useState<string>(tacticusGuildApiKey);
    const [currentGuildApiKey, setCurrentGuildApiKey] = useState<string>(tacticusGuildApiKey);
    const [userId, setUserId] = useState<string>(tacticusUserId);
    const [currentUserId, setCurrentUserId] = useState<string>(tacticusUserId);
    const [syncOptions, setSyncOptions] = useState<Array<string>>(initialSyncOptions);

    async function syncWithTacticusApi() {
        onClose();
        await syncWithTacticus(syncOptions);
    }

    async function updateApiKey() {
        loader.startLoading('Updating settings. Please wait...');
        try {
            const response = await updateTacticusApiKey(apiKey, guildApiKey, userId);

            if (!response.data) {
                enqueueSnackbar('Failed to update settings', { variant: 'error' });
                return;
            }

            auth.setUserInfo({
                ...auth.userInfo,
                tacticusApiKey: apiKey,
                tacticusGuildApiKey: guildApiKey,
                tacticusUserId: userId,
            });
            setCurrentApiKey(apiKey);
            setCurrentGuildApiKey(guildApiKey);
            setCurrentUserId(userId);

            enqueueSnackbar('Settings updated', { variant: 'success' });
        } catch (error) {
            console.error(error);
            enqueueSnackbar('Failed to update settings', { variant: 'error' });
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
                        <span className="text-red-600 dark:text-red-500 font-semibold">⚠ Warning:&nbsp;</span>
                        The Planner is in an early stage of integration with the Tacticus API. Unexpected issues may
                        occur.
                    </Modal.Description>
                </Modal.Header>
                <Modal.Body className="pb-1">
                    <div>
                        <span className="font-bold">Acquire your API key at </span>
                        <a
                            href="https://api.tacticusgame.com/"
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 font-semibold">
                            https://api.tacticusgame.com
                        </a>
                        .
                        <br />
                        <br />
                        <p>
                            <span className="text-yellow-700 dark:text-yellow-400 font-semibold">
                                🔑 DO NOT SHARE PUBLICLY:&nbsp;
                            </span>
                            <span>
                                Only share this key with trusted parties. Do not post your key on forums or in open
                                chats.
                            </span>
                        </p>
                    </div>

                    <br />

                    <div className="flex flex-col justify-between items-center">
                        <TextField
                            name={`apikey-${Math.random()}`}
                            type="password"
                            label="Personal API key"
                            className="w-[80%]"
                            value={apiKey}
                            onChange={setApiKey}
                            autoComplete="new-password"
                            isRevealable
                        />
                        <TextField
                            isDisabled
                            name={`apikey-${Math.random()}`}
                            type="password"
                            label="Guild API key (In Progress)"
                            className="w-[80%]"
                            value={guildApiKey}
                            onChange={setGuildApiKey}
                            autoComplete="new-password"
                            isRevealable
                        />
                        <TextField
                            isDisabled
                            name={`apikey-${Math.random()}`}
                            type="password"
                            label="Tacticus User ID (In Progress)"
                            className="w-[80%]"
                            value={userId}
                            onChange={setUserId}
                            autoComplete="new-password"
                            isRevealable
                        />
                        <Button
                            intent="primary"
                            isDisabled={
                                apiKey === currentApiKey &&
                                guildApiKey === currentGuildApiKey &&
                                userId === currentUserId
                            }
                            onPress={updateApiKey}>
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
                        onPress={syncWithTacticusApi}
                        isDisabled={syncOptions.length === 0 || !currentApiKey}>
                        Sync
                    </Button>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
};
