# Convention Violations Backlog

Pages and files that violate `CONVENTIONS.md`. Work through these when refactoring a file you're already editing — don't touch rank/rarity background classes (see conventions).

---

## 1. Legacy `.flex-box` classes

Replace with Tailwind equivalents (see conventions §Legacy global utility classes).

- [ ] `src/fsd/1-pages/plan-lre/lre-edit-team.tsx` (~10 instances)
- [ ] `src/fsd/1-pages/plan-lre/lre-add-team.tsx` (~10 instances)
- [ ] `src/fsd/1-pages/plan-lre/le-progress.tsx` (4 instances)
- [ ] `src/fsd/1-pages/plan-lre/lre-sections-settings.tsx`
- [ ] `src/fsd/1-pages/plan-lre/track-requirement-check.tsx`
- [ ] `src/fsd/1-pages/plan-lre/selected-teams-card.tsx`
- [ ] `src/fsd/1-pages/guild-war-offense/guild-war-offense.tsx` (~12 instances)
- [ ] `src/fsd/1-pages/guild/guild.tsx`
- [ ] `src/fsd/1-pages/guides/guides.tsx` (7 instances)
- [ ] `src/fsd/1-pages/learn-campaigns/campaigns.tsx` (3 instances)
- [ ] `src/fsd/1-pages/learn-characters/rank-lookup.tsx` (6 instances)
- [ ] `src/fsd/1-pages/learn-mow/mow-materials-total.tsx`
- [ ] `src/fsd/1-pages/learn-mow/mow-materials-table.tsx`
- [ ] `src/fsd/1-pages/learn-mow/mow-lookup-inputs.tsx`
- [ ] `src/fsd/1-pages/learn-upgrades/upgrades.tsx`
- [ ] `src/fsd/1-pages/learn-dirty-dozen/dirty-dozen.tsx` (`.flex-row` on line 40)
- [ ] `src/fsd/1-pages/goals/goal-card/upgrade-rank.tsx`
- [ ] `src/fsd/1-pages/goals/goal-card/ascend.tsx`
- [ ] `src/fsd/1-pages/goals/goal-card/mow-abilities.tsx`
- [ ] `src/fsd/1-pages/goals/goal-card/character-abilities.tsx`
- [ ] `src/fsd/1-pages/goals/goal-card/estimate-row.tsx`
- [ ] `src/fsd/1-pages/goals/goal-card/unlock.tsx`
- [ ] `src/fsd/1-pages/goals/goal-card/upgrade-material.tsx`
- [ ] `src/fsd/1-pages/goals/xp-book-progress-bar.tsx` (1 instance)
- [ ] `src/fsd/1-pages/learn-mow/mow-upgrades-table.tsx` (1 instance)
- [ ] `src/fsd/1-pages/plan-lre/lre-teams-card.tsx` (~4 instances)
- [ ] `src/fsd/1-pages/plan-lre/lre-teams-table.tsx` (~3 instances)
- [ ] `src/fsd/1-pages/plan-lre/lre-settings.tsx` (~4 instances)
- [ ] `src/fsd/1-pages/plan-lre/lre.tsx` (~4 instances)
- [ ] `src/fsd/1-pages/plan-lre/le-track-overall-progress.tsx` (~2 instances)
- [ ] `src/fsd/1-pages/plan-lre/lre-tile.tsx` (1 instance)

---

## 2. MUI `sx={{...}}` prop

Replace with Tailwind `className` + design tokens. See conventions §Don'ts.

- [ ] `src/fsd/1-pages/plan-lre/selected-teams-card.tsx`
- [ ] `src/fsd/1-pages/plan-lre/points-table.tsx`
- [ ] `src/fsd/1-pages/plan-lre/master-table.tsx`
- [ ] `src/fsd/1-pages/plan-lre/le-tokenomics.tsx`
- [ ] `src/fsd/1-pages/plan-bulk-goals/bulk-goal-creator.tsx`
- [ ] `src/fsd/1-pages/guild-war-offense/guild-war-offense.tsx`
- [ ] `src/fsd/1-pages/guild-war-defense/guild-war-defense.tsx`
- [ ] `src/fsd/1-pages/teams/teams.desktop.tsx`
- [ ] `src/fsd/1-pages/plan-campaign-progression/campaign-progression-card.tsx`
- [ ] `src/fsd/1-pages/plan-campaign-progression/campaign-progression-rankup-goals.tsx`
- [ ] `src/fsd/1-pages/plan-campaign-progression/campaign-progression-material-goals.tsx`
- [ ] `src/fsd/1-pages/plan-campaign-progression/campaign-progression-ascension-goals.tsx`
- [ ] `src/fsd/1-pages/input-roster-snapshots/roster-filter-dropdown.tsx`
- [ ] `src/routes/tables/material-estimates-row.tsx`

---

## 3. Shared `Button` using `onClick` instead of `onPress`

The shared `Button` (react-aria) uses `onPress`, not `onClick`.

- [ ] `src/fsd/1-pages/plan-lre/lre.tsx`
- [ ] `src/fsd/1-pages/plan-lre/lre-teams-table.tsx`
- [ ] `src/fsd/1-pages/plan-lre/lre-settings.tsx`
- [ ] `src/fsd/1-pages/plan-lre/lre-edit-team.tsx`
- [ ] `src/fsd/1-pages/plan-lre/lre-add-team.tsx`
- [ ] `src/fsd/1-pages/plan-lre/le-track-overall-progress.tsx`
- [ ] `src/fsd/1-pages/plan-bulk-goals/bulk-goal-creator.tsx`
- [ ] `src/fsd/1-pages/learn-nerd-math/nerd-math.tsx`
- [ ] `src/fsd/1-pages/input-roster-snapshots/take-snapshot-dialog.tsx`
- [ ] `src/fsd/1-pages/input-roster-snapshots/manage-snapshots-dialog.tsx`
- [ ] `src/fsd/1-pages/guild-war-offense/guild-war-offense.tsx`
- [ ] `src/fsd/1-pages/guild-war-defense/guild-war-defense.tsx`
- [ ] `src/fsd/1-pages/guides/guides.tsx`

---

## 4. Inline `style={{ color/background }}` with hardcoded hex values

The `STATUS_COLORS` map in `requirement-status-constants.tsx` holds hex strings used via `style={{ color }}` across multiple LRE files. The right fix is to convert `STATUS_COLORS` values to CSS custom properties (tokens) and reference them via className.

**Root cause file:**
- [x] `src/fsd/1-pages/plan-lre/requirement-status-constants.tsx` — convert hex values to CSS tokens

**Consumers (fix after root cause):**
- [x] `src/fsd/1-pages/plan-lre/le-token-card.tsx` (lines 106, 121)
- [x] `src/fsd/1-pages/plan-lre/le-token-table.tsx` (lines 235, 244)
- [x] `src/fsd/1-pages/plan-lre/le-track-battle.tsx`
- [x] `src/fsd/1-pages/plan-lre/battle-status-checkbox.tsx`

**Dynamic colour functions (harder — needs a token-based approach or semantic classes):**
- [ ] `src/fsd/1-pages/guild-war-defense/guild-war-defense.tsx` (line 246) — `getCompletionRateColor()`
- [ ] `src/fsd/1-pages/guild-war-offense/guild-war-offense.tsx` (line 435) — `getCompletionRateColor()`

---

## 5. Inline style using CSS variables instead of className

Should be `className="text-(--fg)"` etc., not `style={{ color: 'var(--fg)' }}`.

- [ ] `src/fsd/1-pages/input-xp-income/hero-rail.tsx` (line 62) — `style={{ color: isStarred ? 'var(--fg)' : 'var(--soft-fg)' }}`
- [ ] `src/fsd/1-pages/input-xp-income/sources/at-inner.tsx` (line 96) — same pattern
