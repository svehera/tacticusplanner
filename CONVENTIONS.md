# Tacticus Planner — Page Building Conventions

This file is the canonical reference for design tokens, shared components, layout, and styling patterns. Both `build-page` and `refactor-page` skills load it before doing any work.

The codebase has uneven quality — some pages match this doc, many predate it. **What's in this file is the target, not "what's nearby."**

---

## Design tokens

All colours come from CSS custom properties defined in `src/fsd/0-app/index.css`. Tokens are class-scoped to `:root` and `.dark` and flip automatically when the `.dark` class is set on the document.

In Tailwind, use `bg-(--primary)`, `text-(--fg)`, `border-(--border)`, etc. For opacity modifiers: `bg-(--primary)/15`, `hover:bg-(--primary)/18`. For shade variations of token-mapped colours, Tailwind palette classes with explicit `dark:` variants are allowed — see the "Shade-picking guide" section below.

### Foundational tokens

| Token            | Light         | Dark          | Use for                         |
| ---------------- | ------------- | ------------- | ------------------------------- |
| `--bg`           | white         | zinc-900      | Page background                 |
| `--fg`           | zinc-950      | zinc-100      | Primary text                    |
| `--border`       | zinc-200      | zinc-700      | Card borders, dividers          |
| `--input-border` | zinc-300      | zinc-700      | Input borders, switch off-track |
| `--ring`         | indigo (0.45) | indigo (0.60) | Focus rings                     |

### Surface tokens

The surface tokens have a subtle semantic structure worth knowing — values may match today but the distinctions exist so they can diverge later without a refactor.

| Token                   | Light    | Dark     | Use for                                              |
| ----------------------- | -------- | -------- | ---------------------------------------------------- |
| `--card`                | white    | zinc-800 | Card surface (persistent, in the flow)               |
| `--card-border`         | zinc-200 | zinc-700 | Card border                                          |
| `--card-fg`             | zinc-950 | zinc-50  | Text/elements on card surface                        |
| `--overlay`             | white    | zinc-800 | Dropdown/popover surface (transient, floating above) |
| `--overlay-fg`          | zinc-950 | zinc-100 | Text on overlay surface                              |
| `--sidebar`             | zinc-50  | zinc-950 | Sidebar background                                   |
| `--sidebar-fg`          | zinc-950 | zinc-50  | Text in sidebar                                      |
| `--data-surface`        | zinc-50  | zinc-800 | AG Grid / data table background                      |
| `--data-surface-fg`     | zinc-950 | zinc-100 | Text on data surface                                 |
| `--data-surface-border` | zinc-200 | zinc-700 | Borders inside data tables                           |

`--card` and `--overlay` are intentionally separate even though they have identical values today — overlays may pick up a subtle elevation tint later. Use the one that matches semantic intent, not whichever happens to be in the nearest file.

### Neutral fill tokens

`--soft` and `--neutral` have **identical background values** but are paired with different foregrounds, which makes them different tokens in practice:

| Token          | Light    | Dark     | Pair with      | Use for                                                             |
| -------------- | -------- | -------- | -------------- | ------------------------------------------------------------------- |
| `--soft`       | zinc-100 | zinc-800 | `--soft-fg`    | Subtle fills behind de-emphasized text (captions, labels, metadata) |
| `--soft-fg`    | zinc-600 | zinc-400 | —              | De-emphasized text (captions, helper text)                          |
| `--neutral`    | zinc-100 | zinc-800 | `--neutral-fg` | Hover backgrounds, subtle fills under primary text                  |
| `--neutral-fg` | zinc-950 | zinc-100 | —              | Full-contrast text on a neutral surface                             |

Pick by the foreground you need on top:

- Caption-style text → `--soft` + `--soft-fg`
- Normal/strong text on a neutral fill → `--neutral` + `--neutral-fg`

### Accent tokens

| Token            | Light     | Dark      | Use for                                                               |
| ---------------- | --------- | --------- | --------------------------------------------------------------------- |
| `--primary`      | blue-700  | blue-500  | CTAs, active state, accent. Shifts lighter in dark mode for contrast. |
| `--primary-fg`   | white     | white     | Text on primary background                                            |
| `--secondary`    | zinc-200  | zinc-700  | Subdued/neutral button fills, outline/plain hover surfaces            |
| `--secondary-fg` | zinc-950  | zinc-100  | Text on secondary background, icon-button text in both themes         |
| `--accent`       | amber-600 | amber-600 | Decorative accent (amber)                                             |
| `--accent-fg`    | zinc-950  | zinc-950  | Text on accent background                                             |

`--accent` is used for the `ButtonPill` toggle — on hover and active state the pill fills with the accent colour. It's intentionally distinct from `--primary` so toggled pills read as "selected" rather than "action."

```tsx
{
    /* ButtonPill uses accent internally — you rarely reach for --accent directly */
}
<ButtonPill isSelected={active} onClick={toggle}>
    Label
</ButtonPill>;

{
    /* If you do need it manually: */
}
<span className="rounded-full bg-(--accent)/20 px-2 py-0.5 text-xs text-(--accent-fg)">New</span>;
```

### Semantic state tokens

| Token          | Light       | Dark        | Pair with      | Use for                                                                                                 |
| -------------- | ----------- | ----------- | -------------- | ------------------------------------------------------------------------------------------------------- |
| `--success`    | emerald-600 | emerald-500 | `--success-fg` | Success states. Shifts one step lighter in dark mode for contrast on zinc-800.                          |
| `--success-fg` | white       | white       | —              | Text on success background                                                                              |
| `--warning`    | amber-400   | amber-400   | `--warning-fg` | Warning states. No dark-mode shift — amber-400 is already high-lightness.                               |
| `--warning-fg` | amber-950   | amber-950   | —              | Text on warning background                                                                              |
| `--danger`     | red-600     | red-600     | `--danger-fg`  | Error / destructive states. No dark-mode shift — mostly used as badge background with --danger-fg text. |
| `--danger-fg`  | red-50      | red-50      | —              | Text on danger background                                                                               |

Common patterns for semantic state tokens:

```tsx
{/* Status icon — colour the icon directly */}
<CheckCircle2 className="size-3.5 text-(--success)" />
<AlertTriangle className="size-3.5 text-(--danger)" />

{/* Inline status text */}
<span className={completed ? 'text-(--success) font-semibold' : 'text-(--soft-fg)'}>
    {count} / {total}
</span>

{/* Progress bar fill — success when full, warning when partial */}
<div className="h-2 overflow-hidden rounded-full bg-(--fg)/12">
    <div
        className={`h-full transition-all ${isFull ? 'bg-(--success)' : 'bg-(--warning)'}`}
        style={{ width: `${percent}%` }}
    />
</div>

{/* Toggle button — success for included, danger for excluded */}
<Button
    appearance="outline"
    intent={included ? 'success' : 'danger'}
    size="small"
    onPress={toggle}>
    {included ? 'Included' : 'Excluded'}
</Button>

{/* Destructive hover action (e.g. delete icon button) */}
<button className="text-(--soft-fg) hover:bg-(--danger)/10 hover:text-(--danger) rounded p-2 transition-colors">
    <Trash2 className="size-4" />
</button>

{/* Solid badge — handled by the Badge component */}
<Badge intent="success">Complete</Badge>
<Badge intent="warning">Partial</Badge>
<Badge intent="danger">Blocked</Badge>
```

### Chart tokens

Indigo scale, light → dark steps. Use for data visualisation series.

| Token       | Light                | Dark                 |
| ----------- | -------------------- | -------------------- |
| `--chart-1` | oklch(0.45 0.20 265) | oklch(0.60 0.20 265) |
| `--chart-2` | oklch(0.55 0.18 265) | oklch(0.68 0.17 265) |
| `--chart-3` | oklch(0.65 0.15 265) | oklch(0.75 0.13 265) |
| `--chart-4` | oklch(0.75 0.12 265) | oklch(0.82 0.09 265) |
| `--chart-5` | oklch(0.85 0.08 265) | oklch(0.88 0.05 265) |

### Domain tokens — rarities

Used directly via `bg-(--rarity-common)` etc. when you need just the colour (e.g., as a row tint or background fill). For icon display, prefer the `RarityIcon` component.

| Token                | Light     | Dark      |
| -------------------- | --------- | --------- |
| `--rarity-common`    | `#cdb3a0` | `#8a705d` |
| `--rarity-uncommon`  | `#f9cb9c` | `#b3845f` |
| `--rarity-rare`      | `#efefef` | `#6b6b6b` |
| `--rarity-epic`      | `#ffe599` | `#a88a48` |
| `--rarity-legendary` | `#cfe2f3` | `#5a7892` |
| `--rarity-mythic`    | `#d84300` | `#d9886c` |

### Domain tokens — ranks

Used directly via `bg-(--rank-gold2)` etc. when you need the colour without the full rank icon. For icon display, prefer `RankIcon`.

Stone · Iron · Bronze · Silver · Gold · Diamond · Adamantine — each with `1`/`2`/`3` tiers, defined in light and dark variants. See `src/fsd/0-app/index.css` (`:root` block) for exact values. Tokens are named `--rank-{tier}{n}`, e.g. `--rank-stone1`, `--rank-gold3`, `--rank-adamantine2`.

### Domain tokens — campaign difficulties

Used directly for difficulty badges, table cell tints, etc.

| Token               | Light                | Dark                 |
| ------------------- | -------------------- | -------------------- |
| `--diff-standard`   | oklch(0.55 0.18 250) | oklch(0.70 0.18 250) |
| `--diff-mirror`     | oklch(0.62 0.15 200) | oklch(0.72 0.14 200) |
| `--diff-elite`      | oklch(0.65 0.18 60)  | oklch(0.75 0.16 60)  |
| `--diff-event-std`  | oklch(0.60 0.18 320) | oklch(0.70 0.16 320) |
| `--diff-event-ext`  | oklch(0.55 0.20 20)  | oklch(0.70 0.20 20)  |
| `--diff-event-chal` | oklch(0.55 0.20 340) | oklch(0.70 0.18 340) |

### Domain tokens — LRE tracks

LRE (Legendary Release Event) has three track colours, used directly in track headers, progress bars, and badges.

| Token         | Light                | Dark                 |
| ------------- | -------------------- | -------------------- |
| `--lre-alpha` | oklch(0.72 0.13 220) | oklch(0.72 0.14 220) |
| `--lre-beta`  | oklch(0.82 0.15 80)  | oklch(0.82 0.16 80)  |
| `--lre-gamma` | oklch(0.70 0.18 15)  | oklch(0.70 0.20 15)  |

### Radius scale

| Token          | Value                                  |
| -------------- | -------------------------------------- |
| `--radius-xs`  | `calc(--radius-lg * 0.5)` (~0.25rem)   |
| `--radius-sm`  | `calc(--radius-lg * 0.75)` (~0.375rem) |
| `--radius-md`  | `calc(--radius-lg * 0.9)`              |
| `--radius-lg`  | `0.5rem` (base)                        |
| `--radius-xl`  | `calc(--radius-lg * 1.25)` (~0.625rem) |
| `--radius-2xl` | `calc(--radius-lg * 1.5)`              |
| `--radius-3xl` | `calc(--radius-lg * 2)`                |
| `--radius-4xl` | `calc(--radius-lg * 3)`                |

Tailwind's `rounded-*` utilities map to these. Prefer named utilities (`rounded-lg`, `rounded-xl`) over raw `rounded-[0.5rem]`.

### Adding a new token

New tokens go in `src/fsd/0-app/index.css`:

1. Add the variable definition in both `:root` and `.dark` blocks. Always define both, even if the values match — the explicit duplication signals intent.
2. If the token is colour-like and should be addressable via Tailwind utilities (`bg-(--foo)`), add a corresponding `--color-foo: var(--foo)` line to the `@theme` block at the top of the file.

### Don'ts

| ❌ Don't                                                     | ✅ Do instead                                                                                                                                |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `bg-blue-500`, `text-gray-600`, `border-slate-200`           | Use a token — every colour has one                                                                                                           |
| `bg-white`, `bg-black`, `text-white`, `text-black`           | `bg-(--bg)`, `bg-(--overlay)`, `text-(--fg)`, `text-(--primary-fg)`                                                                          |
| `bg-slate-*`, `text-gray-*`, `border-gray-*`                 | Wrong grey family — system uses zinc. Use tokens for all neutrals.                                                                           |
| `ring-black/5`, `ring-white/10`                              | `ring-(--border)/50`                                                                                                                         |
| `style={{ color: '#...' }}`, `style={{ background: '...' }}` | Use a token class instead                                                                                                                    |
| MUI `sx={{ ... }}`                                           | Tailwind `className` with tokens (see migration policy in refactor-page skill)                                                               |
| `bg-(--neutral)` as a progress bar track                     | `--neutral` equals the card surface in dark mode — use `bg-(--fg)/12` for overlaid tracks                                                    |
| `bg-(--card-fg)/60` as a progress fill                       | Pick a semantic fill: `bg-(--primary)` or the relevant domain token                                                                          |
| `hover:bg-(--neutral)` on buttons inside cards/tables        | `--neutral` = card surface in dark mode — invisible hover. Use `hover:bg-(--primary)/15` (neutral) or `hover:bg-(--danger)/10` (destructive) |

### Shade-picking guide

**Tokens for identity. Tailwind for variation.** If changing the colour would change what the app _is_ (brand, intent, semantic meaning), it's a token. If it's just picking a lighter or darker shade of something that already has a token, use Tailwind's scale with explicit `dark:` variants.

Allowed: Tailwind palette shades of colours that map to an existing token, **with** a `dark:` variant:

| Token         | Tailwind family |
| ------------- | --------------- |
| `--primary`   | `blue`          |
| `--secondary` | `zinc`          |
| `--success`   | `emerald`       |
| `--warning`   | `amber`         |
| `--danger`    | `red`           |
| `--accent`    | `amber`         |

**Not allowed:** random Tailwind palette classes with no token relationship (`bg-blue-500`, `text-teal-300`) or wrong grey families (`bg-slate-200`, `text-gray-500` — system uses zinc).

Common shade recipes:

| Use case      | Light mode             | Dark mode                   |
| ------------- | ---------------------- | --------------------------- |
| Alert tint bg | `bg-{color}-50`        | `dark:bg-{color}-950/40`    |
| Badge fill    | `bg-{color}-100`       | `dark:bg-{color}-900/30`    |
| Icon / accent | `text-{color}-600`     | `dark:text-{color}-400`     |
| Text on white | `text-{color}-700`     | `dark:text-{color}-300`     |
| Hover on card | `hover:bg-{color}-100` | `dark:hover:bg-{color}-800` |

Alpha modifiers on tokens (`bg-(--primary)/15`) are still fine for one-off transparency effects — the shade recipes above are for cases where you need a deterministic colour that doesn't shift with the background.

---

## Legacy global utility classes

`src/fsd/0-app/index.css` (roughly lines 314–620) defines a set of legacy global utility classes from before the Tailwind migration. These are **migration targets** — replace with Tailwind when you encounter them in a file you're already editing.

### Simple 1:1 replacements

| Legacy class | Tailwind replacement |
| ------------ | -------------------- |
| `.bold`      | `font-bold`          |
| `.italic`    | `italic`             |
| `.pointer`   | `cursor-pointer`     |
| `.flex-row`  | `flex items-center`  |

### `.flex-box` compound pattern

`.flex-box` is a flex container with modifier classes chained via `&.modifier` SCSS-style selectors, plus child gap and padding utility classes. Replace the whole cluster with Tailwind:

| `.flex-box` modifier | Tailwind replacement                                          |
| -------------------- | ------------------------------------------------------------- |
| base (no modifiers)  | `flex items-center`                                           |
| `.column`            | `flex flex-col` (drop `items-center` — usually wants stretch) |
| `.between`           | `justify-between`                                             |
| `.around`            | `justify-around`                                              |
| `.center`            | `justify-center`                                              |
| `.start`             | `items-start`                                                 |
| `.wrap`              | `flex-wrap`                                                   |
| `.full-width`        | `w-full`                                                      |
| `.mobile-wrap`       | `max-[700px]:flex-wrap`                                       |
| `.gap5`              | `gap-1` (snap 5px → 4px)                                      |
| `.gap10`             | `gap-2.5` (10px)                                              |
| `.gap15`             | `gap-4` (snap 15px → 16px)                                    |
| `.gap20`             | `gap-5` (20px)                                                |
| `.p1`–`.p10`         | `p-px` through `p-2.5`                                        |

Example: `className="flex-box between gap10"` → `className="flex items-center justify-between gap-2.5"`.

### Rank / rarity background classes — flag only, do not migrate

The rank classes (`.stone1`–`.adamantine3`) and rarity classes (`.common`–`.mythic`) are **dynamically injected at runtime** via enum-to-string lookups — e.g. `Rank[rank].toLowerCase()` in ag-Grid `cellClass` callbacks and JSX string concatenation. Tailwind's JIT scanner cannot detect these names because they're constructed at runtime, so migrating them to Tailwind would silently break rank/rarity displays across the app.

**Rule:** leave them where they are. If you encounter them in a file you're refactoring, do not touch them — note in your summary that they're present and that they reference the domain tokens internally (which is fine; that part doesn't need migration).

---

## Available shared components

Import from `@/fsd/5-shared/ui`:

- `Button` — intents: primary/secondary/success/warning/danger; appearances: solid/outline/plain; sizes: extra-small/small/medium/large/square-petite; shapes: square (default, rounded-lg)/circle (rounded-full). Uses `onPress`, not `onClick` (react-aria). Outline/plain appearances show a state-layer overlay on hover/press and use the intent's accent colour for text (`--btn-accent`). For icon-only buttons use `size="square-petite" appearance="plain"`.
- `LinkButton` — same API as `Button` (intent, appearance, size, shape) but renders a React Aria `<Link>` (`<a>`) instead of `<button>`. Import from `@/fsd/5-shared/ui/link`. Use for navigation buttons that look like buttons but route via links (e.g. "Go to Goals", "Go to Raids"). Defaults to `intent="primary"`.
- `ButtonPill` — pill-shaped toggle button
- `TextField` — label, description, prefix, suffix, isDisabled, isInvalid, errorMessage, isPending, isRevealable, type
- `Switch` — `isSelected`, `onChange` (receives boolean directly, not event), `children` (label), `isDisabled`
- `Badge` — intents: primary/success/warning/danger; appearances: solid/outline
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `Accordion`, `AccordionHeader`, `AccordionBody` — card-style collapsible. Controlled (`expanded`+`onToggle`) or uncontrolled (`defaultExpanded`). MUI `Accordion`/`AccordionSummary`/`AccordionDetails` are migration targets — use this component instead.
- `Separator` — horizontal (default) or `orientation="vertical"`. Pass `children` for a labeled horizontal separator: `<Separator>Section Label</Separator>` renders a centered uppercase label between two lines.
- `Modal`, `Dialog` — `Modal` wraps trigger + `Modal.Content`; inside use `Dialog.Header`, `Dialog.Body`, `Dialog.Footer`, `Dialog.Close`. **Important:** the shared Modal uses react-aria's focus trap, which blocks interaction with portaled dropdowns (shared `Select`, `ComboBox`, MUI `Autocomplete`). For form dialogs that contain dropdowns, use the custom portal dialog pattern instead (see "Form dialog" in Layout patterns below). The shared Modal is fine for confirmation dialogs and dialogs with only text/buttons.
- `Loader` — variants: spin/bars/ring; sizes: small/medium/large/extra-large
- `AccessibleTooltip` — wraps any element, `title` prop (string or JSX)
- `LazyTooltip` — same API, only mounts tooltip DOM on first hover
- `ConfirmationDialog` — pre-built confirm/cancel modal
- `LoaderWithText` — `loading` boolean prop
- `Conditional` — `condition` boolean prop, renders children if true
- `FlexBox` — flex container div with className passthrough (the modern replacement for the legacy `.flex-box` global)

Import from `@/fsd/5-shared/ui/selects`:

**Primitives (generic, for building custom selects):**

- `Select<T>` — single non-searchable, `options: T[]`, `value: T`, `onChange`, `renderOption?`, `renderValue?`, `by?`
- `SelectMulti<T>` — multi non-searchable, `options: T[]`, `value: T[]`, `onChange`, `renderOption?`, `renderValue?`, `by?`
- `ComboBox<T>` — single searchable, `options: T[]`, `value: T | null`, `onChange`, `displayValue`, `filterFn?`, `renderOption?`
- `ComboBoxMulti<T>` — multi searchable, `options: T[]`, `value: T[]`, `onChange`, `displayValue`, `filterFn?`, `renderOption?`, `renderValue?`. When no `renderValue` is provided, selected items automatically display as removable Badge chips above the input.

**Domain selects (thin wrappers around primitives):**

- `RaritySelect` — single, `rarityValues: number[]`, `value: number`, `valueChanges`
- `RankSelect` — single, `rankValues: number[]`, `value: number`, `valueChanges`
- `StarsSelect` — single, `starsValues: number[]`, `value: number`, `valueChanges`
- `FactionSelect` — multi, `factionValues: FactionId[]`, `value: FactionId[]`, `valueChanges`
- `MultipleSelectCheckmarks` — multi searchable string select, `values: string[]`, `selectedValues: string[]`, `selectionChanges`, `placeholder`, `renderOption?`. Wraps `ComboBoxMulti` for simple string lists. Pass `renderOption` to add icons to dropdown items.

Import from `@/fsd/5-shared/ui/icons`:

- `RarityIcon`, `RankIcon`, `StarsIcon`, `FactionImage`, `MiscIcon`, `UnitShardIcon`, `BmcIcon`, `TraitImage`, `ComponentImage`
    - `TraitImage` — `trait: Trait`, optional `width`/`height` (default 25). Uses snowprint trait assets with an internal override map for irregular filenames.
    - `ComponentImage` — `alliance: Alliance`, `size?: 'small' | 'medium'`. Renders the alliance MOW component icon (Imperial/Chaos/Xenos).

---

## Page layout context

The desktop shell (`desktop-app.tsx`) wraps every page:

```
┌─────────────────────────────────────────────────────────────┐
│  Sidebar  │  TopAppBar (full remaining width, ~48px tall)   │
│  248px    ├─────────────────────────────────────────────────┤
│  (64px    │  mx-5 my-2.5  ←── shell padding (do not repeat) │
│   when    │  ┌─────────────────────────────────────────────┐ │
│  collapsed│  │  <Outlet /> — your page root lives here     │ │
│  )        │  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

- The shell applies `mx-5` (20 px each side) around the outlet. **Do not add horizontal padding to the page root** — `py-6` vertical only.
- The content area is `flex-1 min-w-0` — it fills all width left after the sidebar.
- There is **no global `max-width`** on the content area. Pages set their own constraints where appropriate.

### When to constrain width

| Content type                   | Width strategy                                          |
| ------------------------------ | ------------------------------------------------------- |
| Table / ag-Grid                | None — fill all available width (`w-full`)              |
| Card / tile grid               | None — tiles wrap naturally with `flex flex-wrap gap-*` |
| Form / settings                | `max-w-2xl` on the form container only                  |
| Article / text-heavy reference | `max-w-3xl` on the text container                       |
| Mixed: heading + table         | Both full width — heading does not narrow the table     |

Do **not** add `max-w-*` to the page root. Constrain the specific inner container that needs it.

### Content alignment rules

- **Left-align everything by default.** Centering is a deliberate choice for empty states and large stat displays, not a default layout.
- Filter bars and section headings: always flush left, full width.
- Numbers in table cells: `text-right tabular-nums`.
- Action clusters in a filter header row: `<div className="flex flex-1 items-center justify-end gap-3">` — label left, controls pushed right.
- Card grids: `flex flex-wrap gap-6` — items fill left-to-right, no forced horizontal centering.
- Empty state: `flex flex-col items-center justify-center text-center gap-3` inside a full-width container with a minimum height.

---

## Layout patterns

> Note: the patterns below (chip, segmented control, accordion, custom dropdown) are reference implementations. If you find yourself copying any of them into a third file, extract a shared component into `@/fsd/5-shared/ui` instead. The cost of one more in-place copy is small; the cost of three drifting copies is high.

### Page root

```tsx
<div className="space-y-8 py-6">
    <div>
        <h2>Page Title</h2>
        <p className="text-sm text-(--soft-fg)">Short description</p>
    </div>
    {/* content */}
</div>
```

### Section (named group of related content)

```tsx
<section className="space-y-4">
    <h3 className="text-xs font-bold tracking-widest text-(--soft-fg) uppercase">Section label</h3>
    {/* content */}
</section>
```

### Filter bar header pattern

```tsx
<div className="overflow-hidden rounded-xl border border-(--border) bg-(--overlay)">
    <div className="flex items-center gap-4 border-b border-(--border) px-4 py-2.5">
        <span className="text-[10px] font-bold tracking-[.14em] text-(--soft-fg) uppercase">Filters</span>
        <div className="flex flex-1 items-center justify-end gap-3">
            <Switch isSelected={toggle} onChange={setToggle}>
                Label
            </Switch>
            <Button appearance="plain" intent="primary" size="extra-small" isDisabled={!hasFilters} onPress={clearAll}>
                Clear
            </Button>
        </div>
    </div>
    {/* filter body rows */}
</div>
```

### Rarity / tag chips

```tsx
<button
    onClick={() => toggle(value)}
    className={[
        'flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
        active
            ? 'border-(--primary)/50 bg-(--primary)/15 text-(--fg)'
            : 'border-(--border) bg-transparent text-(--soft-fg) hover:border-(--primary)/40 hover:bg-(--primary)/10 hover:text-(--fg)',
    ].join(' ')}>
    {/* icon + label */}
</button>
```

### Segmented control

```tsx
<div className="inline-flex rounded-lg border border-(--border) bg-(--neutral) p-0.5">
    {options.map(opt => (
        <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={[
                'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                opt.value === value ? 'bg-(--bg) text-(--fg) shadow-sm' : 'text-(--soft-fg) hover:text-(--fg)',
            ].join(' ')}>
            {opt.label}
        </button>
    ))}
</div>
```

### Accordion (card-style, standalone)

Use the shared `Accordion` component from `@/fsd/5-shared/ui` for standalone collapsible sections. It renders as a card with a soft header strip, chevron icon, and collapsible body.

```tsx
import { Accordion, AccordionHeader, AccordionBody } from '@/fsd/5-shared/ui';

<Accordion defaultExpanded>
    <AccordionHeader>
        <span className="text-sm font-semibold">Section title</span>
        <span className="text-sm text-(--soft-fg)">3 items</span>
    </AccordionHeader>
    <AccordionBody>
        <div className="p-4">{children}</div>
    </AccordionBody>
</Accordion>;
```

- **Container**: card surface (`--card` + `--card-border` + `shadow-sm` + `rounded-xl`)
- **Header**: `bg-(--soft)` with `hover:bg-(--primary)/10` — the clickable strip has visual weight
- **Body**: `border-t border-(--card-border)` — clean separator, no background wash
- **Icon**: Lucide `ChevronDown` / `ChevronRight`, auto-managed by the component
- Supports both **controlled** (`expanded` + `onToggle`) and **uncontrolled** (`defaultExpanded`) modes
- Prefer this over MUI `<Accordion>` — it uses design tokens natively and doesn't need `!important` overrides

### Accordion group (stacked, mutually exclusive)

When multiple `Accordion` components are stacked without gaps between them, wrap them in a container that squares off the touching inner corners and collapses the double border:

```tsx
<div className="[&>*:not(:first-child)]:-mt-px [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none">
    {items.map(item => (
        <Accordion
            key={item.id}
            expanded={open === item.id}
            onToggle={next => setOpen(next ? item.id : null)}>
            <AccordionHeader>{item.title}</AccordionHeader>
            <AccordionBody>{item.body}</AccordionBody>
        </Accordion>
    ))}
</div>
```

Three classes on the wrapper:

| Class | Effect |
| --- | --- |
| `[&>*:not(:first-child)]:-mt-px` | Overlaps adjacent borders so only one line is visible between items |
| `[&>*:not(:first-child)]:rounded-t-none` | Squares the top corners of every item except the first |
| `[&>*:not(:last-child)]:rounded-b-none` | Squares the bottom corners of every item except the last |

The result is rounded on the outer edges only — first item's top-left/top-right corners stay rounded; last item's bottom-left/bottom-right corners stay rounded; everything in between is a straight edge.

Use **controlled mode** (`expanded` + `onToggle`) with a shared `string | number | null` state so expanding one automatically collapses the others. Uncontrolled (`defaultExpanded`) makes mutual exclusivity impossible.

### Accordion item (inline, inside a card)

For collapsible rows _inside_ an existing card or panel (e.g. FAQ items, nested details):

```tsx
<div className="border-t border-(--border) first:border-t-0">
    <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-sm font-medium text-(--fg) hover:bg-(--primary)/10">
        {title}
        <ChevronDown className={`h-4 w-4 text-(--soft-fg) transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="px-4 pb-4 text-sm text-(--soft-fg)">{children}</div>}
</div>
```

(Hover uses `hover:bg-(--primary)/10` rather than `hover:bg-(--neutral)` so the hover is visible when the accordion lives inside a card. See the don'ts table for why.)

### Custom single-value dropdown (headlessUI Listbox)

For dropdowns where the domain selects don't fit. The two className strings get attached to the trigger button and the options panel:

```tsx
import { Listbox } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';

const dropTrigger =
    'relative w-full cursor-pointer rounded-lg border border-(--border) bg-(--bg) py-2 pr-9 pl-3 text-left text-sm text-(--fg) shadow-sm transition-all hover:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)';
const dropPanel =
    'absolute z-50 mt-1 w-full overflow-auto rounded-lg border border-(--border) bg-(--overlay) py-1 shadow-xl';

<Listbox value={value} onChange={onChange}>
    <Listbox.Button className={dropTrigger}>
        {value.label}
        <ChevronDown className="absolute top-2.5 right-2 h-4 w-4 text-(--soft-fg)" />
    </Listbox.Button>
    <Listbox.Options className={dropPanel}>
        {options.map(opt => (
            <Listbox.Option
                key={opt.value}
                value={opt}
                className="ui-active:bg-(--primary)/10 flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-(--overlay-fg)">
                {opt.label}
            </Listbox.Option>
        ))}
    </Listbox.Options>
</Listbox>;
```

### Icon-rich multi-select (SelectMulti with renderOption + renderValue)

When a multi-select needs icons in both the dropdown and the trigger, use `SelectMulti` with `renderOption` (icon + text for dropdown items) and `renderValue` (compact icons-only for the trigger button). This is the pattern used for Rarity, Faction, Damage Types, Traits, and Alliance selects.

```tsx
import { SelectMulti } from '@/fsd/5-shared/ui/selects';
import { MiscIcon, TraitImage, ComponentImage } from '@/fsd/5-shared/ui/icons';

{
    /* Damage types — MiscIcon with key pattern 'damage' + type (spaces removed) */
}
<SelectMulti<string>
    options={damageTypesOptions}
    value={selectedDamageTypes}
    onChange={setSelectedDamageTypes}
    label="Damage Types"
    placeholder="All damage types"
    renderOption={dt => (
        <div className="flex items-center gap-2">
            <MiscIcon icon={`damage${dt.replace(/ /g, '')}` as never} width={20} height={20} />
            <span>{dt}</span>
        </div>
    )}
    renderValue={selected => (
        <div className="flex flex-wrap items-center gap-1">
            {selected.map(dt => (
                <MiscIcon key={dt} icon={`damage${dt.replace(/ /g, '')}` as never} width={18} height={18} />
            ))}
        </div>
    )}
/>;

{
    /* Alliance — ComponentImage */
}
<SelectMulti<string>
    options={Object.values(Alliance)}
    value={selectedAlliance}
    onChange={setSelectedAlliance}
    label="Alliance"
    placeholder="All alliances"
    renderOption={a => (
        <div className="flex items-center gap-2">
            <ComponentImage alliance={a as Alliance} size="small" />
            <span>{a}</span>
        </div>
    )}
    renderValue={selected => (
        <div className="flex flex-wrap items-center gap-1">
            {selected.map(a => (
                <ComponentImage key={a} alliance={a as Alliance} size="small" />
            ))}
        </div>
    )}
/>;

{
    /* Traits — TraitImage */
}
<SelectMulti<string>
    options={traitsOptions}
    value={selectedTraits}
    onChange={setSelectedTraits}
    label="Traits"
    placeholder="All traits"
    renderOption={t => (
        <div className="flex items-center gap-2">
            <TraitImage trait={t as Trait} width={20} height={20} />
            <span>{t}</span>
        </div>
    )}
    renderValue={selected => (
        <div className="flex flex-wrap items-center gap-1">
            {selected.map(t => (
                <TraitImage key={t} trait={t as Trait} width={18} height={18} />
            ))}
        </div>
    )}
/>;
```

For factions specifically, use the pre-built `FactionSelect` wrapper which handles icons internally.

### Form dialog (`PortalDialog`, for dialogs with dropdowns)

Use `PortalDialog` from `@/fsd/5-shared/ui` for any dialog that contains shared `Select`, `ComboBox`, or other portaled dropdown components. The shared `Modal` (react-aria) traps focus and blocks interaction with portaled elements; `PortalDialog` avoids that by using `createPortal` with no focus trap.

```tsx
import { PortalDialog, Button } from '@/fsd/5-shared/ui';

<PortalDialog open={open} onClose={onClose} aria-label="Dialog title" size="xl">
    <PortalDialog.Header>Title</PortalDialog.Header>
    <PortalDialog.Body>{/* form fields, shared Select, ComboBox, etc. */}</PortalDialog.Body>
    <PortalDialog.Footer>
        <Button appearance="outline" onPress={onClose}>
            Cancel
        </Button>
        <Button onPress={onSave}>Save</Button>
    </PortalDialog.Footer>
</PortalDialog>;
```

Key details:

- `size` prop: `xs` through `5xl` (default `lg`) — maps to `max-w-*` on the panel
- `PortalDialog.Header` renders a title area + X close button (wired automatically)
- `PortalDialog.Body` defaults to `flex flex-col gap-5` — override gap via `className`
- `PortalDialog.Footer` defaults to `flex justify-end gap-3`
- No focus trap means shared `Select`, `ComboBox`, and `UnitsAutocomplete` all work correctly
- Handles scroll lock, backdrop click, Escape key, and focus management internally
- Reference implementations: `set-goal-dialog.tsx`, `daily-raids-settings.tsx`

---

## Typography scale

Base styles for `h2` and `h3` live in `src/fsd/0-app/index.css` (`@layer base`):

```css
h2 {
    @apply mt-2 mb-2 text-2xl font-bold;
}
h3 {
    @apply mt-2 mb-2 text-lg font-bold;
}
```

So `<h2>` and `<h3>` carry their styles intrinsically — no className needed for the heading itself.

| Use            | Classes                                                        |
| -------------- | -------------------------------------------------------------- |
| Page heading   | `<h2>` (global)                                                |
| Subheading     | `<h3>` (global)                                                |
| Section label  | `text-xs font-bold tracking-widest uppercase text-(--soft-fg)` |
| Group label    | `text-xs font-semibold text-(--soft-fg)`                       |
| Body / table   | `text-sm text-(--fg)`                                          |
| Caption / meta | `text-xs text-(--soft-fg)`                                     |
| Input label    | `text-sm font-medium text-(--soft-fg)`                         |

---

## Spacing scale

A loose convention rather than a hard rule, but these are the values to reach for first. Deviating is fine if you have a reason; reaching for an arbitrary `gap-7` or `space-y-5` when one of these would do is just noise.

| Use                                 | Spacing                    |
| ----------------------------------- | -------------------------- |
| Page root section gap               | `space-y-8`                |
| Page root vertical padding          | `py-6`                     |
| Card-internal section gap           | `space-y-4` or `space-y-6` |
| Inline control cluster (header row) | `gap-3`                    |
| Inline control cluster (compact)    | `gap-2`                    |
| Card / tile grid                    | `gap-6`                    |
| Filter header internal padding      | `px-4 py-2.5`              |
| Section header → body               | `space-y-4`                |
| Small badge / chip internal padding | `px-2.5 py-1`              |

---

## Sidebar nav item style (reference — sidebar.tsx)

Active: `border-l-[var(--primary)] bg-[var(--primary)]/[.18] text-[var(--fg)] font-semibold`
Inactive: `border-l-transparent bg-transparent text-[var(--soft-fg)] font-medium`
Base: `w-full flex items-center text-left px-2 py-1.5 gap-2.5 rounded-[7px] border-none cursor-pointer whitespace-nowrap text-[13px] border-l-2`

Icon size in sidebar: `text-[18px]`

---

## FSD boundary rules

The codebase follows Feature-Sliced Design with numbered layers:

- `0-app/` — routing, providers, top-level shell
- `1-pages/` — page components (route targets)
- `2-widgets/` — composite UI blocks reused across pages
- `3-features/` — feature logic (goals, upgrades, planning…)
- `4-entities/` — domain entities (character, mow, lre, faction…)
- `5-shared/` — shared UI, hooks, utilities

**Rule:** lower-numbered layers may import from higher-numbered ones, never the reverse. A page (`1-pages/`) may import from features, entities, and shared. A shared component cannot import from a page.

Import path aliases:

- `@/fsd/5-shared/ui` → shared components
- `@/fsd/4-entities/{name}` → domain entities
- `@/fsd/3-features/{name}` → feature logic
- `src/reducers/store.provider` → StoreContext, DispatchContext

### Why store-context imports need ESLint disables

The global store lives at `src/reducers/store.provider`, which is **outside** the FSD layer structure (it predates the migration). Importing it from inside an FSD layer trips two lint rules:

- `boundaries/element-types` — sees a cross-layer import to a non-layer file
- `import-x/no-internal-modules` — flags the deep path

Add both disables at the top of any page file that reads the global store:

```tsx
/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
```

This is a known wart, not a bug. New shared state should be added inside the FSD structure.

---

## Store context access

```tsx
import { useContext } from 'react';
import { StoreContext } from 'src/reducers/store.provider';

const {
    characters,
    leProgress,
    goals,
    inventory,
    dailyRaids,
    dailyRaidsPreferences,
    campaignsProgress,
    mows,
    gameModeTokens,
    viewPreferences,
} = useContext(StoreContext);
```

---

## Dark mode mechanism

Dark mode is **class-based**, not media-query-based. The `.dark` class on a parent element (typically `<html>` or `<body>`) flips every CSS custom property to its dark-mode value. The `@variant dark (&:where(.dark, .dark *))` rule at the top of `index.css` makes this work with Tailwind's `dark:` modifier — but you should still avoid manual `dark:` variants, because the tokens already flip.

If you need to test something dark-specific, toggle the class on `<html>` rather than your OS theme.

---

## URL section reference

For new pages, pick the section that matches the user's primary intent:

- `/input/*` — data entry / roster management
- `/plan/*` — planning / optimisation / calculation
- `/learn/*` — lookup / reference / library

The full procedure for creating a page (route + menu-item wiring, ESLint disables, CI checks) is in the `build-page` skill. This doc is the reference; the skill is the procedure.
