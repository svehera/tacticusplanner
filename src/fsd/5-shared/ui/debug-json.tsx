import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { enqueueSnackbar } from 'notistack';

export const DebugJson = ({ label, value }: { label: string; value: unknown }) => {
    const debugEnabled = localStorage.getItem('debugMode') === 'true';
    const text = JSON.stringify(value, undefined, 2);
    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(_ => enqueueSnackbar('Copied', { variant: 'success' }));
    };
    if (!debugEnabled) return <></>;
    return (
        <details className="rounded border border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950">
            <summary className="flex cursor-pointer items-center gap-2 px-3 py-1 text-xs font-semibold text-yellow-800 dark:text-yellow-200">
                <span className="grow">[DEBUG] {label}</span>
                <button
                    type="button"
                    title="Copy to clipboard"
                    onClick={event => {
                        event.preventDefault();
                        handleCopy();
                    }}
                    className="rounded p-0.5 hover:bg-yellow-200 dark:hover:bg-yellow-800">
                    <ContentCopyIcon fontSize="inherit" />
                </button>
            </summary>
            <pre className="max-h-96 overflow-auto px-3 py-2 text-xs text-yellow-900 dark:text-yellow-100">{text}</pre>
        </details>
    );
};
