---
name: build-page
description: Scaffold a new page in the Tacticus Planner FSD app. Use when the user says "build page", "create page", "new page", or gives a page name and describes what it should do.
argument-hint: <page-name> "<what it does>"
allowed-tools: Read Glob Grep Write Edit Bash
---

You are building a page in **Tacticus Planner**. The user has asked: **$ARGUMENTS**

If `$ARGUMENTS` is empty, stop and ask. Don't guess.

---

## Before you write a single line of JSX

Read ALL of these. In parallel. No excuses.

```
Read: .claude/skills/build-page/conventions.md
Read: src/fsd/1-pages/ui-kit/ui-kit.page.tsx
Read: src/fsd/0-app/routing/desktop-routes.tsx
Read: src/models/menu-items.tsx
```

Then read **one** existing page that's structurally similar to what you're building:
- Dashboard / cards / summary → `src/fsd/1-pages/home/desktop-home.tsx`
- List / table / goals workflow → `src/routes/goals/goals.tsx`
- Raids / data-heavy planning → `src/routes/tables/daily-raids.tsx`
- Lookup / reference table → find one under `src/fsd/1-pages/` with Glob

You are not allowed to invent patterns. If it's in the UI kit, use it. If it's not, ask.

---

## Decide the URL section before touching anything

- Data entry / roster management → `/input/` → `globalInputRoutes` → `inputSubMenu`
- Planning / optimisation / calculation → `/plan/` → `globalPlanRoutes` → `planSubMenuWeb`  
- Lookup / reference / library → `/learn/` → `globalLearnRoutes` → `learnSubMenu`

Wrong section = broken nav. Think for two seconds.

---

## Write exactly three files

### 1. `src/fsd/1-pages/{name}/{name}.tsx`

- Named export. `export const PageName = () => {}`
- Page root is `<div className="space-y-8 py-6">`. Not `space-y-4`. Not `p-4`. Not a div with inline style.
- **No horizontal padding on the root.** The shell (`desktop-app.tsx`) already applies `mx-5` around the outlet. Adding `px-*` or `mx-*` on the root double-pads the page.
- **No `max-w-*` on the root.** Tables and card grids fill all available width. Only put `max-w-2xl` / `max-w-3xl` on the specific inner container that needs it (a form, a text block). See conventions.md "When to constrain width".
- **Left-align content by default.** Centering is intentional for empty states and large single-stat displays only. See conventions.md "Content alignment rules".
- Always start with a heading block:
  ```tsx
  <div>
      <h2>Page Title</h2>
      <p className="text-sm text-(--muted-fg)">One line description.</p>
  </div>
  ```
- **Design tokens only.** `bg-blue-500` will be rejected. `text-gray-600` will be rejected. `border-slate-200` will be rejected. Use `bg-(--primary)`, `text-(--muted-fg)`, `border-(--border)`. Every single color. No exceptions.
- Import components from `@/fsd/5-shared/ui`. The Button is there. The TextField is there. The Switch is there. Use them.
- For domain selects import from `@/fsd/5-shared/ui/selects`. `RaritySelect2`, `RankSelect2`, `StarsSelect2`, `FactionSelect2`. They exist. Use them.
- Filter bars: Switch and Clear go in the **header row**. Chips and search go in the **body**. Do not cram everything on one line and wonder why it breaks at 320px.
- Clear button is **always rendered**. `isDisabled={!hasFilters}`. Never `{hasFilters && <Button>Clear</Button>}`. Never.
- Need store data? `import { StoreContext } from 'src/reducers/store.provider'` and add the ESLint disables at the top of the file — `boundaries/element-types` and `import-x/no-internal-modules`. Yes, both.
- Icons: MUI from `@mui/icons-material/` or Lucide from `lucide-react`. Check what the surrounding pages use. Be consistent.

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

Lazy load. Always. The bundle is already big enough.

### 3. `src/fsd/1-pages/{name}/{name}.menu-item.tsx`

Check a neighbouring menu-item file to confirm whether this codebase uses `MenuItem` or `MenuItemTP`. Then use that one.

```tsx
import SomeIcon from '@mui/icons-material/SomeIcon';
import { MenuItem } from '@/models/menu-item';

export const {camelName}MenuItem = new MenuItem(
    '{Label}',
    <SomeIcon />,
    '/{section}/{name}'
);
```

Pick an icon that actually relates to the page. Not just `StarIcon` because it was the first one you thought of.

---

## Registration — show the user exactly what to add

Print the exact diffs. Don't make them figure it out.

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

Ask the user if they want you to make these edits directly. Do not just make them without asking — those files affect every page in the app.

---

## TypeScript check — non-negotiable

```bash
npx tsc --noEmit 2>&1 | grep -E "(error|{name})" | head -30
```

Do not report the task as done until this passes. If it fails, fix it. That's the job.

---

## What to tell the user when done

1. The three files you wrote and where they are
2. The two registration snippets (or confirm you added them if they said yes)
3. Any non-obvious choices you made — icon, URL section, which store fields you used
4. TypeScript result
