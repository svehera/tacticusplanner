# Tacticus Planner — Page Building Conventions

## Design tokens (always use these, never hardcode colors)

| Token            | Light                     | Dark                      | Use for                          |
| ---------------- | ------------------------- | ------------------------- | -------------------------------- |
| `--bg`           | white                     | zinc-900                  | Page background                  |
| `--fg`           | zinc-950                  | zinc-100                  | Primary text                     |
| `--muted`        | zinc-100                  | zinc-800                  | Muted background fills           |
| `--muted-fg`     | zinc-600                  | zinc-400                  | Labels, captions, secondary text |
| `--border`       | zinc-200                  | zinc-700                  | Card borders, dividers           |
| `--input`        | zinc-300                  | zinc-700                  | Input borders, switch off-track  |
| `--ring`         | indigo                    | indigo (brighter)         | Focus rings                      |
| `--primary`      | oklch(0.45 0.20 265)      | oklch(0.60 0.20 265)      | CTAs, active state, accent       |
| `--primary-fg`   | white                     | white                     | Text on primary background       |
| `--secondary`    | zinc-100                  | zinc-800                  | Hover backgrounds, subtle fills  |
| `--secondary-fg` | zinc-950                  | zinc-100                  | Text on secondary background     |
| `--accent`       | oklch(0.65 0.14 65)       | oklch(0.65 0.14 65)       | Decorative accent (amber-ish)    |
| `--accent-fg`    | zinc-950                  | zinc-950                  | Text on accent background        |
| `--overlay`      | white                     | zinc-800                  | Dropdown/popover surface         |
| `--overlay-fg`   | zinc-950                  | zinc-100                  | Text on overlay surface          |
| `--sidebar`      | zinc-50                   | zinc-950                  | Sidebar background               |
| `--sidebar-fg`   | zinc-950                  | zinc-50                   | Text in sidebar                  |
| `--card-bg`      | white                     | zinc-800                  | Card surface                     |
| `--card-border`  | zinc-200                  | zinc-700                  | Card border                      |
| `--card-fg`      | zinc-950                  | zinc-50                   | Text/elements on card surface    |
| `--success`      | emerald-600               | emerald-600               | Success states                   |
| `--success-fg`   | white                     | white                     | Text on success background       |
| `--warning`      | amber-400                 | amber-400                 | Warning states                   |
| `--warning-fg`   | amber-950                 | amber-950                 | Text on warning background       |
| `--danger`       | red-600                   | red-600                   | Error/destructive states         |
| `--danger-fg`    | red-50                    | red-50                    | Text on danger background        |
| `--chart-1…5`    | indigo scale (dark→light) | indigo scale (dark→light) | Data visualisation               |
| `--lre-alpha`    | oklch(0.72 0.13 220)      | oklch(0.72 0.14 220)      | LRE Alpha track colour           |
| `--lre-beta`     | oklch(0.82 0.15 80)       | oklch(0.82 0.16 80)       | LRE Beta track colour            |
| `--lre-gamma`    | oklch(0.70 0.18 15)       | oklch(0.70 0.20 15)       | LRE Gamma track colour           |

In Tailwind use `bg-(--primary)`, `text-(--fg)`, `border-(--border)` etc.
For opacity modifiers: `bg-(--primary)/15`, `hover:bg-(--primary)/18`.

### Don'ts

| ❌ Don't                                                     | ✅ Do instead                                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `bg-blue-500`, `text-gray-600`, `border-slate-200`           | Use a token — every colour has one                                                          |
| `bg-white`, `bg-black`, `text-white`, `text-black`           | `bg-(--bg)`, `bg-(--overlay)`, `text-(--fg)`, `text-(--primary-fg)`                         |
| `bg-green-500`, `text-green-400`                             | `bg-(--success)`, `text-(--success)`                                                        |
| `bg-red-*`, `text-red-*`                                     | `bg-(--danger)`, `text-(--danger)`                                                          |
| `bg-amber-*`, `text-amber-*`                                 | `bg-(--warning)`, `text-(--warning)`                                                        |
| `ring-black/5`, `ring-white/10`                              | `ring-(--border)/50`                                                                        |
| `dark:bg-*`, `dark:text-*`, `dark:border-*`                  | Never add manual dark variants — tokens flip automatically                                  |
| `style={{ color: '#...' }}`, `style={{ background: '...' }}` | Use a token class instead                                                                   |
| `bg-(--secondary)` as a progress bar track                   | `--secondary` equals the card surface in dark mode — use `bg-(--fg)/12` for overlaid tracks |
| `bg-(--card-fg)/60` as a progress fill                       | Pick a semantic fill: `bg-(--primary)` or the relevant domain token                         |
| `hover:bg-(--secondary)` on buttons inside cards/tables      | `--secondary` = card surface in dark mode — invisible hover. Use `hover:bg-(--primary)/15` (neutral actions) or `hover:bg-(--danger)/10` (destructive actions) |

---

## Available shared components

Import from `@/fsd/5-shared/ui`:

- `Button` — intents: primary/secondary/warning/danger; appearances: solid/outline/plain; sizes: extra-small/small/medium/large/square-petite
- `ButtonPill` — pill-shaped toggle button
- `TextField` — label, description, prefix, suffix, isDisabled, isInvalid, errorMessage, isPending, isRevealable, type
- `Switch` — `isSelected`, `onChange`, children (label), `isDisabled`
- `Badge` — intents: primary/success/warning/danger; appearances: solid/outline
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `Separator` — horizontal (default) or `orientation="vertical"`
- `Modal`, `Dialog` — `Modal` wraps trigger + `Modal.Content`; inside use `Dialog.Header`, `Dialog.Body`, `Dialog.Footer`, `Dialog.Close`
- `Loader` — variants: spin/bars/ring; sizes: small/medium/large/extra-large
- `AccessibleTooltip` — wraps any element, `title` prop (string or JSX)
- `LazyTooltip` — same API, only mounts tooltip DOM on first hover
- `ConfirmationDialog` — pre-built confirm/cancel modal
- `LoaderWithText` — `loading` boolean prop
- `Conditional` — `condition` boolean prop, renders children if true
- `FlexBox` — flex container div with className passthrough

Import from `@/fsd/5-shared/ui/selects`:

- `RaritySelect2` — single, `rarityValues: number[]`, `value: number`
- `RankSelect2` — single, `rankValues: number[]`, `value: number`
- `StarsSelect2` — single, `starsValues: number[]`, `value: number`
- `FactionSelect2` — multi, `factionValues: FactionId[]`, `value: FactionId[]`
- `MultipleSelectCheckmarks` — MUI-based multi, `values: string[]`, `selectedValues: string[]`, `selectionChanges`, `placeholder`, `minWidth`
- `RaritySelect`, `StarsSelect` — older MUI variants, prefer the `*2` versions

Import from `@/fsd/5-shared/ui/icons`:

- `RarityIcon`, `RankIcon`, `StarsIcon`, `FactionImage`, `MiscIcon`, `UnitShardIcon`, `BmcIcon`

Import from `@/fsd/5-shared/ui/badge`:

- `Badge` (also available via `@/fsd/5-shared/ui`)

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

| Content type | Width strategy |
|---|---|
| Table / ag-Grid | None — fill all available width (`w-full`) |
| Card / tile grid | None — tiles wrap naturally with `flex flex-wrap gap-*` |
| Form / settings | `max-w-2xl` on the form container only |
| Article / text-heavy reference | `max-w-3xl` on the text container |
| Mixed: heading + table | Both full width — heading does not narrow the table |

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

### Page root

```tsx
<div className="space-y-8 py-6">
    <div>
        <h2>Page Title</h2>
        <p className="text-sm text-(--muted-fg)">Short description</p>
    </div>
    {/* content */}
</div>
```

### Section (named group of related content)

```tsx
<section className="space-y-4">
    <p className="text-xs font-bold tracking-widest text-(--muted-fg) uppercase">Section Label</p>
    {/* content */}
</section>
```

### Filter bar header pattern

```tsx
<div className="overflow-hidden rounded-xl border border-(--border) bg-(--overlay)">
    <div className="flex items-center gap-4 border-b border-(--border) px-4 py-2.5">
        <span className="text-[10px] font-bold tracking-[.14em] text-(--muted-fg) uppercase">Filters</span>
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
            : 'border-(--border) bg-transparent text-(--muted-fg) hover:border-(--primary)/40 hover:bg-(--primary)/10 hover:text-(--fg)',
    ].join(' ')}>
    {/* icon + label */}
</button>
```

### Segmented control

```tsx
<div className="inline-flex rounded-lg border border-(--border) bg-(--secondary) p-0.5">
    {options.map(opt => (
        <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={[
                'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                opt.value === value ? 'bg-(--bg) text-(--fg) shadow-sm' : 'text-(--muted-fg) hover:text-(--fg)',
            ].join(' ')}>
            {opt.label}
        </button>
    ))}
</div>
```

### Accordion item

```tsx
<div className="border-t border-(--border) first:border-t-0">
    <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-sm font-medium text-(--fg) hover:bg-(--secondary)">
        {title}
        <ChevronDown className={`h-4 w-4 text-(--muted-fg) transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="px-4 pb-4 text-sm text-(--muted-fg)">{children}</div>}
</div>
```

### Custom single-value dropdown (headlessUI Listbox)

```tsx
const dropTrigger =
    'relative w-full cursor-pointer rounded-lg border border-(--border) bg-(--bg) py-2 pr-9 pl-3 text-left text-sm text-(--fg) shadow-sm transition-all hover:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary)';
const dropPanel =
    'absolute z-50 mt-1 w-full overflow-auto rounded-lg border border-(--border) bg-(--overlay) py-1 shadow-xl';
```

---

## Typography scale

| Use            | Classes                                                              |
| -------------- | -------------------------------------------------------------------- |
| Page heading   | `<h2>` (uses global h2 styles)                                       |
| Section label  | `text-xs font-bold tracking-widest uppercase text-(--muted-fg)`      |
| Group label    | `text-xs font-semibold text-(--muted-fg)`                            |
| Body / table   | `text-sm text-(--fg)`                                                |
| Caption / meta | `text-xs text-(--muted-fg)`                                          |
| Input label    | `text-sm font-medium text-(--muted-fg)`                              |

---

## Sidebar nav item style (reference — sidebar.tsx)

Active: `border-l-[var(--primary)] bg-[var(--primary)]/[.18] text-[var(--fg)] font-semibold`
Inactive: `border-l-transparent bg-transparent text-[var(--muted-fg)] font-medium`
Base: `w-full flex items-center text-left px-2 py-1.5 gap-2.5 rounded-[7px] border-none cursor-pointer whitespace-nowrap text-[13px] border-l-2`

Icon size in sidebar: `text-[18px]`

---

## FSD boundary rules

Add at top of any page file that imports from `src/` (store, legacy models):

```tsx
/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
```

Import path aliases:

- `@/fsd/5-shared/ui` → shared components
- `@/fsd/4-entities/{name}` → domain entities (character, mow, lre, faction…)
- `@/fsd/3-features/{name}` → feature logic (goals, upgrades…)
- `src/reducers/store.provider` → StoreContext, DispatchContext

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

## Wiring checklist for a new page

1. Create `src/fsd/1-pages/{name}/{name}.tsx` — named export `export const PageName`
2. Create `{name}.route.tsx` — `export const nameRoute: RouteObject = { path: 'section/name', async lazy() { ... } }`
3. Create `{name}.menu-item.tsx` — `export const nameMenuItem = new MenuItem('Label', <Icon />, '/section/name')`
4. Register route in `src/fsd/0-app/routing/desktop-routes.tsx` → add to `globalPlanRoutes` / `globalInputRoutes` / `globalLearnRoutes`
5. Register menu item in `src/models/menu-items.tsx` → add to `menuItemById` and appropriate `*SubMenu*` array

URL sections: `/input/*` (data entry) · `/plan/*` (calculation/planning) · `/learn/*` (reference/lookup)
