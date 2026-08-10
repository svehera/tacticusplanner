/**
 * Copies text to the clipboard, optionally with an HTML flavour alongside it.
 *
 * When `html` is supplied the write carries both `text/plain` and `text/html`, so pasting into a
 * rich target (Discord, a spreadsheet, a doc) keeps the markup while a plain-text target still
 * gets the text. Falls back to `writeText` where `ClipboardItem` isn't available.
 *
 * Rejects if the browser denies clipboard access — callers should catch.
 */
export async function copyToClipboard(text: string, html?: string): Promise<void> {
    const canWriteRich =
        html !== undefined && typeof navigator.clipboard.write === 'function' && typeof ClipboardItem !== 'undefined';

    await (canWriteRich
        ? navigator.clipboard.write([
              new ClipboardItem({
                  'text/plain': new Blob([text], { type: 'text/plain' }),
                  'text/html': new Blob([html], { type: 'text/html' }),
              }),
          ])
        : navigator.clipboard.writeText(text));
}
