<!-- cSpell:words dataviz jtannas -->

# Technical Roadmap

> [!WARNING]
> This is currently an early draft by someone new to the project. Do not implement anything in here without talking with the team and using the Trello board to track the work.

## Unsorted Proposals

- [ ] Decide between integrating the V2 work into the main project versus removing it.; Source @jtannas
- [ ] Make a primer for the current directory structure in [CONTRIBUTING.md](./CONTRIBUTING.md); Source @jtannas
- [ ] Make a plan for the target directory structure in [CONTRIBUTING.md](./CONTRIBUTING.md); Source @jtannas
- [ ] Decide on which styling & component library to go forwards with. See [# Styling & Components](#styling--components); Source @jtannas
- [ ] Implement [Clerk](https://clerk.com/) for user management so that we're not handling user passwords and other security; Source @jtannas
- [ ] Implement [Zod](https://zod.dev/) for type-safe parsing of data; Source @jtannas
- [ ] Implement [TanStack Query](https://tanstack.com/query/latest) for async loading/error handling; Source @jtannas
- [ ] Implement [Tanstack Router](https://tanstack.com/router/latest) for file-based type-safe routing; Source @jtannas
- [ ] Implement [Tanstack Form](https://tanstack.com/form/latest) for consistent form handling & styling; Source @jtannas
- [ ] Upgrade from `npm` to a more modern package manager ([PNPM](https://pnpm.io/)? [Bun](https://bun.com/)?); Source @jtannas
- [ ] Upgrade from `node` to [Bun](https://bun.com/) for faster builds and scripts; Source @jtannas
- [ ] Replace `Prettier` with [BiomeJS](https://biomejs.dev/) for near-instant formatting; Source @jtannas
- [ ] Move most of `EsLint` rules to [BiomeJS](https://biomejs.dev/) for speed and config simplicity; Source @jtannas
- [ ] Implement [RenovateBot](https://docs.renovatebot.com/) for automatic dependency updates; Source @jtannas
- [ ] Replace `axios` with built-in `fetch` or something built on it (like [`ky`](https://github.com/sindresorhus/ky)); Source @jtannas
- [ ] Consider alternate hosting platforms specialized in static websites (e.g. [Netlify](https://www.netlify.com/)); Source @jtannas
- [ ] Ditch TS Enums in favor of enumerated types. See [1](https://www.youtube.com/watch?v=jjMbPt_H3RQ) [2](https://devblogs.microsoft.com/typescript/announcing-typescript-5-8-beta/#the---erasablesyntaxonly-option); Source @jtannas
- [ ] Replace most function return types with inferred types. See [1](https://www.youtube.com/watch?v=nwSe95uFN8E) [2](https://www.youtube.com/watch?v=I6V2FkW1ozQ); Source @jtannas
- [ ] Implement atomic global state manager. See [#Global State Manager](#global-state-manager); Source @jtannas
- [ ] Start using ["Branded Types"](https://zod.dev/api?id=branded-types) for stricter type safety; Source @jtannas
- [ ] Export fewer types; Derive them instead to communicate intent and limit coupling (e.g. `import { MyComponent, MyComponentProps }` => `ComponentProps<typeof MyComponent>`); Source: @jtannas

## Styling & Components

Right now there are multiple different competing styling solutions:

- [TailwindCSS](https://tailwindcss.com/) for styling using atomic utility classes
- [Emotion](https://emotion.sh/docs/introduction) for styling using CSS-in-JS
- [SASS](https://sass-lang.com/) for a cleaner alternative syntax to regular CSS

There are also multiple different component libraries:

- [Material UI](https://mui.com/) that incorporates behaviour and a design system.
- [Material UI X-Charts](https://mui.com/x/react-charts/), an extension of Material UI for data visualization (a.k.a. dataviz)
- [Nivo](https://nivo.rocks/) for dataviz components
- [React Aria Components](https://react-spectrum.adobe.com/react-aria/components.html) that are primarily behaviour (a.k.a. headless UI)
- [Lucide React](https://lucide.dev/guide/packages/lucide-react) for icons
- [AG Grid](https://www.ag-grid.com/) for data grids

I suggest we review our choices on these to minimize overlapping solutions. This will make both the UI and the code more consistent.

## Global State Manager

It seems like the primary storage for local state is done through contexts, specifically through the `StoreContext` and the `DispatchContext`. These tie into `localStorage` by serializing and deserializing JSON objects. They look like a lot of effort was put into them but the downside it that's a lot of code to understand and maintain.

There are now several global state managers that can handle this kind of stuff with much less complexity and with better performance. E.G.

- [Zustand](https://zustand.docs.pmnd.rs/getting-started/introduction)
- [Jotai](https://jotai.org/)
- [Tanstack Store (ALPHA)](https://tanstack.com/store/latest)

Several of these include support for syncing to/from `localstorage`.
