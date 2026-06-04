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
import { Switch } from '@/fsd/5-shared/ui/switch';

import { GUILD_TAG_LENGTH, isValidGuildTag, sameGuildTags } from './guild-sharing';

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
                    className="w-32 rounded border border-(--input-border) bg-(--bg) px-2 py-1 text-sm"
                />
                <Button
                    appearance="outline"
                    size="square-petite"
                    aria-label="Add guild tag"
                    onPress={addTag}
                    isDisabled={!canAdd}>
                    +
                </Button>
            </div>
            {trimmed.length > 0 && !isValidGuildTag(trimmed) && (
                <p className="text-xs text-(--danger)">
                    Guild tag must be exactly {GUILD_TAG_LENGTH} alphanumeric characters.
                </p>
            )}
            {isDuplicate && <p className="text-xs text-(--danger)">That guild tag is already added.</p>}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                    {tags.map(tag => (
                        <span
                            key={tag}
                            className="flex items-center gap-1 rounded-full border border-(--border) px-2 py-0.5 text-xs">
                            {tag}
                            <button
                                type="button"
                                aria-label={`Remove ${tag}`}
                                onClick={() => onChange(tags.filter(existing => existing !== tag))}
                                className="rounded text-(--soft-fg) transition-colors hover:bg-(--danger)/10 hover:text-(--danger)">
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

            if (!response.data) {
                enqueueSnackbar(buildErrorMessage(response.error), { variant: 'error' });
                return;
            }

            auth.setUserInfo({
                ...auth.userInfo,
                tacticusApiKey: apiKey,
                tacticusGuildApiKey: guildApiKey,
                tacticusUserId: userId,
                shareInGameName: currentShareInGameName,
                shareRosterData: currentShareRosterData,
                shareGuildMemberPerformance,
                combinedGuildTags: combinedTags,
                guildTag: trimmedGuildTag,
            });
            setCurrentApiKey(apiKey);
            setCurrentGuildApiKey(guildApiKey);
            setCurrentUserId(userId);
            setSavedShareInGameName(currentShareInGameName);
            setSavedShareRosterData(currentShareRosterData);
            setSavedShareGuildMemberPerformance(shareGuildMemberPerformance);
            setSavedCombinedTags(combinedTags);
            setGuildTag(trimmedGuildTag);
            setSavedGuildTag(trimmedGuildTag);

            enqueueSnackbar('Settings updated', { variant: 'success' });
        } catch (error) {
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
                    <Modal.Title>Tacticus API settings</Modal.Title>
                    <Modal.Description>
                        <span className="font-semibold text-(--danger)">⚠ Warning:&nbsp;</span>
                        The Planner is in an early stage of integration with the Tacticus API. Unexpected issues may
                        occur.
                    </Modal.Description>
                </Modal.Header>
                <Modal.Body className="pb-1">
                    <div className="flex flex-col gap-4">
                        <div className="space-y-3">
                            <p>
                                <span className="font-bold">Acquire your API key at </span>
                                <a
                                    href="https://api.tacticusgame.com/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-(--primary) underline hover:opacity-80">
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

                        <div className="flex flex-col gap-4">
                            <TextField
                                name={`apikey-${Math.random()}`}
                                description="Used to fetch Player data. Player scope is required for this key"
                                type="password"
                                label="Personal API key"
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
                                value={userId}
                                onChange={setUserId}
                                autoComplete="new-password"
                                isRevealable
                            />
                            {userId && (
                                <div className="flex flex-col gap-2">
                                    <Switch isSelected={currentShareInGameName} onChange={setCurrentShareInGameName}>
                                        Share in-game player name with guild
                                    </Switch>
                                    <Switch isSelected={currentShareRosterData} onChange={setCurrentShareRosterData}>
                                        Share roster with guild
                                    </Switch>
                                </div>
                            )}
                            {guildApiKey && (
                                <div className="flex flex-col gap-3">
                                    <label className="flex cursor-pointer items-start gap-3">
                                        <input
                                            type="checkbox"
                                            className="mt-0.5 size-4 cursor-pointer accent-blue-600"
                                            checked={shareGuildMemberPerformance}
                                            onChange={event => setShareGuildMemberPerformance(event.target.checked)}
                                        />
                                        <span className="text-sm">
                                            Privately share each guild member&apos;s performance data (visible only to
                                            that member)
                                        </span>
                                    </label>
                                    <GuildTagListInput tags={combinedTags} onChange={setCombinedTags} />
                                </div>
                            )}
                            {!guildApiKey && userId && (
                                <TextField
                                    description={`Your guild's tag — exactly ${GUILD_TAG_LENGTH} alphanumeric characters`}
                                    label="Guild tag"
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
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button intent="secondary" onPress={onClose}>
                        Cancel
                    </Button>
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
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
};
