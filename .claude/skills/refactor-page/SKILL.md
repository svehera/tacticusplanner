---
name: refactor-page
description: Refactor or rebuild an existing page to match the current design system. Use when the user says "refactor", "redesign", "update to new style", "migrate to tokens", or points at a page that looks like it was written in 2021.
argument-hint: <page-path-or-name> ["rebuild" for full JSX rewrite | default: targeted refactor]
allowed-tools: Read Glob Grep Write Edit Bash
---

You are fixing a page in **Tacticus Planner** that doesn't match the design system. The user has asked: **$ARGUMENTS**

---

## Find the file first

If a full path wasn't given, find it:
```
Glob: src/fsd/1-pages/**/{name}.tsx
```

If you get multiple matches, ask. Don't pick one and hope for the best.

Also check if `rebuild` appears in `$ARGUMENTS`. If yes: full JSX rewrite, logic untouched. If no: targeted in-place edits.

---

## Read before you touch anything

All of these. In parallel.

```
Read: .claude/skills/build-page/conventions.md
Read: src/fsd/1-pages/ui-kit/ui-kit.page.tsx
Read: {target file}
```

You do not get to skim. Read the whole target file. Understand what it does, what state it manages, what store fields it uses, what the event handlers do. You are not allowed to break any of that.

---

## Audit — write this out before making a single edit

Go through the file and list every violation. Be specific — file and approximate line, not just "there are hardcoded colors".

### Colors (fix all of them, no mercy)
- `bg-blue-*`, `bg-white`, `bg-gray-*`, `bg-slate-*` → token equivalents
- `text-gray-*`, `text-slate-*`, `text-black`, `text-white` → token equivalents  
- `border-slate-*`, `border-gray-*` → `border-(--border)`
- `dark:bg-*` / `dark:text-*` manual dark variants → delete them, tokens handle dark mode
- `style={{ color: '...' }}`, `style={{ background: '...' }}` → className with token
- `hover:bg-(--secondary)` on buttons inside cards/tables → invisible in dark mode (`--secondary` = card surface). Use `hover:bg-(--primary)/15` for neutral actions, `hover:bg-(--danger)/10` for destructive
- Map: white→`--bg`, zinc-950→`--fg`, zinc-600→`--muted-fg`, zinc-200→`--border`, zinc-300→`--input`, indigo→`--primary`, zinc-100→`--secondary`

### Components (replace where a shared component exists)
- Raw `<button>` as a real action → `<Button>` from `@/fsd/5-shared/ui`
- MUI `TextField` / raw `<input>` → `<TextField>` from `@/fsd/5-shared/ui`
- MUI `Switch` → `<Switch>` from `@/fsd/5-shared/ui/switch`
- MUI `Chip` for filters → token-aware chip pattern (see conventions.md)
- MUI `Menu` + `MenuItem` for a dropdown → headlessUI `Listbox` with token styles
- MUI `Tooltip` → `<AccessibleTooltip>` or `<LazyTooltip>`
- MUI `Card` → `<Card>` from `@/fsd/5-shared/ui/card`
- MUI `Divider` → `<Separator>`
- MUI `CircularProgress` / `LinearProgress` → `<Loader>` or the token ProgressBar pattern
- Raw `<select>` for rarity / rank / stars / faction → the domain select components

### Layout (fix what you see)
- Filter toggles and chips crammed on the same row → split: controls in header, values in body
- Clear button rendered conditionally → always render it, `isDisabled={!hasFilters}`
- No page heading → add `<h2>` + `<p className="text-sm text-(--muted-fg)">`
- Section labels styled inconsistently → `text-xs font-bold tracking-widest uppercase text-(--muted-fg)`
- `margin` / `padding` inline styles for spacing → `space-y-*`, `gap-*`

### Page layout & alignment (check these too)
The shell (`desktop-app.tsx`) wraps every outlet in `mx-5 my-2.5`. Pages must NOT double-pad.

- `px-*` or `mx-*` on the page root div → remove it; the shell already handles horizontal padding
- `max-w-*` on the page root wrapping a table or card grid → remove it; these content types should fill all available width
- Missing `max-w-2xl` / `max-w-3xl` on a form or text-heavy page → add it to the inner content container, not the root
- Content centered when it should be left-aligned → remove centering; default is left-aligned. Only empty states and large single-stat displays are intentionally centered
- Numbers in table cells without `text-right tabular-nums` → add both
- Action cluster in filter row not pushed right → wrap in `<div className="flex flex-1 items-center justify-end gap-3">`

### Typography
- `style={{ fontSize: '...' }}` → use the scale from conventions.md
- `style={{ fontWeight: 'bold' }}` → `font-semibold`

If the audit comes back clean, tell the user and stop. Don't invent problems.

---

## Apply the changes

**Targeted refactor:** Use `Edit`. Work in passes — imports first, then colors, then component swaps, then layout. One logical group at a time so the diff stays readable.

**Full rebuild:** Extract every piece of logic (state declarations, useMemo, useContext, handlers, computed values) and copy it verbatim to the top of the new file. Then rewrite only the JSX from scratch. Use `Write` to replace the file. The logic must be byte-for-byte identical — you are not "improving" the algorithm, you are fixing the UI.

**The rule that isn't negotiable:** Do not change business logic. Do not rename variables. Do not refactor handlers. Do not "clean up" useMemo dependencies. You were asked to fix the visuals. Fix the visuals.

---

## Fix your imports

After swapping components, the import list will be wrong. Fix it:
- Remove MUI imports for anything you replaced
- Add the shared component imports you used
- Don't leave unused imports — TypeScript will yell and you'll deserve it

---

## CI checks — run them all, fix them all, then run them again

Run the same checks GitHub will run on the PR, in order:

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

Common traps you will fall into:
- You removed a MUI import that was also providing a type — find where the type is now needed and fix the import
- `Button` uses `onPress`, not `onClick` — react-aria, not HTML
- `Switch` uses `isSelected`, not `checked` or `value`
- `RaritySelect2` / `RankSelect2` / `StarsSelect2` want `Rarity` / `Rank` / `RarityStars` typed values, not raw `number`
- Prettier will reject files you never touched if they were already malformatted — run `npm run format` to auto-fix, then commit

Do not report done until all four pass.

---

## Tell the user what happened

1. Paste the audit list you produced — what was wrong and where
2. Confirm what you changed
3. Call out anything you could not migrate cleanly — missing component equivalent, too risky to touch, needs a separate decision
4. TypeScript result
