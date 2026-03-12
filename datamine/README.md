# Datamine

- This directory processes raw datamined game files into useful formats for the planner.
- It uses `bun` instead of `node` to better handle the large files.
- `main.ts` is the entry point. Run it with `bun main.ts`
- `source/` contains the raw datamined files.
- `schema/` contains the Zod schemas used to transform and validate the data.
	- Note: It's preferrable to add a new schema rather than extending an existing one for multiple uses. This keeps maintenance simple.
- `output/` contains the processed files that the planner will consume.
	- Information is typically exported as typescript `export const data = <data> as const` for type safety.
	- Possible approaches if the file is too big:
		- split it into multiple smaller exports (e.g. `onslaught-xenos`, `onslaught-imperial`, `onslaught-chaos`)
		- export as JSON and import it in the planner with `import data from './data.json'`; gives looser types but is more performant.
- The recommened way to consume the generated game files in the planner is to symlink. This gives a live connection to the generated files without copying.
	- Linux / MaxOS: `ln -s /path/to/original_file_or_directory /path/to/new_symlink`
