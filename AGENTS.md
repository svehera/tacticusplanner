# Agent Guidance

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # dev server at http://localhost:3000
npm run start-local    # dev server in dev-local mode
npm test               # run all tests once
npm run test:watch     # run tests in watch mode
npx vitest run path/to/file.spec.ts  # run a single test file
npm run lint           # eslint with autofix
npm run format         # prettier write
npm run tsc            # type-check without emit
npm run build          # production build
```

CI (`npm run build-ci`) runs format-check, lint, build, and tests in sequence.

## Architecture

### Feature-Sliced Design (FSD)

New code goes in `src/fsd/` under numbered layers; lower numbers import from higher:

- `0-app/` — routing, providers, top-level shell
- `1-pages/` — page components (route targets)
- `2-widgets/` — composite UI blocks reused across pages
- `3-features/` — feature logic (goals, upgrades, planning…)
- `4-entities/` — domain entities (character, mow, lre, faction…)
- `5-shared/` — shared UI, hooks, utilities, API layer

Files outside `src/fsd/` (`src/models/`, `src/reducers/`, `src/services/`, `src/routes/`) predate the migration and are still in heavy use. Importing them from inside FSD layers trips two lint rules; add these disables at the top of any FSD file that does so:

```tsx
/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
```

### Global state

Reducers live in `src/reducers/`. Access global state via:

```tsx
import { useContext } from 'react';
import { StoreContext, DispatchContext } from 'src/reducers/store.provider';
```

`IGlobalState` in `src/models/interfaces.ts` is the authoritative shape.

### API layer

All backend calls go through `makeApiCall` from `@/fsd/5-shared/api`. It wraps axios and always returns `{ data, error }` — never throws.

```ts
const { data, error } = await makeApiCall<ResponseType>('GET', 'some/endpoint');
```

API function definitions live alongside their feature (e.g., `guild-roster-snapshots.models.ts` for guild endpoints). The guild API key is stored in `userInfo.tacticusGuildApiKey` via `useAuth()` from `@/fsd/5-shared/model`.

### UI conventions

See [CONVENTIONS.md](CONVENTIONS.md) for the full reference: design tokens, shared components (`@/fsd/5-shared/ui`), layout patterns, and the FSD boundary rules. Key points:

- Use CSS custom property tokens (`bg-(--primary)`, `text-(--fg)`) not raw Tailwind colours
- System uses `zinc` grey family — never `gray`, `slate`, or `neutral`
- Dark mode is class-based (`.dark` on `<html>`); tokens flip automatically
- Shared `Button` uses `onPress`, not `onClick` (react-aria)
- For dialogs containing dropdowns, use `PortalDialog` not `Modal` (focus trap blocks portaled selects)

---

- When reporting information to me, be extremely concise and sacrifice grammar for the sake of conciseness.
- IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning.
    - [Code Review](.agent-skills/code-review/SKILL.md)
    - [Revise Agent Configuration](.agent-skills/revise-agent-configuration/SKILL.md)
    - [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
    - [Zod Validation API](https://zod.dev/api)
    - [Better alternatives to useEffect](https://react.dev/learn/you-might-not-need-an-effect.md)
- The primary branch for this repo is `develop`
- Use Tailwind v4 for styling all new code
- We use unicorn lint rules, which are much more aggressive than normal prettier/eslint rules. Please never introduce new lint violations.
- The original maintainer tried migrating to fsd, but left the codebase in a bad state. As much as possible, try to put things in the proper src/fsd/#-\* directory, but also it's okay to import stuff breaking FSD ruless if necessary.
- Real logic goes inside of .ts files, only component definitions and layout-related stuff go inside of .tsx files.

- Tacticus is a resource management game consisting of battles across various modes, resources, heroes (also called characters), and machines of war (MoWs).
- Heroes and MoWs all have starting rarities. Heroes also have ranks.
- Heroes have active and passive abilities. MoWs have primary and secondary abilities.
- There are six rarities at the time of writing, but there may be more. Consult the Rarity enum for up-to-date information.
- Each rarity has three or four star variations to go alongside it. You can look in the RarityStars enum. Common goes from 0 to 2, Uncommon from 2 to 4, Rare from 4 to 5 to 1 red, Epic from 1 red to 3 red, legendary 3 red thru 5 red to 1 blue, and mythic from 1 blue to 3 blue to mythic wings/skulls. Adding stars is called promoting, increasing rarity is called ascending.
- The game uses the name of metals for ranks, each of which can go from one to three. The metals are "stone", "iron", "bronze", "silver", "gold", "diamond", and "adamantine".
- People often abbreviate ranks, so Diamond Three would be D3, Adamantine Two would be A2, etc. People usually use "St1" for Stone one and "S1" for silver one.
- Characters must achieve a minimum rarity to rank up beyond at a point. The rarity requirements to reach each rank are defined in rankToRarity in constants.ts.
- In order to promote or ascend, characters and mows need a certain number of incremental shards and orbs. The incremental shard count is defined in charProgression in constants.ts.
- Hereos and MoWs have IDs. These are also called snowprint IDs. There is a legacy ID system that we are mostly rid of, but we haven't cleaned it up, so if you aren't sure, please ask for clarification.
- In order to rank up, heroes need not only to ascend, but they must also hit a minimum XP level and a apply rank upgrades. The XP levels are defined in rankToLevel in constants.ts.
- Heroes must apply upgrade materials. Materials (AKA upgrades, mats) can be crafted or uncrafted, and are defined in new-recipe-data.json. The materials a character must apply to rank up are defined in new-rank-up-data.json. The key is the _current_ rank of the character, and the value is an array of six upgrade materials to reach the new rank. It takes six upgrade materials to reach a new rank. Two rows of three columns. The rank-up data is specified in column-major order, starting with the first column.
- Raid bosses come in rarity tiers, starting at common. When you defeat one boss, you open the next boss and its primes (there are always two). You do not have to defeat both primes to fight nor kill the boss. If you defeat the final mythic boss, your guild then loops around to fight the first legendary boss again. Primes are also called side bosses or minions.
- We are trying to avoid using material UI too much in new code, and instead relying on CSS styling of native HTML components. We aren't 100% opposed to new uses of MUI, but when it makes sense, it's best to avoid it.
- When a character hits a new rank below D3 and is not rarity capped, they can apply the first row of upgrades without needing to get an XP level up. In order to apply the second row though, they need to start gaining XP levels. For example, A D2 character at level 47 can apply the top row of upgrades, but they need to be level 48 to apply the bottom left, 49 to apply the bottom center, and 50 to apply the bottom right. Once they've applied all six upgrades, they can rank up. This changes at D3 though. From D3 on, they can apply the top left upgrade without any extra XP, but each subsequent upgrade in book-reading order requires a new level up.
