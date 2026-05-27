---
name: build-page
description: Scaffold a new page in the Tacticus Planner FSD app. Use when the user says "build page", "create page", "new page", or gives a page name and describes what it should do.
argument-hint: <page-name> "<what it does>"
allowed-tools: Read Glob Grep Write Edit Bash
---

You are building a page in **Tacticus Planner**. The user has asked: **$ARGUMENTS**

If `$ARGUMENTS` is empty or you can't tell what the page should do, ask the user before proceeding. Guessing here costs more than the round-trip.

---

## Read these first, in parallel

These four files are non-optional context. The skill instructions below are deliberately thin in places where these files are authoritative — you need them loaded.

```
Read: CONVENTIONS.md
Read: src/fsd/1-pages/ui-kit/ui-kit.page.tsx
Read: src/fsd/0-app/routing/desktop-routes.tsx
Read: src/models/menu-items.tsx
```

Then read **one** existing page that's structurally similar to what you're building. Skim a few candidates first if you're not sure:

- Dashboard / cards / summary → `src/fsd/1-pages/home/desktop-home.tsx`
- List / table / multi-step workflow → `src/routes/goals/goals.tsx`
- Raids / data-heavy planning → `src/routes/tables/daily-raids.tsx`
- Lookup / reference table → find one under `src/fsd/1-pages/` with Glob
  The point is to copy patterns that already work, not invent new ones. If something the user wants doesn't fit any existing pattern, flag it and discuss before writing — that's a design decision, not a coding decision.

---

## Decide the URL section first

Routing is split into three sections, each backed by its own routes array and submenu. Picking the wrong one means the page won't appear in the right nav group, so make this decision up front:

- **Data entry / roster management** → `/input/` → `globalInputRoutes` → `inputSubMenu`
- **Planning / optimisation / calculation** → `/plan/` → `globalPlanRoutes` → `planSubMenuWeb`
- **Lookup / reference / library** → `/learn/` → `globalLearnRoutes` → `learnSubMenu`
  If the page does two of these (e.g., shows a reference table but also edits inventory), pick the section that matches the user's _primary_ intent and mention the trade-off in your summary.

---

## Code quality bar

This is an open-source project and the existing code quality is uneven — some pages are clean, others have grown over time and show it. **Don't take "what's nearby" as the standard.** The canon is conventions.md and the reference pages you read at the top of this skill (`ui-kit.page.tsx` and the structurally-similar page you picked). Those are the patterns to copy. If a closer neighbour does it differently and worse, that's not a reason to match them.

Specifics for a new page:

- **Name things concretely.** `selectedRarities` over `filters`. `handleRarityToggle` over `onClick`. `isLegendaryUnlocked` over `flag`. Single-letter names are fine in tight scopes (`map((c) => ...)`); anywhere else, spell it out.
- **Keep render code declarative.** If a piece of JSX is computing things inline (`{characters.filter(c => c.rank > 5 && c.faction === 'X').sort(...).map(...)}`), lift the computation into a `useMemo` above the return. Render reads top-to-bottom; logic shouldn't be hiding in the middle of a JSX tree.
- **Hoist constants out of the component.** Option lists, label maps, column definitions — if they don't depend on props or state, define them at module scope. Re-creating them on every render is wasteful and noisy.
- **One concern per block.** Group related state together with a blank line between groups. Group `useMemo`s with what they depend on. Handlers below state, JSX last. This isn't a rule for its own sake — it's so the reader can scan the file's shape before reading any of it.
- **Styling goes in `className` with Tailwind.** No `style={{ ... }}` and no MUI `sx` prop — both are legacy in this codebase. Even small one-offs like `style={{ marginTop: 8 }}` should be `className="mt-2"`. The shared components and conventions.md tokens cover the cases you'll hit.
- **Don't leave debris.** No `console.log`, no commented-out blocks, no `// TODO: revisit this` without a reason and an owner, no unused imports. If something is genuinely unfinished, mention it in your final summary so the user can decide.
- **No premature abstraction.** If you find yourself writing a wrapper hook around a single `useState`, or extracting a 3-line component "for clarity", stop. Inline it. Wait for the second use case before generalising.
  If you're about to write something that violates any of these, pause and ask. Usually the right answer is "follow the convention" but occasionally there's a reason to deviate and the user will want to weigh in.

---

## Write the files

At minimum, three: the page, its route, and its menu item. Add others only when the page genuinely needs them — a hook for non-trivial state logic, a sub-component for a card or modal that's reused or too big to read inline, a `types.ts` if there's enough domain shape to share. Resist splitting until there's a reason. A 200-line page with two `useMemo` blocks and a handful of handlers doesn't need to become five files; it needs to be one readable file.

If you do add extra files, keep them in the same `src/fsd/1-pages/{name}/` directory. Naming: `{name}.hooks.ts`, `{name}.types.ts`, or descriptive component names like `{name}-filter-bar.tsx`. Match what the neighbouring pages do.

### 1. `src/fsd/1-pages/{name}/{name}.tsx`

**Export shape**

- Named export: `export const PageName = () => { ... }`. The route file imports it by name.
  **Page root**

- The root element is `<div className="space-y-8 py-6">`. Vertical spacing only — `py-6` for breathing room, `space-y-8` between top-level sections.
- **No horizontal padding on the root** and **no `max-w-*` on the root**. The shell (`desktop-app.tsx`) already wraps every outlet in `mx-5 my-2.5`, and there is no global content max-width. Tables and card grids are expected to fill the full available width.
- If a _specific_ inner container needs constraint (a form, a text-heavy reference block), put `max-w-2xl` or `max-w-3xl` on that container — not the root. See conventions.md "When to constrain width" for the full mapping of content type → strategy.
- Content is left-aligned by default. Centering is reserved for empty states and large single-stat displays. See conventions.md "Content alignment rules".
  **Heading**

Every page opens with a heading block:

```tsx
<div>
    <h2>Page Title</h2>
    <p className="text-sm text-(--soft-fg)">One line description.</p>
</div>
```

**Colors and tokens**

All colors come from design tokens — `bg-(--primary)`, `text-(--soft-fg)`, `border-(--border)`, etc. The full token table is in conventions.md. Tailwind palette classes like `bg-blue-500`, `text-gray-600`, or `border-slate-200` will fail review because they don't respond to the dark/light theme switch. Same for inline `style={{ color: ... }}`. If you're reaching for a literal color and can't find a token for it, that's a signal to stop and ask — the design system is opinionated and intentional gaps are rare.

**Components**

- Generic UI components: import from `@/fsd/5-shared/ui` (Button, TextField, Switch, Badge, Card, Modal, Separator, AccessibleTooltip, Loader, …). The full list is in conventions.md.
- Domain selects: import from `@/fsd/5-shared/ui/selects` — `RaritySelect`, `RankSelect`, `StarsSelect`, `FactionSelect`. Generic primitives: `Select<T>`, `SelectMulti<T>`, `ComboBox<T>`, `ComboBoxMulti<T>`.
- Icons: MUI from `@mui/icons-material/` or Lucide from `lucide-react`. Check the surrounding pages for which one's in use and stay consistent. Pick an icon that actually relates to the page's purpose (e.g., a database/inbox icon for data entry, a target/compass for planning, a book/library for reference) — not the first one that comes to mind.
  **Filter bars**

Two-row layout: the Switch toggles and the Clear button live in the header row; chips and search inputs go in the body. Cramming everything onto one line breaks at narrow widths and the rest of the app doesn't do that. See the "Filter bar header pattern" block in conventions.md for the exact markup.

The Clear button is _always rendered_, with `isDisabled={!hasFilters}` controlling its state — not `{hasFilters && <Button>Clear</Button>}`. Conditional rendering causes layout shift when filters are applied/cleared, which is jarring.

**Store access**

If the page reads from the global store:

```tsx
import { useContext } from 'react';
import { StoreContext } from 'src/reducers/store.provider';
```

Because this import crosses FSD layer boundaries, add both ESLint disables at the top of the file:

```tsx
/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
```

Without both, lint will fail in CI.

### 2. `src/fsd/1-pages/{name}/{name}.route.tsx`

```tsx
import { RouteObject } from 'react-router-dom';

export const {camelName}Route: RouteObject = {
    path: '{section}/{name}',
    async lazy() {
        const { {PascalName} } = await import('./{name}');
        return { Component: {PascalName} };
    },
};
```

The route uses `lazy()` so the page bundle only loads when navigated to. Every other route does this; matching the pattern keeps the bundle splitter happy.

### 3. `src/fsd/1-pages/{name}/{name}.menu-item.tsx`

Before writing this, glob a neighbouring menu-item file to confirm whether this codebase uses `MenuItem` or `MenuItemTP` — there's been a migration in flight and you want to match what the adjacent files use, not what you remember.

```tsx
import SomeIcon from '@mui/icons-material/SomeIcon';
import { MenuItem } from '@/models/menu-item';

export const {camelName}MenuItem = new MenuItem(
    '{Label}',
    <SomeIcon />,
    '/{section}/{name}'
);
```

---

## Registration — show the diff, don't apply silently

`desktop-routes.tsx` and `menu-items.tsx` are shared across every page in the app. **Show the user the exact diffs and ask before editing them.** Don't just edit — these files are the kind of thing where a bad merge or a typo breaks the whole nav.

**`src/fsd/0-app/routing/desktop-routes.tsx`**

```ts
import { {camelName}Route } from '@/fsd/1-pages/{name}/{name}.route';

// add to global{Section}Routes:
{camelName}Route,
```

**`src/models/menu-items.tsx`**

```ts
import { {camelName}MenuItem } from '@/fsd/1-pages/{name}/{name}.menu-item';

// add to menuItemById:
{name}: {camelName}MenuItem,

// add to {section}SubMenu:
menuItemById['{name}'],
```

If the user says "yes, go ahead", apply them with `Edit`. Otherwise leave them as a snippet the user can apply.

---

## CI checks — run them and fix what fails

The PR will run these on GitHub. Run them locally first, in this order. Replace `<PAGE_NAME>` in the tsc command with the actual page name (e.g., `home`, `goals`) so the grep filters to your file:

```bash
# 1. Formatting
npm run format-ci

# 2. Lint (errors only)
npm run lint-ci

# 3. TypeScript — replace <PAGE_NAME> with your page name
npx tsc --noEmit 2>&1 | grep -E "(error|<PAGE_NAME>)" | head -30

# 4. Tests
npm run test
```

If any fail, fix and rerun. The task isn't done until all four pass. If a failure is in a file you didn't touch (Prettier sometimes reformats stale files), run `npm run format` to auto-fix and continue.

---

## What to tell the user when done

A short summary, not a celebration:

1. The files you created, with paths
2. The two registration snippets (or confirm you added them if the user said yes)
3. Non-obvious choices: which icon, which URL section, which store fields, any pattern you copied from a specific existing page
4. CI result — which checks passed, and if anything was tricky to fix, what it was
