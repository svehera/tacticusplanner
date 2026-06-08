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

import { GUILD_TAG_LENGTH, isValidGuildTag, sameGuildTags } from './guild-sharing';
import { useSyncWithTacticus } from './use-sync-with-tacticus';

interface Props extends DialogProps {
    tacticusApiKey: string;
    tacticusUserId: string;
    tacticusGuildApiKey: string;
    shareInGameName?: boolean;
    shareRosterData?: boolean;
    shareGuildMemberPerformance?: boolean;
    combinedGuildTags?: string[];
    guildTag?: string;
}

function buildErrorMessage(error: string | Error | undefined): string {
    console.trace('error: ', error);
    const baseMessage = 'Failed to update settings';
    const detail = typeof error === 'string' ? error : error?.message;
    return detail ? `${baseMessage}: ${detail}` : baseMessage;
}

/** Add-and-chip list input for guild tags (each exactly 5 alphanumeric chars). */
function GuildTagListInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
    const [draft, setDraft] = useState('');
    const trimmed = draft.trim();
    const isDuplicate = tags.includes(trimmed);
    const canAdd = isValidGuildTag(trimmed) && !isDuplicate;

    const addTag = () => {
        if (!canAdd) return;
        onChange([...tags, trimmed]);
        setDraft('');
    };

    return (
        <div className="flex w-full flex-col gap-1">
            <span className="text-sm font-semibold">Share leaderboards with these guilds</span>
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={draft}
                    maxLength={GUILD_TAG_LENGTH}
                    placeholder="Guild tag"
                    onChange={event => setDraft(event.target.value)}
                    onKeyDown={event => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            addTag();
                        }
                    }}
                    className="w-32 rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
                />
                <button
                    type="button"
                    aria-label="Add guild tag"
                    onClick={addTag}
                    disabled={!canAdd}
                    className="flex size-7 items-center justify-center rounded border border-gray-300 text-lg leading-none disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600">
                    +
                </button>
            </div>
            {trimmed.length > 0 && !isValidGuildTag(trimmed) && (
                <p className="text-xs text-red-600 dark:text-red-400">
                    Guild tag must be exactly {GUILD_TAG_LENGTH} alphanumeric characters.
                </p>
            )}
            {isDuplicate && <p className="text-xs text-red-600 dark:text-red-400">That guild tag is already added.</p>}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                    {tags.map(tag => (
                        <span
                            key={tag}
                            className="flex items-center gap-1 rounded-full border border-gray-300 px-2 py-0.5 text-xs dark:border-gray-600">
                            {tag}
                            <button
                                type="button"
                                aria-label={`Remove ${tag}`}
                                onClick={() => onChange(tags.filter(existing => existing !== tag))}
                                className="text-gray-500 hover:text-red-600 dark:hover:text-red-400">
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
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
    combinedGuildTags,
    guildTag: guildTagProperty,
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
    const [currentShareInGameName, setCurrentShareInGameName] = useState<boolean>(shareInGameName ?? false);
    const [savedShareInGameName, setSavedShareInGameName] = useState<boolean>(shareInGameName ?? false);
    const [currentShareRosterData, setCurrentShareRosterData] = useState<boolean>(shareRosterData ?? false);
    const [savedShareRosterData, setSavedShareRosterData] = useState<boolean>(shareRosterData ?? false);
    const [shareGuildMemberPerformance, setShareGuildMemberPerformance] = useState<boolean>(
        shareGuildMemberPerformanceProperty ?? false
    );
    const [savedShareGuildMemberPerformance, setSavedShareGuildMemberPerformance] = useState<boolean>(
        shareGuildMemberPerformanceProperty ?? false
    );
    const [combinedTags, setCombinedTags] = useState<string[]>(combinedGuildTags ?? []);
    const [savedCombinedTags, setSavedCombinedTags] = useState<string[]>(combinedGuildTags ?? []);
    const [guildTag, setGuildTag] = useState<string>(guildTagProperty ?? '');
    const [savedGuildTag, setSavedGuildTag] = useState<string>(guildTagProperty ?? '');

    const trimmedGuildTag = guildTag.trim();
    const guildTagInvalid = trimmedGuildTag.length > 0 && !isValidGuildTag(trimmedGuildTag);

    async function syncWithTacticusApi() {
        onClose();
        await syncWithTacticus();
    }

    async function updateApiKey() {
        loader.startLoading('Updating settings. Please wait...');
        try {
            const response = await updateTacticusApiKey(apiKey, guildApiKey, userId, {
                shareInGameName: currentShareInGameName,
                shareRosterData: currentShareRosterData,
                shareGuildMemberPerformance,
                combinedGuildTags: combinedTags,
                guildTag: trimmedGuildTag,
            });

            if (!response.data && tacticusApiKey !== undefined && tacticusApiKey.length > 0) {
                enqueueSnackbar(buildErrorMessage(response.error), { variant: 'error' });
                return;
            }

            // Server returns the canonicalized combinedGuildTags — use that as the new source of truth.
            const serverCombinedTags = response.data?.combinedGuildTags ?? [];

            auth.setUserInfo({
                ...auth.userInfo,
                tacticusApiKey: apiKey,
                tacticusGuildApiKey: guildApiKey,
                tacticusUserId: userId,
                shareInGameName: currentShareInGameName,
                shareRosterData: currentShareRosterData,
                shareGuildMemberPerformance,
                combinedGuildTags: serverCombinedTags.length > 0 ? serverCombinedTags : undefined,
                guildTag: trimmedGuildTag,
            });
            setCurrentApiKey(apiKey);
            setCurrentGuildApiKey(guildApiKey);
            setCurrentUserId(userId);
            setSavedShareInGameName(currentShareInGameName);
            setSavedShareRosterData(currentShareRosterData);
            setSavedShareGuildMemberPerformance(shareGuildMemberPerformance);
            setCombinedTags(serverCombinedTags);
            setSavedCombinedTags(serverCombinedTags);
            setGuildTag(trimmedGuildTag);
            setSavedGuildTag(trimmedGuildTag);

            enqueueSnackbar('Settings updated', { variant: 'success' });
        } catch (error) {
            console.error(error);
            const parsedError =
                typeof error === 'string' || error instanceof Error || error === undefined ? error : String(error);
            enqueueSnackbar(buildErrorMessage(parsedError), { variant: 'error' });
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
                                <GuildTagListInput tags={combinedTags} onChange={setCombinedTags} />
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
                        <Button
                            intent="primary"
                            isDisabled={
                                guildTagInvalid ||
                                (apiKey === currentApiKey &&
                                    guildApiKey === currentGuildApiKey &&
                                    userId === currentUserId &&
                                    currentShareInGameName === savedShareInGameName &&
                                    currentShareRosterData === savedShareRosterData &&
                                    shareGuildMemberPerformance === savedShareGuildMemberPerformance &&
                                    sameGuildTags(combinedTags, savedCombinedTags) &&
                                    guildTag === savedGuildTag)
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
