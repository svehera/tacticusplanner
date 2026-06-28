/* eslint-disable import-x/no-internal-modules */
/* eslint-disable boundaries/element-types */
import { describe, expect, it } from 'vitest';

import characterData from '@/fsd/4-entities/character/data/new-character-data2.json';
import traitsData from '@/fsd/4-entities/traits/data/new-traits-data.json';

import { TRAIT_VARIABLE_MAP } from './trait-variables';

type TraitEntry = { id: string; description: string };
type CharEntry = { traits?: string[] };

const VAR_RE = /\{\[(\w+)\]\}/g;

describe('trait-variables', () => {
    it('every {[var]} in new-traits-data.json descriptions is mapped in TRAIT_VARIABLE_MAP', () => {
        const missing: string[] = [];
        for (const trait of traitsData as unknown as TraitEntry[]) {
            const variables = [...trait.description.matchAll(VAR_RE)].map(m => m[1]);
            for (const v of variables) {
                if (!TRAIT_VARIABLE_MAP[trait.id]?.[v]) {
                    missing.push(`${trait.id}.${v}`);
                }
            }
        }
        expect(missing, `Unmapped trait variables:\n${missing.join('\n')}`).toHaveLength(0);
    });

    it('every trait used across all characters has an entry in new-traits-data.json', () => {
        const excluded = new Set(['Hero']);
        const traitIds = new Set((traitsData as unknown as TraitEntry[]).map(t => t.id));
        const missing = new Set<string>();
        for (const char of characterData as unknown as CharEntry[]) {
            for (const traitId of char.traits ?? []) {
                if (!traitIds.has(traitId) && !excluded.has(traitId)) missing.add(traitId);
            }
        }
        expect(
            [...missing],
            `Traits used in character data but missing from new-traits-data.json:\n${[...missing].join('\n')}`
        ).toHaveLength(0);
    });
});
