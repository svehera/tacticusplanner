import { cn } from '@/fsd/5-shared/lib';

/**
 * Shared class strings for this page's tables and filters.
 *
 * These live outside `guild-performance.components.tsx` because `react-refresh/only-export-components`
 * forbids non-component exports from a file that exports components — which also matches this repo's
 * rule that only component definitions belong in `.tsx`.
 *
 * Values follow CONVENTIONS.md and `input-guild-roster-snapshots/members-tab.tsx`, the repo's
 * canonical fully-tokenised data table. The density here is deliberately tighter than the rest of
 * the app: these are power-user analytics screens optimised for rows per screen.
 */

/**
 * Row template shared by a `ColumnHeader` and the data rows beneath it.
 *
 * `[&>*]:min-w-0` is load-bearing. Grid items default to `min-width: auto`, so a cell whose
 * content can't shrink — a long unbreakable id, a fixed-width icon row — expands its track past
 * the declared width. Because every row is an independent grid, that widens only the offending
 * row, silently breaking its alignment with the column header and forcing the whole table to
 * scroll. With this, over-long content truncates or clips instead.
 */
export const ROW_BASE = 'items-center gap-x-2.5 px-2.5 py-1 text-xs [&>*]:min-w-0';

/**
 * Applied to each data row; pairs with {@link ROW_BASE}.
 *
 * Alternating backgrounds rather than per-row hairlines: the two are redundant as separation, and
 * on tables wide enough to scroll horizontally a stripe lets you track one row across the scroll
 * where a border cannot. Hover sits at /10 so it reads clearly over both the striped and unstriped
 * rows — at /5 it was invisible against the stripe.
 */
export const ROW_ZEBRA = 'even:bg-(--neutral)/50 hover:bg-(--primary)/10';

/** Convenience for the common case of a data row that needs both. */
export const ROW = cn(ROW_BASE, ROW_ZEBRA);

/**
 * Base for every icon toggle button, matching the `CompFilterBar` treatment on the Overview tab.
 *
 * `inline-flex items-center justify-center` is load-bearing, not decoration: `RarityIcon` renders a
 * bare `<img>` and `UnitShardIcon` an `inline-block`, so without a flex context they sit on the
 * button's text baseline. That leaves descender space beneath the glyph and makes every icon look
 * shifted upward inside its own border.
 */
const ICON_TOGGLE_BASE = 'inline-flex cursor-pointer items-center justify-center border p-0.5 transition-all';

const iconToggleState = (isActive: boolean) =>
    isActive
        ? 'border-(--primary) bg-(--primary)/15 grayscale-0'
        : 'border-(--border) opacity-50 grayscale hover:opacity-100 hover:grayscale-0';

export function iconToggleClass(isActive: boolean): string {
    return cn(ICON_TOGGLE_BASE, 'rounded-lg', iconToggleState(isActive));
}

/** Round variant of {@link iconToggleClass} for portrait toggles (boss / prime / team). */
export function roundIconToggleClass(isActive: boolean): string {
    return cn(ICON_TOGGLE_BASE, 'rounded-full', iconToggleState(isActive));
}
