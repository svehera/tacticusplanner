import { Dialog, DialogActions, DialogTitle } from '@mui/material';
import MuiButton from '@mui/material/Button';
import { Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { obfuscateUserId } from '@/fsd/5-shared/lib';
import { Button } from '@/fsd/5-shared/ui/button';

import { buildCsv, parseCsvText } from './guild-roster-snapshots.helpers';
import {
    API_KEY_PATTERN,
    getGuildOverridesApi,
    OverrideRow,
    OverridesLoadState,
    PlayerOverride,
    putGuildOverridesApi,
} from './guild-roster-snapshots.models';

interface OverridesTabProps {
    members: string[] | undefined;
}

const inputCls =
    'rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100';
const invalidInputCls = 'rounded border border-red-500 bg-white px-2 py-1 text-sm dark:bg-gray-900 dark:text-gray-100';

export const OverridesTab = ({ members }: OverridesTabProps) => {
    const [loadState, setLoadState] = useState<OverridesLoadState>({ status: 'loading' });
    const [rows, setRows] = useState<OverrideRow[]>([]);
    const [savedRows, setSavedRows] = useState<OverrideRow[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | undefined>();
    const [staleDialogOpen, setStaleDialogOpen] = useState(false);
    const [csvImportStatus, setCsvImportStatus] = useState<string | undefined>();
    const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
    const [pasteText, setPasteText] = useState('');

    const fileInputReference = useRef<HTMLInputElement>(null);

    const fetchOverrides = useCallback(() => {
        setLoadState({ status: 'loading' });
        setRows([]);
        setSavedRows([]);
        setCsvImportStatus(undefined);
        getGuildOverridesApi().then(({ data, error }) => {
            if (error) {
                const message = typeof error === 'string' ? error : (error.message ?? 'Failed to load overrides');
                setLoadState({ status: 'error', message });
            } else if (data) {
                setLoadState({ status: 'loaded', sequenceNumber: data.sequenceNumber });
                const loaded = data.overrides.map(override => ({
                    userId: override.userId,
                    name: override.name,
                    apiKey: override.apiKey ?? '',
                }));
                setRows(loaded);
                setSavedRows(loaded);
            }
        });
    }, []);

    useEffect(() => {
        fetchOverrides();
    }, [fetchOverrides]);

    if (loadState.status === 'loading') {
        return (
            <div className="flex items-center gap-2 py-4">
                <span className="inline-block size-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Loading overrides…</span>
            </div>
        );
    }

    if (loadState.status === 'error') {
        return <p className="text-sm text-red-600 dark:text-red-400">{loadState.message}</p>;
    }

    const { sequenceNumber } = loadState;
    const selectedUserIds = new Set(rows.map(row => row.userId));
    const availableForNew = (members ?? []).filter(id => !selectedUserIds.has(id));

    const updateRow = (index: number, field: keyof OverrideRow, value: string) => {
        setRows(previous => {
            const next = [...previous];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const removeRow = (index: number) => setRows(previous => previous.filter((_, index_) => index_ !== index));

    const addRow = (userId: string) => setRows(previous => [...previous, { userId, name: '', apiKey: '' }]);

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
        const text = await file.text();
        applyImport(text);
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

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(undefined);
        const overrides: PlayerOverride[] = rows.map(row => ({
            userId: row.userId,
            name: row.name,
            ...(row.apiKey ? { apiKey: row.apiKey } : {}),
        }));
        const { data, error } = await putGuildOverridesApi(sequenceNumber, overrides);
        if (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const code = (error as any)?.response?.data?.code as string | undefined;
            if (code === 'BAD_SEQUENCE_NUMBER') {
                setStaleDialogOpen(true);
            } else {
                setSaveError(typeof error === 'string' ? error : (error.message ?? 'Failed to save'));
            }
        } else if (data) {
            setLoadState({ status: 'loaded', sequenceNumber: data.sequenceNumber });
            setSavedRows(rows);
        }
        setIsSaving(false);
    };

    const handleRefresh = () => {
        setStaleDialogOpen(false);
        fetchOverrides();
    };

    const handleRevert = () => {
        setRows(savedRows);
        setCsvImportStatus(undefined);
    };

    const csvPreview = buildCsv(rows);

    return (
        <>
            <div className="flex flex-col gap-4">
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
                    <MuiButton variant="outlined" size="small" onClick={handleRevert}>
                        Revert
                    </MuiButton>
                </div>

                {csvImportStatus && <p className="text-xs text-gray-600 dark:text-gray-400">{csvImportStatus}</p>}

                {/* Table */}
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-gray-300 dark:border-gray-600">
                            <th className="py-2 pr-4 text-left font-semibold">Player</th>
                            <th className="py-2 pr-4 text-left font-semibold">Name</th>
                            <th className="py-2 pr-4 text-left font-semibold">API Key</th>
                            <th className="py-2" />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => {
                            const apiKeyInvalid = row.apiKey.length > 0 && !API_KEY_PATTERN.test(row.apiKey);
                            const otherSelected = new Set(
                                rows.filter((_, index_) => index_ !== index).map(r => r.userId)
                            );
                            const optionsForRow = (members ?? []).filter(id => !otherSelected.has(id));
                            return (
                                <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                                    <td className="py-1 pr-4">
                                        <select
                                            value={row.userId}
                                            onChange={event_ => updateRow(index, 'userId', event_.target.value)}
                                            className={inputCls}>
                                            {!optionsForRow.includes(row.userId) && (
                                                <option value={row.userId}>{obfuscateUserId(row.userId)}</option>
                                            )}
                                            {optionsForRow.map(id => (
                                                <option key={id} value={id}>
                                                    {obfuscateUserId(id)}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="py-1 pr-4">
                                        <input
                                            type="text"
                                            value={row.name}
                                            maxLength={40}
                                            onChange={event_ => updateRow(index, 'name', event_.target.value)}
                                            className={inputCls}
                                        />
                                    </td>
                                    <td className="py-1 pr-4">
                                        <input
                                            type="text"
                                            value={row.apiKey}
                                            onChange={event_ => updateRow(index, 'apiKey', event_.target.value)}
                                            className={apiKeyInvalid ? invalidInputCls : inputCls}
                                        />
                                    </td>
                                    <td className="py-1">
                                        <button
                                            onClick={() => removeRow(index)}
                                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                            aria-label="Remove row">
                                            <Trash2 className="size-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {(availableForNew.length > 0 || members === undefined) && (
                            <tr>
                                <td colSpan={4} className="py-2">
                                    <select
                                        value=""
                                        disabled={availableForNew.length === 0}
                                        onChange={event_ => {
                                            if (event_.target.value) addRow(event_.target.value);
                                        }}
                                        className={inputCls}>
                                        <option value="">
                                            {availableForNew.length === 0
                                                ? '+ Add player… (load members first)'
                                                : '+ Add player…'}
                                        </option>
                                        {availableForNew.map(id => (
                                            <option key={id} value={id}>
                                                {obfuscateUserId(id)}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {saveError && <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>}

                <div>
                    <Button intent="primary" isDisabled={isSaving} onPress={handleSave}>
                        {isSaving ? 'Saving…' : 'Save'}
                    </Button>
                </div>

                {/* Copyable CSV preview */}
                <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Current data as CSV</p>
                    <textarea
                        readOnly
                        value={csvPreview}
                        rows={Math.min(rows.length + 2, 12)}
                        onClick={event_ => (event_.target as HTMLTextAreaElement).select()}
                        className="w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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
                        className="w-full rounded border border-gray-300 bg-white px-2 py-1 font-mono text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
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
