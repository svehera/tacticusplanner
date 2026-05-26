import { cn } from '@/fsd/5-shared/lib';

// ─── trigger ─────────────────────────────────────────────────────────────────

const triggerBase = [
    'relative flex w-full cursor-pointer items-center rounded-lg border border-(--input)',
    'bg-(--bg) pr-10 pl-3 text-left text-(--fg) shadow-sm',
    'transition-all hover:border-(--primary) focus:ring-2 focus:ring-(--ring) focus:outline-none',
].join(' ');

export const triggerSingle = cn(triggerBase, 'h-10');

export const triggerMulti = cn(triggerBase, 'min-h-10 py-1');

export function triggerDisabled(base: string, disabled?: boolean): string {
    return disabled ? cn(base, 'cursor-not-allowed opacity-50 hover:border-(--input)') : base;
}

// ─── dropdown panel ──────────────────────────────────────────────────────────

// Panel with anchor positioning (used by Select/SelectMulti Listbox)
export const panel = [
    'z-50 mt-2 max-h-[min(60vh,24rem)] w-[var(--button-width)]',
    'overflow-y-auto overscroll-contain rounded-lg border border-(--border)',
    'bg-(--overlay) py-1 shadow-xl',
    'transition duration-100 ease-in data-leave:opacity-0',
].join(' ');

// Panel with absolute positioning (used by ComboBox/ComboBoxMulti)
export const panelAbsolute = [
    'absolute z-50 mt-2 max-h-[min(60vh,24rem)] w-full',
    'overflow-y-auto overscroll-contain rounded-lg border border-(--border)',
    'bg-(--overlay) py-1 shadow-xl',
    'transition duration-100 ease-in data-leave:opacity-0',
].join(' ');

// ─── option row ──────────────────────────────────────────────────────────────

const optionBase = 'relative cursor-pointer py-2 pr-4 pl-10 text-(--fg) transition-colors select-none';
const optionFocus = 'bg-(--primary)/10 text-(--primary)';

export function optionClassName({ focus }: { focus: boolean }): string {
    return cn(optionBase, focus && optionFocus);
}

// ─── check icon ──────────────────────────────────────────────────────────────

export const checkIconClass = 'absolute inset-y-0 left-0 flex items-center pl-3 text-(--primary)';

// ─── chevron ─────────────────────────────────────────────────────────────────

export const chevronClass = 'pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2';

// ─── label ───────────────────────────────────────────────────────────────────

export const labelClass = 'mb-2 block text-sm font-medium text-(--soft-fg)';
