/* eslint-disable import-x/no-internal-modules */

import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/fsd/5-shared/ui';

import { isValidGuildTag, GUILD_TAG_LENGTH } from '@/fsd/3-features/tacticus-integration/guild-sharing';

import {
    addCombinedGuildTagsApi,
    deleteCombinedGuildTagsApi,
    getCombinedGuildTagsApi,
} from './guild-roster-snapshots.models';
import {
    canAddTag,
    computePendingSummary,
    hasPendingChanges,
    isTagAlreadyPresent,
    type SharedLeaderboardsPending,
} from './shared-leaderboards-tab.utils';

const EMPTY_PENDING: SharedLeaderboardsPending = { adds: [], removes: new Set() };

function Spinner() {
    return (
        <span className="inline-block size-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
    );
}

export function SharedLeaderboardsTab() {
    const [committed, setCommitted] = useState<string[] | undefined>();
    const [pending, setPending] = useState<SharedLeaderboardsPending>(EMPTY_PENDING);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [draft, setDraft] = useState('');
    const draftTrimmed = draft.trim();
    const draftInvalid = draftTrimmed.length > 0 && !isValidGuildTag(draftTrimmed);
    const draftDuplicate =
        committed !== undefined &&
        draftTrimmed.length > 0 &&
        isValidGuildTag(draftTrimmed) &&
        isTagAlreadyPresent(draftTrimmed, committed, pending);

    const hasFetched = useRef(false);
    const isSavingReference = useRef(false);

    const fetchTags = useCallback(async (force = false) => {
        if (!force && hasFetched.current) return;
        setIsLoading(true);
        setError(undefined);
        const { data, error: apiError } = await getCombinedGuildTagsApi();
        setIsLoading(false);
        if (apiError) {
            setError(typeof apiError === 'string' ? apiError : (apiError.message ?? 'Failed to load tags'));
            return;
        }
        hasFetched.current = true;
        setCommitted(data?.combinedGuildTags ?? []);
        setPending(EMPTY_PENDING);
    }, []);

    useEffect(() => {
        fetchTags();
    }, [fetchTags]);

    const handleRefresh = () => {
        if (hasPendingChanges(pending)) {
            const ok = globalThis.confirm('You have unsaved changes. Refresh anyway and discard them?');
            if (!ok) return;
        }
        fetchTags(true);
    };

    const handleAddDraft = () => {
        if (!canAddTag(draft, committed ?? [], pending)) return;
        setPending(p => ({ ...p, adds: [...p.adds, draftTrimmed] }));
        setDraft('');
    };

    const handleRemoveCommitted = (tag: string) => {
        setPending(p => ({ ...p, removes: new Set([...p.removes, tag]) }));
    };

    const handleRestoreCommitted = (tag: string) => {
        setPending(p => {
            const next = new Set(p.removes);
            next.delete(tag);
            return { ...p, removes: next };
        });
    };

    const handleRemovePendingAdd = (tag: string) => {
        setPending(p => ({ ...p, adds: p.adds.filter(t => t !== tag) }));
    };

    const handleSave = async () => {
        if (!hasPendingChanges(pending) || isSavingReference.current) return;
        isSavingReference.current = true;
        setIsSaving(true);
        setError(undefined);

        const toAdd = pending.adds;
        const toRemove = [...pending.removes];
        let finalTags: string[] | undefined;

        if (toAdd.length > 0) {
            const { data, error: apiError } = await addCombinedGuildTagsApi(toAdd);
            if (apiError) {
                setError(typeof apiError === 'string' ? apiError : (apiError.message ?? 'Failed to save'));
                isSavingReference.current = false;
                setIsSaving(false);
                return;
            }
            finalTags = data?.combinedGuildTags;
        }

        if (toRemove.length > 0) {
            const { data, error: apiError } = await deleteCombinedGuildTagsApi(toRemove);
            if (apiError) {
                setError(typeof apiError === 'string' ? apiError : (apiError.message ?? 'Failed to save'));
                isSavingReference.current = false;
                setIsSaving(false);
                return;
            }
            finalTags = data?.combinedGuildTags;
        }

        setCommitted(finalTags ?? committed ?? []);
        setPending(EMPTY_PENDING);
        isSavingReference.current = false;
        setIsSaving(false);
    };

    const pendingSummary = computePendingSummary(pending);
    const isPendingDirty = hasPendingChanges(pending);

    const allRows: { tag: string; state: 'committed' | 'pending-remove' | 'pending-add' }[] = [
        ...(committed ?? []).map(tag => ({
            tag,
            state: (pending.removes.has(tag) ? 'pending-remove' : 'committed') as
                | 'committed'
                | 'pending-remove'
                | 'pending-add',
        })),
        ...pending.adds.map(tag => ({ tag, state: 'pending-add' as const })),
    ];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <span className="text-base font-semibold">Shared Leaderboard Guilds</span>
                <button
                    type="button"
                    aria-label="Refresh"
                    onClick={handleRefresh}
                    disabled={isLoading || isSaving}
                    title="Refresh"
                    className="flex size-7 items-center justify-center rounded border border-(--input-border) text-sm disabled:cursor-not-allowed disabled:opacity-40">
                    ⟳
                </button>
                {isLoading && <Spinner />}
            </div>

            {error && <p className="text-sm text-(--danger)">{error}</p>}

            {!isLoading && committed !== undefined && (
                <>
                    <table className="w-full max-w-sm border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-(--input-border)">
                                <th className="py-1 text-left font-semibold">Guild Tag</th>
                                <th className="w-10" />
                            </tr>
                        </thead>
                        <tbody>
                            {allRows.map(({ tag, state }) => (
                                <tr key={tag} className="border-b border-(--border)">
                                    <td className="py-1.5">
                                        <span
                                            className={
                                                state === 'pending-remove'
                                                    ? 'text-zinc-400 line-through dark:text-zinc-500'
                                                    : state === 'pending-add'
                                                      ? 'font-medium text-green-700 dark:text-green-400'
                                                      : undefined
                                            }>
                                            {tag}
                                        </span>
                                        {state === 'pending-add' && (
                                            <span className="ml-1.5 rounded bg-green-100 px-1 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
                                                +new
                                            </span>
                                        )}
                                        {state === 'pending-remove' && (
                                            <button
                                                type="button"
                                                onClick={() => handleRestoreCommitted(tag)}
                                                className="ml-2 text-xs text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300">
                                                undo
                                            </button>
                                        )}
                                    </td>
                                    <td className="py-1.5 text-center">
                                        {state !== 'pending-remove' && (
                                            <button
                                                type="button"
                                                aria-label={`Remove ${tag}`}
                                                onClick={() =>
                                                    state === 'pending-add'
                                                        ? handleRemovePendingAdd(tag)
                                                        : handleRemoveCommitted(tag)
                                                }
                                                className="flex size-6 items-center justify-center rounded text-zinc-400 hover:bg-(--danger)/10 hover:text-(--danger)">
                                                ×
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {/* Add row */}
                            <tr>
                                <td className="py-1.5">
                                    <input
                                        type="text"
                                        value={draft}
                                        maxLength={GUILD_TAG_LENGTH}
                                        placeholder="Guild tag"
                                        aria-label="New guild tag"
                                        onChange={event_ => setDraft(event_.target.value)}
                                        onKeyDown={event_ => {
                                            if (event_.key === 'Enter') {
                                                event_.preventDefault();
                                                handleAddDraft();
                                            }
                                        }}
                                        className="w-32 rounded border border-(--input-border) bg-(--card) px-2 py-1 text-sm"
                                    />
                                    {draftInvalid && (
                                        <p className="mt-0.5 text-xs text-(--danger)">
                                            Must be exactly {GUILD_TAG_LENGTH} alphanumeric characters.
                                        </p>
                                    )}
                                    {draftDuplicate && (
                                        <p className="mt-0.5 text-xs text-(--danger)">Already in list.</p>
                                    )}
                                </td>
                                <td className="py-1.5 text-center">
                                    <button
                                        type="button"
                                        aria-label="Add guild tag"
                                        onClick={handleAddDraft}
                                        disabled={!canAddTag(draft, committed, pending)}
                                        className="flex size-6 items-center justify-center rounded border border-(--input-border) text-base leading-none disabled:cursor-not-allowed disabled:opacity-40">
                                        +
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {isPendingDirty && (
                        <div className="max-w-sm rounded border border-(--input-border) bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800">
                            <p className="mb-1 font-semibold text-zinc-700 dark:text-zinc-300">Pending changes:</p>
                            <ul className="list-inside list-disc space-y-0.5 text-(--soft-fg)">
                                {pendingSummary.map(line => (
                                    <li key={line}>{line}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div>
                        <Button intent="primary" isDisabled={!isPendingDirty || isSaving} onPress={handleSave}>
                            {isSaving ? 'Saving…' : 'Save'}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
