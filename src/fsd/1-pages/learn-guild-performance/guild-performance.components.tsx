/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { Camera, ChevronDown, Minus, Plus } from 'lucide-react';
import { type ReactNode } from 'react';

import { CAPTURE_EXPAND_ATTRIBUTE, CAPTURE_IGNORE_ATTRIBUTE, cn } from '@/fsd/5-shared/lib';
import { Rarity } from '@/fsd/5-shared/model';
import { Button, Select } from '@/fsd/5-shared/ui';
import { RarityIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character/characters.service';
import { unitRoundIconMap } from '@/fsd/4-entities/guild_boss/guild-boss-portraits';
import { MowsService } from '@/fsd/4-entities/mow/mows.service';

import { iconToggleClass, roundIconToggleClass } from './guild-performance.styles';
import { unitDisplayLabel } from './guild-performance.utils';

// ---------------------------------------------------------------------------
// Season / Player selects (shared across tabs, owned by the page)
// ---------------------------------------------------------------------------

/**
 * Micro-label above the field, plus an explanation when the active tab ignores this selection.
 *
 * The shared `Select` can't express "inert but explained" on its own — it hard-codes its
 * placeholder styling, only shows a placeholder when the value is `undefined`, and spreads no props
 * onto its trigger, so there's no `title` to hang a reason off. Hence a dimming `triggerClassName`
 * plus a note beside the label.
 */
const SelectLabel = ({ label, isIgnored }: { label: string; isIgnored?: boolean }) => (
    <span className="flex items-baseline gap-1.5">
        <span className="text-[10px] font-bold tracking-[.14em] text-(--soft-fg) uppercase">{label}</span>
        {isIgnored === true && <span className="text-[10px] text-(--soft-fg)">not used here</span>}
    </span>
);

/** Dims the trigger so an ignored select still reads as present but inactive. */
const ignoredTriggerClass = (isIgnored?: boolean) => (isIgnored === true ? 'text-(--fg)/45' : undefined);

export const SeasonSelect = ({
    seasons,
    value,
    onChange,
    seasonStatusLabel,
    disabled,
}: {
    seasons: number[];
    value: number | undefined;
    onChange: (season: number) => void;
    /** Optional label appended to an option, e.g. "not aggregated" or "error". */
    seasonStatusLabel?: (season: number) => string | undefined;
    /** Shown dimmed, with a "not used here" note, on tabs that ignore the season selection. */
    disabled?: boolean;
}) => (
    <label className="flex flex-col gap-0.5 text-xs">
        <SelectLabel label="Season" isIgnored={disabled} />
        <Select<number>
            options={seasons}
            value={value as number}
            onChange={onChange}
            disabled={disabled}
            placeholder="Season"
            // Fixed width only once there is room for it. Below `md` the field fills whatever share
            // of the row its label is given, so Season and Player sit side by side on a phone
            // instead of each holding out for 160px/224px and wrapping onto two rows.
            className="md:w-40"
            triggerClassName={ignoredTriggerClass(disabled)}
            renderValue={season => <span>Season {season}</span>}
            renderOption={season => {
                const statusLabel = seasonStatusLabel?.(season);
                return <span>{statusLabel ? `Season ${season} (${statusLabel})` : `Season ${season}`}</span>;
            }}
        />
    </label>
);

/** Sentinel option representing "no player filter"; empty userId maps back to `undefined`. */
const ALL_PLAYERS_OPTION = { userId: '', displayName: 'All players' };

export const PlayerSelect = ({
    players,
    value,
    onChange,
    disabled,
}: {
    players: { userId: string; displayName: string }[];
    value: string | undefined;
    onChange: (userId: string | undefined) => void;
    /** Shown dimmed, with a "not used here" note, on tabs that ignore the player selection. */
    disabled?: boolean;
}) => {
    const options = [ALL_PLAYERS_OPTION, ...players];
    const selected = options.find(player => player.userId === (value ?? '')) ?? ALL_PLAYERS_OPTION;
    return (
        <label className="flex flex-col gap-0.5 text-xs">
            <SelectLabel label="Player" isIgnored={disabled} />
            <Select
                options={options}
                value={selected}
                by={(a, z) => a.userId === z.userId}
                onChange={player => {
                    onChange(player.userId === '' ? undefined : player.userId);
                }}
                disabled={disabled}
                className="md:w-56"
                triggerClassName={ignoredTriggerClass(disabled)}
                renderValue={player => <span className="truncate">{player.displayName}</span>}
                renderOption={player => <span>{player.displayName}</span>}
            />
        </label>
    );
};

// ---------------------------------------------------------------------------
// NoKeyMessage
// ---------------------------------------------------------------------------

export const NoKeyMessage = () => (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
        <p className="max-w-prose text-base">
            This page is only available to guild leaders. If you are a guild leader, please obtain a guild API key from{' '}
            <a
                href="https://api.tacticusgame.com"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-(--primary) underline hover:text-(--primary)/80">
                https://api.tacticusgame.com
            </a>{' '}
            and register it in the user menu.
        </p>
    </div>
);

export { DebugJson } from '@/fsd/5-shared/ui';

// ---------------------------------------------------------------------------
// Layout primitives
//
// Page-local on purpose — these encode this page's density, which is tighter
// than the rest of the app. Promote to `5-shared/ui` only if a second page
// needs them. Class strings follow CONVENTIONS.md and `members-tab.tsx`, the
// repo's canonical fully-tokenised data table.
// ---------------------------------------------------------------------------

/** Section title with a rule filling the remaining width and optional right-aligned meta. */
export const SectionHeader = ({
    title,
    note,
    meta,
    icon,
    isOpen,
    onToggle,
    bodyId,
}: {
    title: string;
    /** Muted clarifier sitting beside the title — where a heading's small grey span belongs. */
    note?: ReactNode;
    meta?: ReactNode;
    icon?: ReactNode;
    /** Pass all three to make the header a disclosure control for its section body. */
    isOpen?: boolean;
    onToggle?: () => void;
    bodyId?: string;
}) => (
    <div className="flex items-center gap-2.5">
        {icon}
        {/* Only a button when it actually toggles something, so a plain header stays a plain header
            rather than an interactive-looking element that does nothing. */}
        {onToggle === undefined ? (
            <span className="text-sm font-extrabold text-(--fg)">{title}</span>
        ) : (
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={isOpen}
                aria-controls={bodyId}
                className="flex cursor-pointer items-center gap-1.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ring)">
                <ChevronDown
                    aria-hidden="true"
                    className={cn(
                        'size-4 shrink-0 text-(--soft-fg) transition-transform',
                        isOpen === true || '-rotate-90'
                    )}
                />
                <span className="text-sm font-extrabold text-(--fg)">{title}</span>
            </button>
        )}
        {note !== undefined && <span className="text-xs text-(--soft-fg)">{note}</span>}
        <span className="h-px min-w-5 flex-1 bg-(--border)" />
        {/* div, not span — meta often holds a flex row (a legend, a control cluster). */}
        {meta !== undefined && <div className="text-xs text-(--soft-fg)">{meta}</div>}
    </div>
);

/** `ref` is forwarded so a section can be handed to {@link useCaptureElement} for a PNG export. */
export const TableCard = ({
    children,
    className,
    id,
    ref,
}: {
    children: ReactNode;
    className?: string;
    /** Target for a disclosure header's `aria-controls`. */
    id?: string;
    ref?: React.Ref<HTMLDivElement>;
}) => (
    <div
        ref={ref}
        id={id}
        className={cn('overflow-hidden rounded-xl border border-(--card-border) bg-(--card)', className)}>
        {children}
    </div>
);

/**
 * Camera button for exporting a section as a PNG. Lives in a card or section header; the matching
 * `ref` from {@link useCaptureElement} goes on the element to be captured.
 */
export const CaptureButton = ({ onCapture, isCapturing }: { onCapture: () => void; isCapturing: boolean }) => (
    <button
        type="button"
        title="Copy this section as an image"
        aria-label="Copy this section as an image"
        disabled={isCapturing}
        onClick={onCapture}
        {...{ [CAPTURE_IGNORE_ATTRIBUTE]: '' }}
        className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-(--border) px-1.5 py-0.5 text-[11px] font-semibold text-(--soft-fg) transition-colors hover:border-(--primary)/50 hover:bg-(--primary)/10 hover:text-(--primary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ring) disabled:cursor-not-allowed disabled:opacity-50">
        <Camera className="size-3" />
        {isCapturing ? 'Copying…' : 'Image'}
    </button>
);

export const TableCardHeader = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div
        className={cn(
            'flex flex-wrap items-center gap-2.5 border-b border-(--border) bg-(--soft) px-3 py-2',
            className
        )}>
        {children}
    </div>
);

export type ColumnLabel = string | { text: string; align?: 'center' | 'right'; span?: 2 | 3 };

/** Literal so Tailwind's JIT can see them; `span` values are constrained to match. */
const COL_SPAN = { 2: 'col-span-2', 3: 'col-span-3' } as const;

/**
 * Header row for a CSS-grid table. Every table on this page gets one — several had none.
 *
 * `role="row"` + `role="columnheader"`: these tables are CSS grid rather than `<table>` because the
 * cells need to be flex columns, which means the row/column association assistive tech gets for free
 * from a real table has to be restored with roles. Every consumer must therefore sit inside an
 * element with `role="table"`.
 */
export const ColumnHeader = ({ cols, labels }: { cols: string; labels: ColumnLabel[] }) => (
    <div
        role="row"
        className={cn(
            'grid',
            cols,
            // Mirrors ROW_BASE so the header's tracks resolve identically to the rows'.
            'items-center gap-x-2.5 border-b border-(--border) bg-(--soft) px-2.5 py-1.5 [&>*]:min-w-0'
        )}>
        {labels.map((label, index) => {
            const { text, align, span } = typeof label === 'string' ? { text: label } : label;
            return (
                <span
                    role="columnheader"
                    key={index}
                    className={cn(
                        'truncate text-xs font-bold tracking-widest text-(--soft-fg) uppercase',
                        align === 'right' && 'text-right',
                        align === 'center' && 'text-center',
                        // Icon-sized tracks (20-34px) cannot hold a word, so adjacent ones share
                        // a single label rather than each getting an unreadable, clipped one.
                        span !== undefined && COL_SPAN[span]
                    )}>
                    {text}
                </span>
            );
        })}
    </div>
);

/**
 * Phone strategy for wide tables: keep the table's shape and scroll it, rather than reflowing
 * rows into stacked cards. `minWidth` is an inline style because it is parameterised at runtime,
 * which Tailwind's JIT cannot generate an arbitrary class for.
 */
export const ScrollX = ({ minWidth, children }: { minWidth: number; children: ReactNode }) => (
    // The attribute lets a PNG capture expand this container in its clone, so the export contains
    // the whole table rather than just the slice currently scrolled into view.
    <div className="overflow-x-auto" {...{ [CAPTURE_EXPAND_ATTRIBUTE]: '' }}>
        <div style={{ minWidth }}>{children}</div>
    </div>
);

/**
 * Auto-fitting card grid: two-up on desktop, one-up on phone. The `min()` is load-bearing — a
 * bare `minmax(430px,1fr)` floor cannot shrink below 430px and clips inside a phone's content
 * area. Class strings are literal (not templated) so Tailwind's JIT can see them.
 */
const CARD_GRID_COLS = {
    148: 'grid-cols-[repeat(auto-fit,minmax(min(148px,100%),1fr))]',
    255: 'grid-cols-[repeat(auto-fit,minmax(min(255px,100%),1fr))]',
    /** Five-up at 1920 in either sidebar state — see {@link SeasonCards}. */
    300: 'grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))]',
    320: 'grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))]',
    430: 'grid-cols-[repeat(auto-fit,minmax(min(430px,100%),1fr))]',
} as const;

export const CardGrid = ({
    min = 430,
    gap = 'gap-3',
    align = 'start',
    children,
    ref,
}: {
    min?: keyof typeof CARD_GRID_COLS;
    gap?: string;
    /** `stretch` matches every card in a row to the tallest one; `start` (default) sizes to content. */
    align?: 'start' | 'stretch';
    children: ReactNode;
    /** Forwarded so a tile group can be handed to {@link useCaptureElement}. */
    ref?: React.Ref<HTMLDivElement>;
}) => (
    <div
        ref={ref}
        className={cn('grid', align === 'start' ? 'items-start' : 'items-stretch', gap, CARD_GRID_COLS[min])}>
        {children}
    </div>
);

/** One bordered container holding all of a tab's filter groups. */
export const FilterBar = ({ children, header }: { children: ReactNode; header?: ReactNode }) => (
    <div className="overflow-hidden rounded-xl border border-(--border) bg-(--overlay)">
        {header !== undefined && (
            <div className="flex items-center gap-3 border-b border-(--border) px-3 py-1.5">{header}</div>
        )}
        <div className="flex flex-wrap items-end gap-4 px-3 py-2.5">{children}</div>
    </div>
);

export const FilterGroup = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold tracking-[.14em] text-(--soft-fg) uppercase">{label}</span>
        <div className="flex flex-wrap items-center gap-1">{children}</div>
    </div>
);

const ALL_RARITIES: Rarity[] = [
    Rarity.Common,
    Rarity.Uncommon,
    Rarity.Rare,
    Rarity.Epic,
    Rarity.Legendary,
    Rarity.Mythic,
];

/**
 * Rarity icon toggles. The last selected rarity cannot be deselected — an empty rarity set would
 * blank every table on the tab. Shared by the Damage, Leaderboard and Performance tabs, which each
 * had their own identical copy.
 */
export const RarityFilter = ({
    selected,
    onChange,
    available,
}: {
    selected: Rarity[];
    onChange: (rarities: Rarity[]) => void;
    /**
     * Rarities present in the data. Without it all six render, and in a late season the four below
     * Legendary are permanently greyed controls that can never do anything.
     */
    available?: Rarity[];
}) => (
    <FilterGroup label="Rarity">
        {(available === undefined ? ALL_RARITIES : ALL_RARITIES.filter(r => available.includes(r))).map(rarity => {
            const isActive = selected.includes(rarity);
            return (
                <button
                    key={rarity}
                    type="button"
                    title={Rarity[rarity]}
                    onClick={() => {
                        if (isActive && selected.length === 1) return;
                        onChange(isActive ? selected.filter(x => x !== rarity) : [...selected, rarity]);
                    }}
                    className={iconToggleClass(isActive)}>
                    <RarityIcon rarity={rarity} />
                </button>
            );
        })}
    </FilterGroup>
);

/**
 * Portrait toggles for a list of boss/prime options. Generic over the option type: bosses pass a
 * `BossFilterOption` (keyed by its `key`, distinct per boss slot), primes pass their bare unitId
 * string (keyed by itself).
 *
 * `allowEmpty` distinguishes the two behaviours the tabs need: Damage and Leaderboard filter *down*
 * from everything, so emptying the set would blank the tab and the last one is locked. Performance
 * treats primes as an opt-in additive set that legitimately starts and stays empty.
 */
export const PrefixFilter = <T,>({
    label,
    available,
    getKey,
    selected,
    onChange,
    iconFor,
    allowEmpty = false,
}: {
    label: string;
    available: T[];
    getKey: (option: T) => string;
    selected: string[];
    onChange: (keys: string[]) => void;
    iconFor: (option: T) => { icon: string | undefined; name: string };
    allowEmpty?: boolean;
}) => {
    if (available.length === 0) return <></>;
    return (
        <FilterGroup label={label}>
            {available.map(option => {
                const key = getKey(option);
                const isActive = selected.includes(key);
                const { icon, name } = iconFor(option);
                return (
                    <button
                        key={key}
                        type="button"
                        aria-label={name}
                        onClick={() => {
                            if (!allowEmpty && isActive && selected.length === 1) return;
                            onChange(isActive ? selected.filter(k => k !== key) : [...selected, key]);
                        }}
                        className={roundIconToggleClass(isActive)}>
                        {icon === undefined ? (
                            <span className="px-1 text-xs">{name}</span>
                        ) : (
                            <UnitShardIcon icon={icon} name={name} tooltip={name} width={24} height={24} />
                        )}
                    </button>
                );
            })}
        </FilterGroup>
    );
};

/**
 * Single stat tile — label, big value, caption, optional mini bar.
 *
 * Lives here because Overview and Loops both use it; a second copy would let the two tile strips on
 * one page drift apart. `text-[22px]` is below the doc's type scale but is what Overview shipped
 * with, and matching it beats a 2px correction that silently restyles a live tab.
 */
export const ReadinessTile = ({
    label,
    value,
    caption,
    valueClass = 'text-(--fg)',
    barPct,
    barClass,
}: {
    label: string;
    value: string;
    caption?: string;
    valueClass?: string;
    barPct?: number;
    barClass?: string;
}) => (
    <div className="rounded-lg border border-(--card-border) bg-(--card) px-2.5 py-2.5">
        <span className="text-[10px] font-bold tracking-[.1em] text-(--soft-fg) uppercase">{label}</span>
        <p className={`text-[22px] leading-tight font-extrabold tabular-nums ${valueClass}`}>{value}</p>
        {caption !== undefined && <p className="text-xs text-(--soft-fg)">{caption}</p>}
        {barPct !== undefined && (
            <div className="mt-1 h-[5px] overflow-hidden rounded-full bg-(--fg)/12">
                <div className={`h-full ${barClass ?? 'bg-(--warning)'}`} style={{ width: `${barPct}%` }} />
            </div>
        )}
    </div>
);

/** Rarity → the shared `--rarity-*` token, for the ring drawn around a boss/prime portrait. */
const RARITY_RING_CLASS: Record<Rarity, string> = {
    [Rarity.Common]: 'ring-(--rarity-common)',
    [Rarity.Uncommon]: 'ring-(--rarity-uncommon)',
    [Rarity.Rare]: 'ring-(--rarity-rare)',
    [Rarity.Epic]: 'ring-(--rarity-epic)',
    [Rarity.Legendary]: 'ring-(--rarity-legendary)',
    [Rarity.Mythic]: 'ring-(--rarity-mythic)',
};

/**
 * Portrait for a boss or prime, labelled with its display name.
 *
 * `unitDisplayLabel` names both cases — family name for a boss, character short name for a prime —
 * so a portrait never falls back to showing its raw `unitId` (`GuildBoss9Boss1ThousMagnus`).
 *
 * `undefined` renders an empty box of the same size, so the Loops ladder header keeps its column
 * alignment when a boss has no second prime.
 *
 * `tooltip` overrides the label for callers that need to say more than the name — the Loops ladder
 * uses it to mark a prime as optional. Pass it here rather than wrapping this in a `title` element:
 * a native `title` around a component that already renders a tooltip shows both on one hover.
 *
 * `rarity`, when passed, draws a ring around the portrait in that rarity's color — the portrait's
 * own wreath frame is a fixed asset with no per-rarity art, so this is a CSS ring layered on top of
 * it rather than a swapped image.
 */
export const EncounterIcon = ({
    unitId,
    size = 28,
    tooltip,
    rarity,
}: {
    unitId: string | undefined;
    size?: number;
    tooltip?: string;
    rarity?: Rarity;
}) => {
    if (unitId === undefined) return <div style={{ width: size, height: size }} />;

    const label = tooltip ?? unitDisplayLabel(unitId);
    const ringClass = rarity === undefined ? undefined : `rounded-full ring-2 ${RARITY_RING_CLASS[rarity]}`;

    const mappedIcon = unitRoundIconMap[unitId];
    if (mappedIcon !== undefined) {
        return (
            <span className={ringClass}>
                <UnitShardIcon icon={mappedIcon} name={label} tooltip={label} width={size} height={size} />
            </span>
        );
    }

    const match = /(?:MiniBoss|Minion)\d+(.+)/.exec(unitId);
    if (match) {
        const id = match[1].charAt(0).toLowerCase() + match[1].slice(1);
        const character = CharactersService.getUnit(id);
        if (character) {
            return (
                <span className={ringClass}>
                    <UnitShardIcon
                        icon={character.roundIcon ?? ''}
                        name={character.name}
                        tooltip={label}
                        width={size}
                        height={size}
                    />
                </span>
            );
        }
    }

    return (
        <span className="inline-block truncate text-xs text-(--soft-fg)" style={{ width: size }} title={unitId}>
            {unitId.slice(-6)}
        </span>
    );
};

/** `−` / value / `+`, replacing the number inputs. Clamps to [min, max] like they did. */
export const Stepper = ({
    value,
    min,
    max,
    onChange,
}: {
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
}) => {
    const step = (delta: number) => {
        onChange(Math.max(min, Math.min(max, value + delta)));
    };
    return (
        <div className="flex items-center gap-1">
            <Button
                size="square-petite"
                appearance="outline"
                intent="secondary"
                aria-label="Decrease"
                isDisabled={value <= min}
                onPress={() => {
                    step(-1);
                }}>
                <Minus data-slot="icon" className="size-3" />
            </Button>
            <span className="min-w-[1.75rem] text-center text-xs font-bold tabular-nums">{value}</span>
            <Button
                size="square-petite"
                appearance="outline"
                intent="secondary"
                aria-label="Increase"
                isDisabled={value >= max}
                onPress={() => {
                    step(1);
                }}>
                <Plus data-slot="icon" className="size-3" />
            </Button>
        </div>
    );
};

// ---------------------------------------------------------------------------
// CompIcons
// ---------------------------------------------------------------------------

/** Resolves a comp unitId to its portrait, trying character then machine-of-war. */
function resolveCompIcon(unitId: string): { icon: string; name: string } | undefined {
    const character = CharactersService.getUnit(unitId);
    if (character !== undefined) return { icon: character.roundIcon ?? '', name: character.name };
    const mow = MowsService.resolveToStatic(unitId);
    if (mow !== undefined) return { icon: mow.roundIcon ?? '', name: mow.name };
    return;
}

/**
 * Renders comp portraits from a flat unitId list (heroes then MoW), resolving each id's type.
 *
 * A full comp is 5 heroes + 1 MoW = 6 icons, which at the default size is 6×22 + 5×2 = 142px.
 * Callers must size the containing track for that. `overflow-hidden` is the safety net: paired
 * with the `min-w-0` in ROW_BASE it clips a longer-than-expected comp rather than spilling across
 * the neighbouring column.
 */
export function CompIcons({ comp, size = 22 }: { comp: string[]; size?: number }) {
    return (
        <span className="flex min-w-0 items-center gap-0.5 overflow-hidden">
            {comp.flatMap((unitId, index) => {
                const resolved = resolveCompIcon(unitId);
                if (resolved === undefined) return [];
                return [
                    <UnitShardIcon
                        key={index}
                        icon={resolved.icon}
                        name={resolved.name}
                        tooltip={resolved.name}
                        width={size}
                        height={size}
                    />,
                ];
            })}
        </span>
    );
}
