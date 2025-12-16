# README

This folder contains the various data files used in the project.
They were originally scattered throughout the codebase, but have been consolidated here to improve discoverability and maintainability.

## TODO

- There are 2 slightly different versions of the `newNpcData` file. We should figure out which one is the correct version and remove the other.
- Figure out where these data files are coming from. If possible, add a script in `package.json` to regenerate them automatically.
- A lot of the files have corresponding TypeScript types. Unfortunately the data is not necessarily validated against these types. Either
    -   1. Make `zod` schemas for the data and validate when they are loaded, or
    -   2. Convert the data files to TypeScript files and use `as const` so that TS can validate them at compile time.
- There are a few data files with regular (e.g. `NpcData.json`) and new (e.g. `newNpcData.json`) versions. We should remove the old versions if possible.
- Some of the data files are not used anywhere in the codebase. We should identify and remove these unused files.
  - Ideally we would have a script to check for unused data files automatically.
