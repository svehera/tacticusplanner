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

import { isValidGuildTag, GUILD_TAG_LENGTH } from './guild-sharing';
import { useSyncWithTacticus } from './use-sync-with-tacticus';

interface Props extends DialogProps {
    tacticusApiKey: string;
    tacticusUserId: string;
    tacticusGuildApiKey: string;
    shareInGameName?: boolean;
    shareRosterData?: boolean;
    shareGuildMemberPerformance?: boolean;
    /** @deprecated Combined guild tags are now managed in the Shared Leaderboards tab. Ignored. */
    combinedGuildTags?: string[];
    guildTag?: string;
}

function buildErrorMessage(error: string | Error | undefined): string {
    const baseMessage = 'Failed to update settings';
    const detail = typeof error === 'string' ? error : error?.message;
    return detail ? `${baseMessage}: ${detail}` : baseMessage;
}

export const TacticusIntegrationDialog: React.FC<Props> = ({
    isOpen,
    onClose,
    tacticusApiKey,
    tacticusUserId,
    tacticusGuildApiKey,
    shareInGameName,
    shareRosterData,
    shareGuildMemberPerformance: shareGuildMemberPerformanceProperty,
    guildTag: guildTagProperty,
}) => {
    const loader = useLoader();
    const auth = useAuth();
    const { syncWithTacticus } = useSyncWithTacticus();

    const [apiKey, setApiKey] = useState<string>(tacticusApiKey);
    const [currentApiKey] = useState<string>(tacticusApiKey);
    const [guildApiKey, setGuildApiKey] = useState<string>(tacticusGuildApiKey);
    const [currentGuildApiKey] = useState<string>(tacticusGuildApiKey);
    const [userId, setUserId] = useState<string>(tacticusUserId);
    const [currentUserId] = useState<string>(tacticusUserId);
    const [currentShareInGameName, setCurrentShareInGameName] = useState<boolean>(shareInGameName ?? false);
    const [savedShareInGameName] = useState<boolean>(shareInGameName ?? false);
    const [currentShareRosterData, setCurrentShareRosterData] = useState<boolean>(shareRosterData ?? false);
    const [savedShareRosterData] = useState<boolean>(shareRosterData ?? false);
    const [shareGuildMemberPerformance, setShareGuildMemberPerformance] = useState<boolean>(
        shareGuildMemberPerformanceProperty ?? false
    );
    const [savedShareGuildMemberPerformance] = useState<boolean>(shareGuildMemberPerformanceProperty ?? false);
    const [guildTag, setGuildTag] = useState<string>(guildTagProperty ?? '');
    const [savedGuildTag] = useState<string>(guildTagProperty ?? '');

    const trimmedGuildTag = guildTag.trim();
    const guildTagInvalid = trimmedGuildTag.length > 0 && !isValidGuildTag(trimmedGuildTag);

    const isDirty =
        apiKey !== currentApiKey ||
        guildApiKey !== currentGuildApiKey ||
        userId !== currentUserId ||
        currentShareInGameName !== savedShareInGameName ||
        currentShareRosterData !== savedShareRosterData ||
        shareGuildMemberPerformance !== savedShareGuildMemberPerformance ||
        guildTag !== savedGuildTag;

    async function updateApiKey(): Promise<boolean> {
        loader.startLoading('Updating settings. Please wait...');
        try {
            const response = await updateTacticusApiKey(apiKey, guildApiKey, userId, {
                shareInGameName: currentShareInGameName,
                shareRosterData: currentShareRosterData,
                shareGuildMemberPerformance,
                guildTag: trimmedGuildTag,
            });

            if (!response.data && tacticusApiKey !== undefined && tacticusApiKey.length > 0) {
                enqueueSnackbar(buildErrorMessage(response.error), { variant: 'error' });
                return false;
            }

            auth.setUserInfo({
                ...auth.userInfo,
                tacticusApiKey: apiKey,
                tacticusGuildApiKey: guildApiKey,
                tacticusUserId: userId,
                shareInGameName: currentShareInGameName,
                shareRosterData: currentShareRosterData,
                shareGuildMemberPerformance,
                guildTag: trimmedGuildTag,
            });

            enqueueSnackbar('Settings updated', { variant: 'success' });
            return true;
        } catch (error) {
            console.error(error);
            const parsedError =
                typeof error === 'string' || error instanceof Error || error === undefined ? error : String(error);
            enqueueSnackbar(buildErrorMessage(parsedError), { variant: 'error' });
            return false;
        } finally {
            loader.endLoading();
        }
    }

    async function handleMainAction() {
        if (isDirty) {
            const success = await updateApiKey();
            if (!success) return;
        }
        onClose();
        await syncWithTacticus();
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
                            label="Personal API key"
                            className="w-[80%]"
                            value={apiKey}
                            onChange={setApiKey}
                            autoComplete="off"
                            isRevealable
                        />
                        <TextField
                            name={`guildApikey-${Math.random()}`}
                            description="Used to fetch Guild Raid data. Ask your guild leader or co-leader to generate API key with 'Guild Raid' and 'Guild' scopes"
                            label="Guild API key"
                            className="w-[80%]"
                            value={guildApiKey}
                            onChange={setGuildApiKey}
                            autoComplete="off"
                            isRevealable
                            isDisabled={apiKey === undefined || apiKey.length === 0}
                        />
                        <TextField
                            name={`apikey-${Math.random()}`}
                            description="Used to identify your account in the Guild Raid data"
                            label="Tacticus User ID"
                            className="w-[80%]"
                            value={userId}
                            onChange={setUserId}
                            autoComplete="off"
                            isRevealable
                        />
                        {userId && (
                            <div className="flex w-[80%] flex-col gap-2 pt-2">
                                <label className="flex cursor-pointer items-center gap-3">
                                    <input
                                        type="checkbox"
                                        className="size-4 cursor-pointer accent-blue-600"
                                        checked={currentShareInGameName}
                                        onChange={event => {
                                            setCurrentShareInGameName(event.target.checked);
                                            if (!event.target.checked) {
                                                setCurrentShareRosterData(false);
                                            }
                                        }}
                                    />
                                    <span className="text-sm">Share in-game player name with guild</span>
                                </label>
                                <label className="flex cursor-pointer items-center gap-3">
                                    <input
                                        type="checkbox"
                                        className="size-4 cursor-pointer accent-blue-600"
                                        checked={currentShareRosterData}
                                        onChange={event => setCurrentShareRosterData(event.target.checked)}
                                        disabled={currentShareInGameName === false}
                                    />
                                    <span className="text-sm">Share roster with guild</span>
                                </label>
                            </div>
                        )}

                        {currentShareRosterData && new Date() < new Date('2026-06-15T00:00:00Z') && (
                            <div className="mt-2 w-[80%] rounded border border-blue-300 bg-blue-50 px-3 py-2 text-sm dark:border-blue-700 dark:bg-blue-950">
                                <p className="font-semibold text-blue-700 dark:text-blue-300">
                                    Thanks for sharing your roster!
                                </p>
                                <p className="mt-1 text-blue-600 dark:text-blue-400">
                                    Use code <span className="font-mono font-bold tracking-wide">PLANNERRAIDS</span>{' '}
                                    in-game to claim a reward.
                                </p>
                            </div>
                        )}

                        {guildApiKey && (
                            <div className="flex w-[80%] flex-col gap-3 pt-2">
                                <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 size-4 cursor-pointer accent-blue-600"
                                        checked={shareGuildMemberPerformance}
                                        onChange={event => setShareGuildMemberPerformance(event.target.checked)}
                                    />
                                    <span className="text-sm">
                                        Privately share each guild member&apos;s performance data (visible only to that
                                        member)
                                    </span>
                                </label>
                            </div>
                        )}
                        {!guildApiKey && userId && (
                            <TextField
                                description={`Your guild's tag — exactly ${GUILD_TAG_LENGTH} alphanumeric characters`}
                                label="Guild tag"
                                className="w-[80%] pt-2"
                                value={guildTag}
                                onChange={setGuildTag}
                                errorMessage={
                                    guildTagInvalid
                                        ? `Guild tag must be exactly ${GUILD_TAG_LENGTH} alphanumeric characters.`
                                        : undefined
                                }
                            />
                        )}
                    </div>
                    <br />
                </Modal.Body>
                <Modal.Footer>
                    <Button intent="secondary" appearance="plain" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button
                        intent="primary"
                        onPress={handleMainAction}
                        isDisabled={guildTagInvalid || (!isDirty && !currentApiKey)}>
                        {isDirty ? 'Update & Sync' : 'Sync'}
                    </Button>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
};
