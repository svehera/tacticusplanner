import { enqueueSnackbar } from 'notistack';
import React, { useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { DialogProps } from '@/models/dialog.props';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { updateTacticusApiKey } from '@/fsd/5-shared/lib/tacticus-api';
import { useAuth } from '@/fsd/5-shared/model';
import { Button } from '@/fsd/5-shared/ui/button';
import { useLoader } from '@/fsd/5-shared/ui/contexts';
import { TextField } from '@/fsd/5-shared/ui/input';
import { Modal } from '@/fsd/5-shared/ui/modal';

import { useSyncWithTacticus } from './useSyncWithTacticus';

interface Props extends DialogProps {
    tacticusApiKey: string;
    tacticusUserId: string;
    tacticusGuildApiKey: string;
}

export const TacticusIntegrationDialog: React.FC<Props> = ({
    isOpen,
    onClose,
    tacticusApiKey,
    tacticusUserId,
    tacticusGuildApiKey,
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

    async function syncWithTacticusApi() {
        onClose();
        await syncWithTacticus();
    }

    function buildErrMsg(error: string | Error | null): string {
        const baseMsg = 'Failed to update settings';
        const detail = typeof error === 'string' ? error : error?.message;
        return detail ? `${baseMsg}: ${detail}` : baseMsg;
    }

    async function updateApiKey() {
        loader.startLoading('Updating settings. Please wait...');
        try {
            const response = await updateTacticusApiKey(apiKey, guildApiKey, userId);

            if (!response.data) {
                enqueueSnackbar(buildErrMsg(response.error), { variant: 'error' });
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
            const parsedError =
                typeof error === 'string' || error instanceof Error || error === null ? error : String(error);
            enqueueSnackbar(buildErrMsg(parsedError), { variant: 'error' });
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
                        <span className="font-semibold text-red-600 dark:text-red-500">⚠ Warning:&nbsp;</span>
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
                            className="font-semibold text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                            https://api.tacticusgame.com
                        </a>
                        .
                        <br />
                        <br />
                        <p>
                            <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                                🔑 DO NOT SHARE PUBLICLY:&nbsp;
                            </span>
                            <span>
                                Only share this key with trusted parties. Do not post your key on forums or in open
                                chats.
                            </span>
                        </p>
                    </div>

                    <br />

                    <div className="flex flex-col items-center justify-between">
                        <TextField
                            name={`apikey-${Math.random()}`}
                            description="Used to fetch Player data. Player scope is required for this key"
                            type="password"
                            label="Personal API key"
                            className="w-[80%]"
                            value={apiKey}
                            onChange={setApiKey}
                            autoComplete="new-password"
                            isRevealable
                        />
                        <TextField
                            name={`guildApikey-${Math.random()}`}
                            description="Used to fetch Guild Raid data. Ask your guild leader or co-leader to generate API key with 'Guild Raid' and 'Guild' scopes"
                            type="password"
                            label="Guild API key"
                            className="w-[80%]"
                            value={guildApiKey}
                            onChange={setGuildApiKey}
                            autoComplete="new-password"
                            isRevealable
                        />
                        <TextField
                            name={`apikey-${Math.random()}`}
                            type="password"
                            description="Used to identify your account in the Guild Raid data"
                            label="Tacticus User ID"
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
                </Modal.Body>
                <Modal.Footer>
                    <Button intent="secondary" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button intent="primary" onPress={syncWithTacticusApi} isDisabled={!currentApiKey}>
                        Sync
                    </Button>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
};
