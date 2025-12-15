# Contributing

Please message on the [Discord#contribute Channel](https://discord.com/channels/1146809197023997972/1183885004850331788) to join the team.
We'll help you get started there but here are the most important bits.

## Project Planning

We use a combination of Discord and a Trello board for planning what's going on.
The Trello board is managed by Redwyne.
Link here: https://trello.com/b/VA20QPHI/tacticus-planner

## Project Status

`Severyn` originally created the project but has since stepped back for personal reasons.
Control was handed off to `cpunerd` (a.k.a. Kharnage, GitHub name @unrstuart).

## Project Architecture

A lot of the project was migrated by `Severyn` to use [FSD Architecture - Feature Sliced Design](https://feature-sliced.design/).
This is an architecture that splits code by feature and avoids having much cross boundaries between features.
There's also a `src/v2` directory that's actually older than the `src/fsd` stuff.
Unfortunately `Severyn` left before the architecture was unified and the plans to do so weren't written down.
That's in limbo for now.

> [!NOTE]
> ToDo: Let's fill this out with an explanation of the directory structure as we decide how we want it to look.

## Hosting

The project is deployed to Azure as a static web app.
The dev environment is hosted at: [https://dev.tacticusplanner.app/](https://dev.tacticusplanner.app/)
The production environment is hosted at: [https://tacticusplanner.app/](https://tacticusplanner.app/)

## Conventions

- Use [TailwindCSS](https://tailwindcss.com/) for styling all new code
- Use [AG Grid](https://www.ag-grid.com/) for data grids
- Use [Material UI](https://mui.com/) for other components

## Significant Pain Points

This section lists known tech debt issues that we'd like to improve over time.

### Inconsistent Architecture

Right now the code is split between the FSD Architecture in the `src/fsd` directory and a different architecture in `src/v2`.
Of the two, the `src/v2` folder appears to be the older of the two.

There are also quite a few folders in `src` for more general concerns (e.g. `routes`, `services`, `reducers`, etc...).

This inconsistency makes it harder for people to jump in and contribute.

At some point we should decide on what we want to go with for future development and then migrate to a single architecture.

### Styling & Components

Right now there's a split between styling solutions:

- Inline Styles
- [TailwindCSS](https://tailwindcss.com/) for styling using atomic utility classes

There are also multiple different component libraries:

- [Material UI](https://mui.com/) that incorporates behaviour and a design system.
- [Nivo](https://nivo.rocks/) for dataviz components
- [React Aria Components](https://react-spectrum.adobe.com/react-aria/components.html) that are primarily behaviour (a.k.a. headless UI)
- [Lucide React](https://lucide.dev/guide/packages/lucide-react) for icons
- [AG Grid](https://www.ag-grid.com/) for data grids

We have listed the preferred options in the [conventions section](#conventions) but there's a fair amount of code that doesn't currently comply with them.
At some point we should start moving the older code to follow the current conventions.
This will make both the UI and the code more consistent.
#### TailwindCSS Migration: Inline Styles to TailwindCSS

A stumbling block in converting the inline styles to TailwindCSS is that a lot of the styles are dynamic (e.g. based on props).
This makes it harder to convert to TailwindCSS because TailwindCSS is based on static class names.
e.g. `className="text-" + props.size` won't work because `text-` needs to be a complete class name like `text-sm` or `text-lg`.

We can deal with this though. A lot of those props are for utility components (e.g. `<FlexBox>`) that can be refactored to take in a `className` prop.
We then use the `twMerge` function from the [tailwind-merge](https://github.com/dcastil/tailwind-merge) package to combine the passed in class names with the default class names.
In the simplest cases, we can just wholesale replace the utility component with a `div` or other HTML element that uses TailwindCSS class names directly.
e.g. replace `<FlexBox gap={8} alignItems="center">` with `<div className="flex gap-2 items-center">`.

We also have to remember that this is an open source project where a lot people will be contributing who aren't familiar with TailwindCSS. At some point we should implement [linting for Tailwind](https://tailwindcss.com/blog/introducing-linting-for-tailwindcss-intellisense) to help catch mistakes and educate contributors.

#### TailwindCSS Migration: Responsive Design

A lot of the inline styles are also used to implement responsive design.
e.g. `width: props.isMobile? '75px' : '150px'`.
TailwindCSS has built-in support for responsive design using [responsive utility variants](https://tailwindcss.com/docs/responsive-design).
The hiccup is that the current styles are based on the user agent (i.e. `isMobile` npm package) whereas TailwindCSS is based on CSS media queries. We'll want to individually evaluate each change we make to see which are the appropriate breakpoints to use.

#### TailwindCSS Migration: Calculated Styles

Quite a few inline styles are calculated based on other values.
e.g. `width: props.numItems * 50`

These tend not to translate well to TailwindCSS because TailwindCSS is based on static class names.
The solution here is to refactor each case individually to use CSS techniques that are content-aware.
e.g. using CSS `grid` or `flexbox` to automatically size the container based on the number of items inside it.

This recently became much easier in modern CSS due to the addition of [container queries](https://tailwindcss.com/docs/responsive-design#container-queries) which allow us to apply styles based on the size of the container rather than the viewport. This allows us to create reusable components that adapt to their content.

#### TailwindCSS Migration: Arbitrary Values

One of the advantages of TailwindCSS is that it subtly encourages design consistency by using a predefined set of spacing, sizing, and typography values.
They are also responsive by default since they are based on `rem` units (i.e. relative to the user's font size) that scale with the zoom.

Most of the existing inline styles use arbitrary pixel values (e.g. `gap: 5px`).
While we can convert these directly to TailwindCSS using [arbitrary values](https://tailwindcss.com/docs/adding-custom-styles#using-arbitrary-values) (e.g. `gap-[5px]`), this misses out on the benefits of design consistency and responsiveness.

At some point we should evaluate each of these cases and convert them to use the closest matching TailwindCSS value (e.g. `gap-1` for `4px`/`5px`).

### Expansive Code

There's a lot going on in this codebase.
A lot of that is just from how much the app offers.
Still, there's an opportunity to make a lot of it simpler using modern React tooling.

For example:

- [Zod](https://zod.dev/) to combine compile-time type safety with run-time parsing & validation
- [TanStack Query](https://tanstack.com/query/latest) for async loading/error handling + localStorage persistence
- [React Compiler](https://react.dev/learn/react-compiler) to eliminate the need for `useMemo`/`useCallback`/`React.memo`

Please keep in mind that the value of trying to make something simpler depends heavily on what's going on in the project. Be sure to talk with the team to build consensus before implementing anything new or changing an existing pattern.
