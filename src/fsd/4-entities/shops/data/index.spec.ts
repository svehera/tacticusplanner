import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const DATA_DIR = path.dirname(fileURLToPath(import.meta.url));
const JSON_IMPORT_RE = /from\s+['"]\.\/([\w.-]+\.json)['"]/g;
const GLOB_RE = /import\.meta\.glob(?:<[^>]*>)?\(\s*['"]([^'"]+)['"]/g;

// Converts a glob pattern like './[0-9][0-9][0-9][0-9]-*.json' into a RegExp. Bracket character
// classes (`[0-9]`) are valid in both glob and regex syntax, so they're left untouched; only `*`/`?`
// wildcards are translated and the rest of the pattern is escaped.
function globToRegex(glob: string): RegExp {
    const escaped = glob.replaceAll(/[.+^${}()|\\]/g, String.raw`\$&`);
    const withWildcards = escaped.replaceAll('*', '.*').replaceAll('?', '.');
    return new RegExp(`^${withWildcards}$`);
}

describe('shops/data barrel', () => {
    it('every json file in shops/data is imported (statically or via import.meta.glob) by some .ts file in the directory', () => {
        const jsonFiles = new Set(readdirSync(DATA_DIR).filter(f => f.endsWith('.json')));

        const referenced = new Set<string>();
        const globPatterns: RegExp[] = [];
        for (const file of readdirSync(DATA_DIR)) {
            if (!file.endsWith('.ts') || file.endsWith('.spec.ts')) continue;
            const source = readFileSync(path.join(DATA_DIR, file), 'utf8');
            for (const match of source.matchAll(JSON_IMPORT_RE)) referenced.add(match[1]);
            for (const match of source.matchAll(GLOB_RE)) globPatterns.push(globToRegex(match[1]));
        }

        const unreferenced = [...jsonFiles].filter(
            f => !referenced.has(f) && !globPatterns.some(re => re.test(`./${f}`))
        );
        expect(
            unreferenced,
            `JSON files in shops/data not imported anywhere:\n${unreferenced.join('\n')}`
        ).toHaveLength(0);
    });
});
