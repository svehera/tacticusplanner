import { useCallback, useRef, useState } from 'react';

/**
 * Marks a scroll container whose clipped overflow should be expanded during capture.
 *
 * A wide table lives inside `overflow-x-auto`, so only the visible slice is on screen. Capturing
 * the clone with `overflow: visible` and `width: max-content` produces the *whole* table — which is
 * the main reason to have an in-app capture at all rather than an OS screenshot.
 */
export const CAPTURE_EXPAND_ATTRIBUTE = 'data-capture-expand';

/**
 * Marks a node to omit from the capture — the capture button itself, chiefly, which would
 * otherwise appear inside its own screenshot.
 */
export const CAPTURE_IGNORE_ATTRIBUTE = 'data-capture-ignore';

export type CaptureOutcome = 'clipboard' | 'download' | 'failed';

/**
 * Renders a DOM subtree to a PNG, preferring the clipboard and falling back to a download.
 *
 * Uses `modern-screenshot`, which renders via SVG `<foreignObject>` and therefore delegates to the
 * browser's own layout and paint. That matters here: the design tokens are `oklch()` and one cell
 * background is `color-mix(in oklab, …)`, neither of which html2canvas-style libraries can parse —
 * they reimplement CSS colour themselves and render such values wrong or throw.
 *
 * The library is imported lazily so it stays out of the initial bundle; capture is a rare action.
 */
export function useCaptureElement<T extends HTMLElement = HTMLDivElement>(fileName: string) {
    const reference = useRef<T>(null);
    const [isCapturing, setIsCapturing] = useState(false);

    const capture = useCallback(async (): Promise<CaptureOutcome> => {
        const node = reference.current;
        if (node === null) return 'failed';

        setIsCapturing(true);
        try {
            const { domToBlob } = await import('modern-screenshot');

            // Transparent PNGs read as broken against Discord's dark chrome, so paint the page
            // background in explicitly. Resolved rather than passed as `var()` — the value lands in
            // a canvas, not in CSS.
            const backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();

            // The output size has to be passed in, not inferred: `resolveBoundingBox` sizes the
            // foreignObject from the *original* node's bounding box before `onCloneNode` runs, so
            // expanding the clone alone yields an image cropped where the scrollbar was. Measuring
            // the hidden overflow here is what makes the expansion take effect.
            const box = node.getBoundingClientRect();
            let hiddenWidth = 0;
            for (const container of node.querySelectorAll<HTMLElement>(`[${CAPTURE_EXPAND_ATTRIBUTE}]`)) {
                hiddenWidth = Math.max(hiddenWidth, container.scrollWidth - container.clientWidth);
            }

            const blob = await domToBlob(node, {
                width: Math.ceil(box.width + hiddenWidth),
                height: Math.ceil(box.height),
                scale: 2,
                backgroundColor: backgroundColor === '' ? undefined : backgroundColor,
                filter: node => !(node instanceof HTMLElement && node.hasAttribute(CAPTURE_IGNORE_ATTRIBUTE)),
                onCloneNode: clone => {
                    if (!(clone instanceof HTMLElement)) return;
                    clone.style.overflow = 'visible';
                    clone.style.width = 'max-content';
                    const containers = clone.querySelectorAll<HTMLElement>(`[${CAPTURE_EXPAND_ATTRIBUTE}]`);
                    for (const container of containers) {
                        container.style.overflow = 'visible';
                        container.style.width = 'max-content';
                        // An ancestor that clips would undo the expansion — `TableCard` is
                        // `overflow-hidden` for its rounded corners and sits between most capture
                        // roots and their scroll container.
                        for (
                            let element = container.parentElement;
                            element !== null && element !== clone;
                            element = element.parentElement
                        ) {
                            element.style.overflow = 'visible';
                        }
                    }
                },
            });
            if (blob === null) return 'failed';

            const canWriteImage =
                typeof ClipboardItem !== 'undefined' && typeof navigator.clipboard?.write === 'function';
            if (canWriteImage) {
                try {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                    return 'clipboard';
                } catch {
                    // Firefox and some permission states reject image writes — fall through.
                }
            }

            const url = URL.createObjectURL(blob);
            try {
                const link = document.createElement('a');
                link.href = url;
                link.download = `${fileName}.png`;
                link.click();
            } finally {
                URL.revokeObjectURL(url);
            }
            return 'download';
        } catch {
            return 'failed';
        } finally {
            setIsCapturing(false);
        }
    }, [fileName]);

    // Exposed as `ref` because that is how it is consumed in JSX, whatever the lint rule prefers.
    return { ref: reference, capture, isCapturing };
}
