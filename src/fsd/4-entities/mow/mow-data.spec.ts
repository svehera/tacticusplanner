/* eslint-disable import-x/no-internal-modules */
import { describe, expect, it } from 'vitest';

import mowData2Json from './data/new-mow-data.json';
import mowsData2Json from './data/new-mows-data2.json';

const idsInMowData = new Set(
    (mowData2Json as unknown as { mows: Array<{ snowprintId: string }> }).mows.map(m => m.snowprintId)
);
const idsInMowsData2 = new Set((mowsData2Json as unknown as Array<{ id: string }>).map(m => m.id));

describe('MoW data file consistency', () => {
    it('new-mow-data.json contains no IDs missing from new-mows-data2.json', () => {
        const missing = [...idsInMowData].filter(id => !idsInMowsData2.has(id));
        expect(missing, `In new-mow-data.json but not new-mows-data2.json: ${missing.join(', ')}`).toHaveLength(0);
    });

    it('new-mows-data2.json contains no IDs missing from new-mow-data.json', () => {
        const missing = [...idsInMowsData2].filter(id => !idsInMowData.has(id));
        expect(missing, `In new-mows-data2.json but not new-mow-data.json: ${missing.join(', ')}`).toHaveLength(0);
    });
});
