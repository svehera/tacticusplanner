---
name: refactor-page
description: Refactor or rebuild an existing page to match the current design system. Use when the user says "refactor", "redesign", "update to new style", "migrate to tokens", "fix the styling", "update the UI", "make it match the design system", "convert to tailwind", "replace MUI", or points at a page that looks visually inconsistent with the rest of the app. Also trigger when the user references a specific page and asks to clean it up, modernize it, or bring it in line with conventions.
argument-hint: <page-path-or-name> ["rebuild" for full JSX rewrite | default: targeted refactor]
allowed-tools: Read Glob Grep Write Edit Bash
---

You are fixing a page in **Tacticus Planner** that doesn't match the current design system. The user has asked: **$ARGUMENTS**

---

## Find the file

If a full path wasn't given, search for it:

```
Glob: src/fsd/1-pages/**/{name}.tsx
```

If you get multiple matches, ask which one. Don't pick the first hit — page names sometimes overlap (an old `/routes/` version and a newer `/fsd/1-pages/` version can coexist mid-migration).

Check whether `rebuild` appears in `$ARGUMENTS`:

- **Yes** → full JSX rewrite, logic copied across byte-for-byte.
- **No** → targeted in-place edits.

The distinction matters for how you'll apply changes later.

---

## Read before you touch anything

Load these in parallel:

```
Read: CONVENTIONS.md
Read: src/fsd/1-pages/ui-kit/ui-kit.page.tsx
Read: {target file}
```

Read the target file in full — not just the JSX. You need to understand what state it manages, which store fields it reads, what the event handlers do, and how computed values flow through. **None of that logic should change.** You were asked to fix visuals; everything else stays where it is.

Then scan the target file's local imports (relative paths — `./` and `../`) and read each one. These are the component files that make up the page. They need the same colour-scheme audit as the page itself.

For each component file you just read, do one more level: scan its local imports and read any that live in the same feature directory (same `1-pages/` subfolder). Stop there — you don't need to recurse into shared UI or entity layers. The goal is to cover the whole feature, not the entire dependency tree.

---

## Audit — list every violation before editing

**Scope the audit correctly.** The target file is the starting point, but pages are made of components. Audit every local component file you read above — not just the page. For each file, run the full colour-scheme check:

- Any `gray-*`, `slate-*`, or `neutral-*` Tailwind palette class → wrong grey family, replace with a token.
- Any manual `dark:` variant → delete it, tokens handle dark mode automatically.
- Any `bg-white`, `text-black`, `bg-gray-50`, `border-gray-200`, etc. → replace with surface/border tokens (`--card`, `--card-border`, `--card-fg`, `--overlay`, `--border`, etc.).
- Any hardcoded colour that should be a semantic token (e.g. `text-red-600` for a destructive label → `text-(--danger)`).

A component file with no MUI imports is not automatically clean. Colour violations are just as common in pure-Tailwind files that were written before the token system existed.

All violations — from the target page file and from every component file — go into a single unified audit list. Prefix each entry with the filename so it's clear where the fix lives:

```
[war-defense2.tsx L106] Colors: text-slate-500 → text-(--soft-fg)
[deployment-zone.tsx L38] Colors: border-gray-200 bg-gray-50 → border-(--card-border) bg-(--card)
```

Walk each file top to bottom and produce this list. It is both your work plan and what you'll show the user at the end.

Format each entry as:

```
[L<line>] <category>: <current> → <replacement>
```

A worked example, on a hypothetical snippet:

```tsx
// before
<div className="mx-auto max-w-4xl p-4">
    <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Goals</h1>
    <Stack direction="row" sx={{ gap: 2, mb: 2 }}>
        {hasFilters && <button className="rounded bg-blue-500 px-3 py-1 text-white">Clear</button>}
        <Switch checked={showCompleted} onChange={e => setShowCompleted(e.target.checked)} />
    </Stack>
    <div className="rounded border border-slate-200 bg-white p-4 dark:bg-slate-800">{/* ... */}</div>
</div>
```

Audit:

```
[L1] Layout: `p-4 max-w-4xl mx-auto` on root → remove all three. The shell already pads horizontally; tables/grids should fill width.
[L1] Layout: missing `py-6` and `space-y-8` → add to root.
[L2] Styling: inline `style={{ fontSize, fontWeight }}` → `<h2>` (page heading style is global, no inline style needed).
[L2] Layout: no heading block → wrap heading + description per conventions.md "Page root".
[L3] Styling: MUI `Stack` with `sx={{ gap: 2, mb: 2 }}` → plain `<div className="flex gap-2 mb-2">` (Stack is unnecessary when Tailwind covers it).
[L4] Layout: Clear button rendered conditionally → always render with `isDisabled={!hasFilters}`.
[L4] Component: raw `<button>` for a real action → `<Button>` from `@/fsd/5-shared/ui`.
[L4] Component: MUI `Button component={Link}` → `<LinkButton>` from `@/fsd/5-shared/ui/link`.
[L4] Component: MUI `IconButton` → `<Button size="square-petite" appearance="plain">` with Lucide icon.
[L4] Colors: `bg-blue-500 text-white` → `<Button>` default styling (don't reach for tokens directly when the component handles it).
[L5] Component: MUI Switch with `checked` / `onChange={e => ...}` → shared `<Switch>` with `isSelected` / `onChange={setShowCompleted}` (react-aria signature, not DOM event).
[L7] Colors: `border-slate-200 bg-white dark:bg-slate-800` → `border-(--border) bg-(--card)`. The `dark:` variant goes away — tokens flip automatically.
```

If the audit comes back genuinely empty, tell the user the file already matches the design system and stop. Don't invent violations to justify the work.

### What to look for

The categories below are the ones that show up over and over. Use conventions.md for the full token table and component list — the items here are the common failure modes, not an exhaustive list.

**Colors**

- Tailwind palette classes (`bg-blue-*`, `text-gray-*`, `border-slate-*`, `bg-white`, `text-black`, etc.) → token equivalents. Common mappings: white → `--bg`, zinc-950 → `--fg`, zinc-600 → `--soft-fg`, zinc-200 → `--border`, zinc-300 → `--input-border`, indigo → `--primary`.
- **Wrong grey family** — the design system uses `zinc`. Any `gray-*`, `slate-*`, or `neutral-*` Tailwind palette class is a violation, even in files that have no MUI imports at all. Replace with the appropriate token (`--card-fg`, `--soft-fg`, `--border`, etc.).
- Manual `dark:` variants → delete them. Tokens already handle dark mode and the two will fight each other. A file can have zero MUI imports and still be full of `dark:` violations — always check.
- `hover:bg-(--neutral)` on buttons inside cards or tables → these look invisible in dark mode because `--neutral` _is_ the card surface in dark mode. Use `hover:bg-(--primary)/15` for neutral actions or `hover:bg-(--danger)/10` for destructive ones.
- `bg-(--neutral)` as a progress track → same problem; use `bg-(--fg)/12` for overlaid tracks.

(Inline `style={{ color: ... }}` and `sx={{ color: ... }}` are covered in **Styling approach** below.)

**Components**

These have shared replacements; reach for them rather than rebuilding:

- Raw `<button>` for a real action → `<Button>` from `@/fsd/5-shared/ui` (uses `onPress`, not `onClick` — react-aria, not DOM)
- MUI `Button component={Link}` (navigation button) → `<LinkButton>` from `@/fsd/5-shared/ui/link` (same props as `Button`: intent, appearance, size, shape). **Do not add `className="no-underline"`** — it is already baked into `buttonStyles` base and is a no-op on `<button>` elements. If you see an existing `className="no-underline"` on a `LinkButton`, remove it.
- MUI `IconButton` → `<Button size="square-petite" appearance="plain">` with a Lucide icon using `data-slot="icon"`
- MUI `TextField` or raw `<input>` → `<TextField>` from `@/fsd/5-shared/ui`
- MUI `Switch` → `<Switch>` from `@/fsd/5-shared/ui/switch` (uses `isSelected`, not `checked`)
- MUI `Chip` for filters → the token-aware chip pattern from conventions.md "Rarity / tag chips"
- MUI `Menu` + `MenuItem` for a dropdown → headlessUI `Listbox` with token classes (conventions.md "Custom single-value dropdown")
- MUI `Tooltip` → `<AccessibleTooltip>` or `<LazyTooltip>`
- MUI `Accordion` → `<Accordion>` + `<AccordionHeader>` + `<AccordionBody>` from `@/fsd/5-shared/ui`. Note: `AccordionSummary` → `AccordionHeader`, `AccordionDetails` → `AccordionBody`. The `expandIcon` prop is removed (shared component manages its own chevron). MUI `onChange={(e, expanded) => ...}` → `onToggle={(expanded) => ...}` (no event param). If multiple accordions are stacked (no gap between them), wrap them with the accordion group classes and use controlled mode for mutual exclusivity — see conventions.md "Accordion group (stacked, mutually exclusive)".
- MUI `Card` → `<Card>` from `@/fsd/5-shared/ui/card`
- MUI `Divider` → `<Separator>`. For labeled dividers, pass children: `<Separator>Section Label</Separator>`
- MUI `CircularProgress` / `LinearProgress` → `<Loader>` or the token ProgressBar pattern
- Raw `<select>` for rarity / rank / stars / faction → `RaritySelect` / `RankSelect` / `StarsSelect` / `FactionSelect` from `@/fsd/5-shared/ui/selects`. For custom selects use the generic `Select<T>`, `SelectMulti<T>`, `ComboBox<T>`, `ComboBoxMulti<T>` primitives.
- MUI `Select` with `MenuItem`s that have icons → `SelectMulti<T>` with `renderOption` (icon + text for dropdown) and `renderValue` (compact icons for trigger). See the "Icon-rich multi-select" pattern in conventions.md. Available icon components: `MiscIcon` (damage types via `damage${name}` key), `TraitImage` (trait enum), `ComponentImage` (alliance), `RarityIcon`, `FactionImage`.
- MUI `Dialog` → **depends on content.** If the dialog contains shared `Select`, `ComboBox`, `UnitsAutocomplete`, or any portaled dropdown, use the custom portal dialog pattern (conventions.md "Form dialog"). If it's a simple confirmation dialog with only text/buttons, use the shared `Modal` from `@/fsd/5-shared/ui`. The shared Modal's react-aria focus trap blocks portaled dropdowns — this is the deciding factor.
- MUI `Select` with simple `MenuItem`s (no icons) → shared `Select<T>` with `options`, `value`, `onChange`, `renderOption`, `label`. The shared Select uses Headless UI Listbox internally.
- MUI info icons (`InfoIcon` from `@mui/icons-material`) → Lucide `Info` from `lucide-react`.

**Styling approach**

The codebase is migrating to Tailwind classes; `style={{...}}` and MUI's `sx` prop are both legacy and should go. See the "Always in scope" tier in the Code quality bar below for the full `sx` → Tailwind migration policy. In short:

- Inline `style={{ color: ..., background: ..., fontSize: ..., margin: ... }}` → token class or Tailwind utility
- Plain-property `sx={{ display: 'flex', gap: 2 }}` → Tailwind classes (`className="flex gap-2"`)
- Responsive `sx={{ p: { xs: 1, md: 3 } }}` → Tailwind responsive (`className="p-2 md:p-6"`)
- Theme-referenced `sx={{ color: 'primary.main' }}` → token class (`text-(--primary)`)
- Selector-based `sx={{ '& .MuiButton-root': {...} }}` → leave and flag in summary

**Layout**

- Filter toggles, chips, and clear button crammed onto one row → split per conventions.md "Filter bar header pattern": Switch + Clear in the header row, chips/search in the body.
- Clear button rendered conditionally → always render with `isDisabled={!hasFilters}`.
- Missing page heading → add `<h2>` + `<p className="text-sm text-(--soft-fg)">`.

_Mobile responsiveness_ — the page must work at ~300px (phone) as well as full desktop width. Two failure modes come up constantly:

- **Control bar overflow** — a `flex` row containing multiple buttons, labels, selects, or sliders with no `flex-wrap` will overflow horizontally on mobile. Add `flex-wrap` so controls reflow to a second line.
- **Card min-width wider than phone screen** — a card with `min-w-[400px]` (or similar) sitting in a `flex-wrap` grid will cause horizontal scroll on a 300px phone even if the zoom slider scales the content inside. The fix is responsive: `w-full sm:w-auto sm:min-w-[400px]`. Mobile gets full-width stacking; desktop restores the original min-width so cards wrap naturally in rows. **Do not use `w-full` alone** — it forces all cards to stack full-width on desktop too.

**Page layout & alignment**

The shell wraps every outlet in `mx-5 my-2.5`. Pages that double-pad either look indented from everything else or run out of width on tables. Common fixes:

- `px-*` or `mx-*` on the page root → remove. The shell handles horizontal padding.
- `max-w-*` on the page root, with a table or card grid as content → remove. These content types should fill width.
- Missing `max-w-2xl` / `max-w-3xl` on a form or text-heavy page → add it to the _inner_ content container (the form, the prose block), not the root.
- Content centered when it should be left-aligned → remove the centering. Default is left-aligned. Centering is intentional for empty states and large single-stat displays only.
- Numbers in table cells without `text-right tabular-nums` → add both.
- Action cluster in a filter row not pushed right → wrap in `<div className="flex flex-1 items-center justify-end gap-3">`.

**Typography**

- Section labels styled ad-hoc (raw `text-base font-bold` etc.) → use the scale in conventions.md "Typography scale".
- `font-weight: 700` / `font-bold` literal → match the typography scale's `font-semibold` / `font-bold` choices.

(Inline `style={{ fontSize: ... }}` and `sx={{ fontWeight: ... }}` are covered in **Styling approach** above.)

---

## Code quality bar

This is an open-source project and the existing code quality is uneven. The point of a refactor PR isn't only to fix design-system violations — it's also a good moment to pay down some of the rough edges in the file you're already touching. **Light cleanup is in scope by default.** If the user says "just the visuals", you can suppress it; otherwise, do the cleanup pass.

The principle: every diff hunk should be either (a) a design-system fix, (b) an obvious cleanup with no blast radius, or (c) called out in your summary as something you noticed but didn't change. Anything that doesn't fit one of those three buckets shouldn't be in the PR.

Four tiers:

**1. Always in scope, no flag needed.** Pure wins, do them silently:

- Remove unused imports
- Remove dead code (functions/variables that aren't referenced)
- Remove `console.log` and other debugging statements
- Remove commented-out blocks
- Migrate `style={{...}}` and MUI `sx={{...}}` to Tailwind `className` — both are legacy. Policy for `sx`:
    - Plain property `sx={{ display: 'flex', gap: 2, p: 3 }}` → Tailwind classes (`className="flex gap-2 p-3"`)
    - Responsive `sx={{ p: { xs: 1, md: 3 } }}` → Tailwind responsive (`className="p-2 md:p-6"`)
    - Theme-referenced `sx={{ color: 'primary.main' }}` → token class (`className="text-(--primary)"`)
    - Selector-based `sx={{ '& .MuiButton-root': {...} }}` → leave it and flag in summary. If you're also swapping the MUI component for a shared one, the override is probably going away anyway.

**2. In scope when you're already editing that area.** If your hand is already on the keyboard in this hunk, improve it:

- A poorly-named local variable inside a function you're already changing → rename it (update local references too)
- Inline computation in a JSX block you're rewriting anyway → lift to `useMemo`
- An awkwardly-defined handler attached to a component you're swapping → clean up the handler shape
- A literal magic number in a class you're already touching → extract or comment it

The qualifier matters. Don't go hunting — if you're editing a hunk and the cleanup is right there, do it. If you'd have to navigate to another part of the file, don't.

**3. Flag, don't fix.** Things you noticed but have enough blast radius that the user should decide:

- Renaming exported symbols (other files import them)
- Restructuring component composition (props would need to flow differently)
- Splitting the file (extracting a hook or sub-component)
- A 50-line function with multiple responsibilities that would benefit from being broken up
- Duplicated computation that could share a helper

List these in your final summary as "noticed but didn't change — happy to address in a follow-up or as part of this PR if you want."

**4. Hard out of scope.** Don't touch under any circumstance, even if you spot something wrong:

- Business logic, algorithms, computed values
- `useEffect` / `useMemo` dependency arrays
- Event handler behavior
- Anything that changes what the page _does_

If you spot a real bug in this category while reading, surface it in the summary as a separate note. Don't fix it under the cover of a visual refactor — that makes the PR harder to review and harder to revert if something breaks.

The mental model for a reviewer: when they look at the diff, every hunk should be either obviously a design-system migration, obviously a no-brainer cleanup, or absent (because you flagged it instead of touching it).

---

## Apply the changes

**Targeted refactor** (default): use `Edit`. Work in passes so the diff stays readable — imports first, then colors, then component swaps, then layout. One logical group at a time.

**Full rebuild** (`rebuild` was in args): extract every piece of logic from the original — state declarations, `useMemo` blocks, `useContext`, handlers, computed values — and copy them verbatim to the top of the new file. Then rewrite _only_ the JSX. Use `Write` to replace the file.

**The constraint that doesn't bend, regardless of mode:** business logic stays untouched. Don't rename variables. Don't refactor handlers. Don't "clean up" `useMemo` dependencies. Don't optimize. If you spot a real bug while reading, mention it in the final summary as a separate note — don't fix it under the cover of a visual refactor.

---

## Fix imports

After swapping components, the import list will have unused MUI imports and missing shared-component imports. Clean it up:

- Remove MUI imports for anything you replaced.
- Add the new shared imports.
- Watch for type imports — sometimes the MUI line was also providing a type (like `SelectChangeEvent`) used elsewhere. If TypeScript complains, that's the cause.

---

## CI checks

The PR will run these on GitHub. Run them locally first, in order:

```bash
# 1. Formatting
npm run format-ci

# 2. Lint (errors only)
npm run lint-ci

# 3. TypeScript
npx tsc --noEmit 2>&1 | grep "error" | head -30

# 4. Tests
npm run test
```

Common failures specific to this kind of refactor:

- `Button` uses `onPress`, not `onClick`. React-aria signature.
- `Switch` uses `isSelected`, not `checked` or `value`. The `onChange` receives the boolean directly, not a DOM event.
- `RaritySelect` / `RankSelect` / `StarsSelect` expect the typed enum (`Rarity`, `Rank`, `RarityStars`), not raw `number`. If TypeScript complains, cast at the boundary.
- Prettier may rewrite files you didn't touch if they were already malformatted — run `npm run format` to auto-fix.

Don't report done until all four pass.

---

## What to tell the user

1. The audit list from the start of the work — what was wrong and where. This is the most useful part of the summary; the user can see at a glance whether you caught everything.
2. What you changed (and which mode — targeted vs rebuild).
3. Anything you didn't migrate cleanly: missing component equivalent, ambiguous case worth a design call, real bug you spotted but left alone.
4. CI result.
