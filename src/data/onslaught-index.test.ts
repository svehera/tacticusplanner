import { describe, expect, test } from 'vitest';
import { z } from 'zod';

import { jsonFiles, OnslaughtSchema } from './onslaught-index';

type JsonFileName = keyof typeof jsonFiles;
type JsonLoader = (typeof jsonFiles)[JsonFileName];

describe('Onslaught data files', () => {
    for (const [fileName, loadFile] of Object.entries(jsonFiles) as [JsonFileName, JsonLoader][]) {
        test(`Validating ${fileName}`, async () => {
            const data = await loadFile();
            if (!data) {
                console.warn(`Skipping empty onslaught data file: ${fileName}`);
                return;
            }
            const parseResult = OnslaughtSchema.safeParse(data);
            if (parseResult.error) {
                console.error(`Validation errors in file ${fileName}:`);
                console.error({
                    rawData: data,
                    error: z.treeifyError(parseResult.error),
                });
            }
            expect(parseResult.success).toBe(true);
        });
    }
});
