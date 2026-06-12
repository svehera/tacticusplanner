import { Dialog, DialogActions, DialogTitle } from '@mui/material';
import MuiButton from '@mui/material/Button';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getTacticusGuildData, obfuscateUserId, TacticusGuildMember, TacticusGuildRole } from '@/fsd/5-shared/lib';

import { buildCsv, formatTimeAgo, parseCsvText } from './guild-roster-snapshots.helpers';
import {
    API_KEY_PATTERN,
    getGuildOverridesApi,
    MemberState,
    OverrideRow,
    OverridesLoadState,
    PlayerOverride,
    putGuildOverridesApi,
} from './guild-roster-snapshots.models';

// ---------------------------------------------------------------------------
// Module-level session cache — survives page navigations
// ---------------------------------------------------------------------------

interface OverridesCache {
    guildMembers: TacticusGuildMember[];
    savedRows: OverrideRow[];
    sequenceNumber: number;
}

let cache: OverridesCache | undefined;
const writeCache = (value?: OverridesCache): void => {
    cache = value;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<TacticusGuildRole, string> = {
    [TacticusGuildRole.LEADER]: 'Leader',
    [TacticusGuildRole.CO_LEADER]: 'Co-Leader',
    [TacticusGuildRole.OFFICER]: 'Officer',
    [TacticusGuildRole.MEMBER]: 'Member',
};

function roleBadgeClass(role: TacticusGuildRole): string {
    switch (role) {
        case TacticusGuildRole.LEADER: {
            return 'bg-(--primary)/15 text-(--primary) border border-(--primary)/30';
        }
        case TacticusGuildRole.CO_LEADER: {
            return 'bg-(--success)/15 text-(--success) border border-(--success)/30';
        }
        case TacticusGuildRole.OFFICER: {
            return 'bg-(--warning)/15 text-(--warning) border border-(--warning)/30';
        }
        default: {
            return 'bg-(--soft) text-(--soft-fg) border border-(--border)';
        }
    }
}

/** Returns true if the current rows differ (by trimmed name/apiKey) from the saved rows. */
function rowsDiffer(current: OverrideRow[], saved: OverrideRow[]): boolean {
    const toMap = (array: OverrideRow[]) =>
        new Map(array.map(r => [r.userId, { name: r.name.trim(), apiKey: r.apiKey.trim() }]));
    const currentMap = toMap(current);
    const savedMap = toMap(saved);
    const allIds = new Set([...currentMap.keys(), ...savedMap.keys()]);
    for (const id of allIds) {
        const c = currentMap.get(id) ?? { name: '', apiKey: '' };
        const s = savedMap.get(id) ?? { name: '', apiKey: '' };
        if (c.name !== s.name || c.apiKey !== s.apiKey) return true;
    }
    return false;
}

// ---------------------------------------------------------------------------
// Shared input class strings
// ---------------------------------------------------------------------------

const inputCls =
    'w-full rounded border border-(--input-border) bg-(--bg) px-2 py-1 text-sm text-(--fg) focus:border-(--primary) focus:outline-none focus:ring-1 focus:ring-(--ring)';
const invalidInputCls =
    'w-full rounded border border-(--danger) bg-(--bg) px-2 py-1 text-sm text-(--fg) focus:outline-none focus:ring-1 focus:ring-(--danger)/50';
const warningInputCls =
    'w-full rounded border border-(--warning) bg-(--bg) px-2 py-1 text-sm text-(--fg) focus:outline-none focus:ring-1 focus:ring-(--warning)/50';

// Matching grid column template used for both header and data rows.
const COLS = 'grid-cols-[minmax(8rem,1fr)_14rem_7rem_3.5rem_6.5rem_minmax(8rem,1.5fr)_2rem]';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface MembersTabProps {
    memberStates: Map<string, MemberState>;
    rostersLoaded: boolean;
}

export const MembersTab = ({ memberStates, rostersLoaded }: MembersTabProps) => {
    const [guildMembers, setGuildMembers] = useState<TacticusGuildMember[]>(() => cache?.guildMembers ?? []);
    const [loadState, setLoadState] = useState<OverridesLoadState>(() =>
        cache === undefined ? { status: 'loading' } : { status: 'loaded', sequenceNumber: cache.sequenceNumber }
    );
    const [rows, setRows] = useState<OverrideRow[]>(() => cache?.savedRows ?? []);
    const [savedRows, setSavedRows] = useState<OverrideRow[]>(() => cache?.savedRows ?? []);

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | undefined>();
    const [staleDialogOpen, setStaleDialogOpen] = useState(false);
    const [csvImportStatus, setCsvImportStatus] = useState<string | undefined>();
    const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
    const [pasteText, setPasteText] = useState('');

    const fileInputReference = useRef<HTMLInputElement>(null);

    // -----------------------------------------------------------------------
    // Data fetching
    // -----------------------------------------------------------------------

    const fetchAll = useCallback(() => {
        setLoadState({ status: 'loading' });
        setCsvImportStatus(undefined);

        void Promise.all([getTacticusGuildData(), getGuildOverridesApi()]).then(([guildResult, overridesResult]) => {
            if (guildResult.error) {
                const message =
                    typeof guildResult.error === 'string'
                        ? guildResult.error
                        : (guildResult.error.message ?? 'Failed to load guild data');
                setLoadState({ status: 'error', message });
                return;
            }
            if (overridesResult.error) {
                const message =
                    typeof overridesResult.error === 'string'
                        ? overridesResult.error
                        : (overridesResult.error.message ?? 'Failed to load overrides');
                setLoadState({ status: 'error', message });
                return;
            }

            const members = guildResult.data?.guild.members ?? [];
            const overrides = overridesResult.data?.overrides ?? [];
            const seqNumber = overridesResult.data?.sequenceNumber ?? 0;
            const loadedRows = overrides.map(o => ({ userId: o.userId, name: o.name, apiKey: o.apiKey ?? '' }));

            writeCache({ guildMembers: members, savedRows: loadedRows, sequenceNumber: seqNumber });
            setGuildMembers(members);
            setRows(loadedRows);
            setSavedRows(loadedRows);
            setLoadState({ status: 'loaded', sequenceNumber: seqNumber });
        });
    }, []);

    useEffect(() => {
        if (cache === undefined) {
            fetchAll();
        }
    }, [fetchAll]);

    // -----------------------------------------------------------------------
    // Derived state
    // -----------------------------------------------------------------------

    const guildMemberIds = useMemo(() => new Set(guildMembers.map(m => m.userId)), [guildMembers]);

    const overridesByUserId = useMemo(() => new Map(rows.map(r => [r.userId, r])), [rows]);

    const formerRows = useMemo(() => rows.filter(r => !guildMemberIds.has(r.userId)), [rows, guildMemberIds]);

    const hasChanges = useMemo(() => rowsDiffer(rows, savedRows), [rows, savedRows]);

    // -----------------------------------------------------------------------
    // Row mutation helpers
    // -----------------------------------------------------------------------

    const updateOverride = (userId: string, field: 'name' | 'apiKey', value: string) => {
        setRows(previous => {
            const index = previous.findIndex(r => r.userId === userId);
            if (index !== -1) {
                const next = [...previous];
                next[index] = { ...next[index], [field]: value };
                return next;
            }
            return [
                ...previous,
                { userId, name: field === 'name' ? value : '', apiKey: field === 'apiKey' ? value : '' },
            ];
        });
    };

    const clearOverride = (userId: string) => {
        setRows(previous => previous.map(r => (r.userId === userId ? { ...r, name: '', apiKey: '' } : r)));
    };

    const removeFormerMember = (userId: string) => {
        setRows(previous => previous.filter(r => r.userId !== userId));
    };

    // -----------------------------------------------------------------------
    // CSV import/export
    // -----------------------------------------------------------------------

    const applyImport = (text: string) => {
        const { imported, discarded } = parseCsvText(text);
        setRows(imported);
        if (discarded.length === 0) {
            setCsvImportStatus(`Imported ${imported.length} row${imported.length === 1 ? '' : 's'}.`);
        } else {
            setCsvImportStatus(
                `Imported ${imported.length} row${imported.length === 1 ? '' : 's'}. ` +
                    `Discarded ${discarded.length}: ${discarded.join('; ')}`
            );
        }
    };

    const handleLoadCsvFile = async (event_: React.ChangeEvent<HTMLInputElement>) => {
        const file = event_.target.files?.[0];
        if (!file) return;
        applyImport(await file.text());
        event_.target.value = '';
    };

    const handlePasteApply = () => {
        applyImport(pasteText);
        setPasteDialogOpen(false);
        setPasteText('');
    };

    const handleExportCsv = () => {
        const csv = buildCsv(rows);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'guild-overrides.csv';
        anchor.click();
        URL.revokeObjectURL(url);
    };

    // -----------------------------------------------------------------------
    // Save / revert
    // -----------------------------------------------------------------------

    const handleSave = async () => {
        if (loadState.status !== 'loaded') return;
        setIsSaving(true);
        setSaveError(undefined);

        const overrides: PlayerOverride[] = rows
            .filter(r => r.name.trim() !== '' || r.apiKey.trim() !== '')
            .map(r => ({
                userId: r.userId,
                name: r.name.trim(),
                ...(r.apiKey.trim() ? { apiKey: r.apiKey.trim() } : {}),
            }));

        const { data, error } = await putGuildOverridesApi(loadState.sequenceNumber, overrides);
        if (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const code = (error as any)?.response?.data?.code as string | undefined;
            if (code === 'BAD_SEQUENCE_NUMBER') {
                setStaleDialogOpen(true);
            } else {
                setSaveError(typeof error === 'string' ? error : (error.message ?? 'Failed to save'));
            }
        } else if (data) {
            const nextSeq = data.sequenceNumber;
            setLoadState({ status: 'loaded', sequenceNumber: nextSeq });
            setSavedRows(rows);
            if (cache) writeCache({ ...cache, savedRows: rows, sequenceNumber: nextSeq });
        }
        setIsSaving(false);
    };

    const handleRevert = () => {
        setRows(savedRows);
        setCsvImportStatus(undefined);
    };

    const handleRefresh = () => {
        setStaleDialogOpen(false);
        writeCache();
        fetchAll();
    };

    // -----------------------------------------------------------------------
    // Early-return loading / error states
    // -----------------------------------------------------------------------

    if (loadState.status === 'loading') {
        return (
            <div className="flex items-center gap-2 py-4">
                <span className="inline-block size-5 animate-spin rounded-full border-2 border-(--border) border-t-(--primary)" />
                <span className="text-sm text-(--soft-fg)">Loading guild data…</span>
            </div>
        );
    }

    if (loadState.status === 'error') {
        return <p className="text-sm text-(--danger)">{loadState.message}</p>;
    }

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    const csvPreview = buildCsv(rows);

    return (
        <>
            <div className="flex flex-col gap-5">
                {/* Toolbar */}
                <div className="flex flex-wrap gap-2">
                    <input
                        ref={fileInputReference}
                        type="file"
                        accept=".csv,text/csv,text/plain"
                        className="hidden"
                        onChange={handleLoadCsvFile}
                    />
                    <MuiButton variant="outlined" size="small" onClick={() => fileInputReference.current?.click()}>
                        Load CSV
                    </MuiButton>
                    <MuiButton
                        variant="outlined"
                        size="small"
                        onClick={() => {
                            setPasteText('');
                            setPasteDialogOpen(true);
                        }}>
                        Paste CSV
                    </MuiButton>
                    <MuiButton variant="outlined" size="small" onClick={handleExportCsv}>
                        Export CSV
                    </MuiButton>
                    <MuiButton variant="outlined" size="small" onClick={handleRevert} disabled={!hasChanges}>
                        Revert
                    </MuiButton>
                    <MuiButton
                        variant="outlined"
                        size="small"
                        onClick={() => void handleSave()}
                        disabled={!hasChanges || isSaving}>
                        {isSaving ? 'Saving…' : 'Save'}
                    </MuiButton>
                </div>

                {csvImportStatus && <p className="text-xs text-(--soft-fg)">{csvImportStatus}</p>}
                {saveError && <p className="text-sm text-(--danger)">{saveError}</p>}

                {!rostersLoaded && (
                    <div className="flex items-center gap-2 rounded-lg border border-(--warning)/50 bg-(--warning)/10 px-3 py-2 text-sm text-(--warning)">
                        <AlertTriangle className="size-4 shrink-0" />
                        <span>
                            Load the <strong>Rosters</strong> tab to see which players are already sharing their name
                            and API key — overrides entered for those players will be highlighted.
                        </span>
                    </div>
                )}

                {/* Member grid */}
                <div className="overflow-x-auto rounded-xl border border-(--border)">
                    <div className="min-w-[780px]">
                        {/* Header */}
                        <div className={`grid ${COLS} gap-x-3 border-b border-(--border) bg-(--soft) px-3 py-2`}>
                            <span className="text-xs font-bold tracking-widest text-(--soft-fg) uppercase">Name</span>
                            <span className="text-xs font-bold tracking-widest text-(--soft-fg) uppercase">
                                User ID
                            </span>
                            <span className="text-xs font-bold tracking-widest text-(--soft-fg) uppercase">Role</span>
                            <span className="text-xs font-bold tracking-widest text-(--soft-fg) uppercase">Lvl</span>
                            <span className="text-xs font-bold tracking-widest text-(--soft-fg) uppercase">
                                Last Active
                            </span>
                            <span className="text-xs font-bold tracking-widest text-(--soft-fg) uppercase">
                                API Key
                            </span>
                            <span />
                        </div>

                        {/* Data rows */}
                        {guildMembers.length === 0 ? (
                            <div className="px-3 py-6 text-center text-sm text-(--soft-fg)">
                                No guild members found.
                            </div>
                        ) : (
                            guildMembers.map(member => {
                                const override = overridesByUserId.get(member.userId);
                                const name = override?.name ?? '';
                                const apiKey = override?.apiKey ?? '';
                                const apiKeyInvalid = apiKey.length > 0 && !API_KEY_PATTERN.test(apiKey);
                                const canClear = name !== '' || apiKey !== '';

                                const memberState = memberStates.get(member.userId);
                                const hasVolunteeredName =
                                    memberState?.status === 'name-only' || memberState?.status === 'success';
                                const hasVolunteeredApiKey = memberState?.status === 'success';
                                const volunteeredName =
                                    hasVolunteeredName && memberState && 'playerName' in memberState
                                        ? memberState.playerName
                                        : undefined;

                                const nameInputCls = name !== '' && hasVolunteeredName ? warningInputCls : inputCls;
                                const apiKeyInputCls =
                                    apiKey !== '' && hasVolunteeredApiKey
                                        ? warningInputCls
                                        : apiKeyInvalid
                                          ? invalidInputCls
                                          : inputCls;

                                return (
                                    <div
                                        key={member.userId}
                                        className={`grid ${COLS} items-center gap-x-3 border-b border-(--border) px-3 py-2 last:border-b-0 hover:bg-(--primary)/5`}>
                                        <input
                                            type="text"
                                            value={name}
                                            maxLength={40}
                                            placeholder={volunteeredName ? `${volunteeredName} (shared)` : '—'}
                                            title={
                                                name !== '' && hasVolunteeredName
                                                    ? 'This player is already sharing their name'
                                                    : undefined
                                            }
                                            onChange={event_ =>
                                                updateOverride(member.userId, 'name', event_.target.value)
                                            }
                                            className={nameInputCls}
                                        />
                                        <span
                                            title={obfuscateUserId(member.userId)}
                                            className="truncate font-mono text-xs text-(--soft-fg)">
                                            {obfuscateUserId(member.userId)}
                                        </span>
                                        <span
                                            className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${roleBadgeClass(member.role)}`}>
                                            {ROLE_LABELS[member.role]}
                                        </span>
                                        <span className="text-sm text-(--fg) tabular-nums">{member.level}</span>
                                        <span className="text-xs text-(--soft-fg)">
                                            {formatTimeAgo(member.lastActivityOn)}
                                        </span>
                                        <input
                                            type="text"
                                            value={apiKey}
                                            placeholder={hasVolunteeredApiKey ? '(shared)' : '—'}
                                            title={
                                                apiKey !== '' && hasVolunteeredApiKey
                                                    ? 'This player is already sharing their API key'
                                                    : undefined
                                            }
                                            onChange={event_ =>
                                                updateOverride(member.userId, 'apiKey', event_.target.value)
                                            }
                                            className={apiKeyInputCls}
                                        />
                                        <button
                                            onClick={() => clearOverride(member.userId)}
                                            disabled={!canClear}
                                            className="rounded p-0.5 text-(--soft-fg) transition-colors hover:bg-(--danger)/10 hover:text-(--danger) disabled:cursor-not-allowed disabled:opacity-30"
                                            aria-label="Clear name and API key">
                                            <X className="size-3.5" />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Former guild members */}
                {formerRows.length > 0 && (
                    <section className="space-y-3">
                        <h3 className="text-xs font-bold tracking-widest text-(--soft-fg) uppercase">
                            Former Guild Members
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {formerRows.map(row => (
                                <div
                                    key={row.userId}
                                    className="flex items-center gap-1.5 rounded-full border border-(--border) bg-(--soft) px-2.5 py-1 text-xs text-(--soft-fg)">
                                    <span className="font-mono">
                                        {obfuscateUserId(row.userId)}
                                        {row.name ? ` · ${row.name}` : ''}
                                    </span>
                                    <button
                                        onClick={() => removeFormerMember(row.userId)}
                                        className="rounded-full p-0.5 transition-colors hover:bg-(--danger)/10 hover:text-(--danger)"
                                        aria-label={`Remove ${row.name || obfuscateUserId(row.userId)}`}>
                                        <Trash2 className="size-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Copyable CSV preview */}
                <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold text-(--soft-fg)">Current data as CSV</p>
                    <textarea
                        readOnly
                        value={csvPreview}
                        rows={Math.min(rows.length + 2, 12)}
                        onClick={event_ => (event_.target as HTMLTextAreaElement).select()}
                        className="w-full rounded border border-(--border) bg-(--soft) px-2 py-1 font-mono text-xs text-(--fg)"
                    />
                </div>
            </div>

            {/* Paste CSV dialog */}
            <Dialog open={pasteDialogOpen} onClose={() => setPasteDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Paste CSV</DialogTitle>
                <div className="px-6 pb-2">
                    <textarea
                        autoFocus
                        value={pasteText}
                        onChange={event_ => setPasteText(event_.target.value)}
                        rows={10}
                        placeholder={'userId,name,apiKey\nuser123,Alice,key-abc'}
                        className="w-full rounded border border-(--border) bg-(--bg) px-2 py-1 font-mono text-sm text-(--fg)"
                    />
                </div>
                <DialogActions>
                    <MuiButton onClick={() => setPasteDialogOpen(false)}>Cancel</MuiButton>
                    <MuiButton variant="contained" onClick={handlePasteApply} disabled={!pasteText.trim()}>
                        Load
                    </MuiButton>
                </DialogActions>
            </Dialog>

            {/* Stale data dialog */}
            <Dialog open={staleDialogOpen} onClose={() => setStaleDialogOpen(false)}>
                <DialogTitle>Stale data. What would you like to do?</DialogTitle>
                <DialogActions>
                    <MuiButton onClick={() => setStaleDialogOpen(false)}>Nothing</MuiButton>
                    <MuiButton color="error" onClick={handleRefresh}>
                        Refresh, Changes Will Be Lost
                    </MuiButton>
                </DialogActions>
            </Dialog>
        </>
    );
};
