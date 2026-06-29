import { Info } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import React, { useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { DialogProps } from '@/models/dialog.props';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { updateTacticusApiKey } from '@/fsd/5-shared/lib/tacticus-api';
import { useAuth } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { Button } from '@/fsd/5-shared/ui/button';
import { useLoader } from '@/fsd/5-shared/ui/contexts';
import { TextField } from '@/fsd/5-shared/ui/input';
import { Modal } from '@/fsd/5-shared/ui/modal';

import { isValidTacticusUuid } from './credentials';
import { isValidGuildTag, GUILD_TAG_LENGTH } from './guild-sharing';
import { useSyncWithTacticus } from './use-sync-with-tacticus';

const UUID_EXAMPLE = 'a1b2c3d4-e5f6-1a7b-2c9d-0e1f2a3b4c5d';
const UUID_ERROR = `Must be a UUID, e.g. ${UUID_EXAMPLE}.`;

const FieldLabelWithInfo: React.FC<{ label: string; info: React.ReactNode }> = ({ label, info }) => (
    <div className="flex items-center gap-1.5">
        <span className="text-secondary-fg text-sm/6 font-medium">{label}</span>
        <AccessibleTooltip title={info}>
            <button
                type="button"
                aria-label={`About ${label}`}
                className="-m-2 inline-flex cursor-help touch-manipulation p-2 text-(--primary)">
                <Info className="size-4" />
            </button>
        </AccessibleTooltip>
    </div>
);

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

    const trimmedApiKey = apiKey.trim();
    const trimmedGuildApiKey = guildApiKey.trim();
    const trimmedUserId = userId.trim();
    const trimmedGuildTag = guildTag.trim();

    // Empty is allowed (the field is being cleared); a non-empty value must be a valid UUID.
    const apiKeyInvalid = trimmedApiKey.length > 0 && !isValidTacticusUuid(trimmedApiKey);
    const guildApiKeyInvalid = trimmedGuildApiKey.length > 0 && !isValidTacticusUuid(trimmedGuildApiKey);
    const userIdInvalid = trimmedUserId.length > 0 && !isValidTacticusUuid(trimmedUserId);
    const guildTagInvalid = trimmedGuildTag.length > 0 && !isValidGuildTag(trimmedGuildTag);

    const hasInvalidField = apiKeyInvalid || guildApiKeyInvalid || userIdInvalid || guildTagInvalid;

    const isDirty =
        apiKey !== currentApiKey ||
        guildApiKey !== currentGuildApiKey ||
        userId !== currentUserId ||
        currentShareInGameName !== savedShareInGameName ||
        currentShareRosterData !== savedShareRosterData ||
        shareGuildMemberPerformance !== savedShareGuildMemberPerformance ||
        guildTag !== savedGuildTag;

    async function updateApiKey(): Promise<boolean> {
        loader.startLoading('Updating settings. Please wait…');
        try {
            const response = await updateTacticusApiKey(trimmedApiKey, trimmedGuildApiKey, trimmedUserId, {
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
                tacticusApiKey: trimmedApiKey,
                tacticusGuildApiKey: trimmedGuildApiKey,
                tacticusUserId: trimmedUserId,
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
                </Modal.Header>
                <Modal.Body className="pb-4">
                    <div className="space-y-4">
                        <p>
                            <span className="font-bold">Acquire your API key at </span>
                            <a
                                href="https://api.tacticusgame.com/"
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                                https://api.tacticusgame.com
                            </a>
                            .
                        </p>
                        <p>
                            <span className="font-semibold text-amber-700 dark:text-amber-400">
                                🔑 DO NOT SHARE PUBLICLY:&nbsp;
                            </span>
                            <span>
                                Only share this key with trusted parties. Do not post your key on forums or in open
                                chats.
                            </span>
                        </p>
                    </div>

                    <div className="mt-4 flex flex-col items-center justify-between gap-4">
                        <div className="flex w-[80%] flex-col gap-y-1">
                            <FieldLabelWithInfo
                                label="Personal API key"
                                info="Used to fetch Player data. Player scope is required for this key."
                            />
                            <TextField
                                aria-label="Personal API key"
                                name="tacticus-api-key"
                                className="w-full"
                                placeholder={UUID_EXAMPLE}
                                value={apiKey}
                                onChange={setApiKey}
                                autoComplete="off"
                                spellCheck="false"
                                isInvalid={apiKeyInvalid}
                                errorMessage={apiKeyInvalid ? UUID_ERROR : undefined}
                                isRevealable
                            />
                        </div>
                        <div className="flex w-[80%] flex-col gap-y-1">
                            <FieldLabelWithInfo
                                label="Guild API key"
                                info="Used to fetch Guild Raid data. Ask your guild leader or co-leader to generate an API key with “Guild Raid” and “Guild” scopes."
                            />
                            <TextField
                                aria-label="Guild API key"
                                name="tacticus-guild-api-key"
                                className="w-full"
                                placeholder={UUID_EXAMPLE}
                                value={guildApiKey}
                                onChange={setGuildApiKey}
                                autoComplete="off"
                                spellCheck="false"
                                isInvalid={guildApiKeyInvalid}
                                errorMessage={guildApiKeyInvalid ? UUID_ERROR : undefined}
                                isRevealable
                                isDisabled={apiKey === undefined || apiKey.length === 0}
                            />
                        </div>
                        <div className="flex w-[80%] flex-col gap-y-1">
                            <FieldLabelWithInfo
                                label="Tacticus User ID"
                                info="Used to identify your account in the Guild Raid data. You can find it at the bottom of the in-game user settings screen."
                            />
                            <TextField
                                aria-label="Tacticus User ID"
                                name="tacticus-user-id"
                                className="w-full"
                                placeholder={UUID_EXAMPLE}
                                value={userId}
                                onChange={setUserId}
                                autoComplete="off"
                                spellCheck="false"
                                isInvalid={userIdInvalid}
                                errorMessage={userIdInvalid ? UUID_ERROR : undefined}
                                isRevealable
                            />
                        </div>
                        {userId && (
                            <div className="flex w-[80%] flex-col gap-2">
                                <label className="flex cursor-pointer items-center gap-3">
                                    <input
                                        type="checkbox"
                                        className="size-4 cursor-pointer accent-(--primary)"
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
                                <label
                                    className={`flex items-center gap-3 ${currentShareInGameName ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                                    <input
                                        type="checkbox"
                                        className="size-4 cursor-pointer accent-(--primary) disabled:cursor-not-allowed"
                                        checked={currentShareRosterData}
                                        onChange={event => setCurrentShareRosterData(event.target.checked)}
                                        disabled={currentShareInGameName === false}
                                    />
                                    <span className="text-sm">Share roster with guild</span>
                                </label>
                                {!currentShareInGameName && (
                                    <p className="text-xs text-(--soft-fg)">
                                        Enable sharing your in-game name to also share your roster.
                                    </p>
                                )}
                            </div>
                        )}

                        {guildApiKey && (
                            <div className="flex w-[80%] flex-col gap-3">
                                <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-(--primary)"
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
                            <div className="flex w-[80%] flex-col gap-y-1">
                                <FieldLabelWithInfo
                                    label="Guild tag"
                                    info={`Your guild's tag — exactly ${GUILD_TAG_LENGTH} alphanumeric characters.`}
                                />
                                <TextField
                                    aria-label="Guild tag"
                                    className="w-full"
                                    value={guildTag}
                                    onChange={setGuildTag}
                                    isInvalid={guildTagInvalid}
                                    errorMessage={
                                        guildTagInvalid
                                            ? `Guild tag must be exactly ${GUILD_TAG_LENGTH} alphanumeric characters.`
                                            : undefined
                                    }
                                />
                            </div>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button intent="secondary" appearance="plain" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button
                        intent="primary"
                        onPress={handleMainAction}
                        isDisabled={hasInvalidField || (!isDirty && !currentApiKey)}>
                        {isDirty ? 'Update & Sync' : 'Sync'}
                    </Button>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
};
