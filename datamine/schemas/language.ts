import { z } from 'zod';

import englishFile from '../source/I2Languages_en.json';

const LanguageSchema = z
    .object({
        // we don't care about the other keys in this file, we just want the terms
        mTerms: z.array(
            z.object({
                Languages: z.tuple([z.string()]),
                Term: z.string(),
            })
        ),
    })
    .transform(({ mTerms }) => {
        const lookup: Record<string, string> = {};
        for (const term of mTerms) {
            lookup[term.Term] = term.Languages[0];
        }
        return lookup;
    });

const languageLookup = LanguageSchema.parse(englishFile);

export function i18n(key: string) {
    if (!languageLookup[key]) throw new Error(`Missing translation for key: ${key}`);
    return languageLookup[key];
}
