import { describe, expect, it } from 'vitest';

import { EVENT_META, shopEventRawByPath } from './shop-events';

describe('shop-events EVENT_META coverage', () => {
    const loadedEventNames = new Set(shopEventRawByPath.map(([, raw]) => raw.event));
    const metaEventNames = new Set(Object.keys(EVENT_META));

    it('every glob-loaded shop-event file has a matching EVENT_META entry', () => {
        const missingMeta = [...loadedEventNames].filter(name => !metaEventNames.has(name));
        expect(
            missingMeta,
            `Shop-event file(s) loaded with no EVENT_META entry - add one in shop-events.ts:\n${missingMeta.join('\n')}`
        ).toHaveLength(0);
    });

    it('every EVENT_META entry has a matching loaded shop-event file', () => {
        const staleMeta = [...metaEventNames].filter(name => !loadedEventNames.has(name));
        expect(
            staleMeta,
            `EVENT_META entry(ies) with no matching shop-event file on disk - remove or rename:\n${staleMeta.join('\n')}`
        ).toHaveLength(0);
    });
});
