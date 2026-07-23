import { describe, expect, it } from 'vitest';

import { getHseDisplayName, humanizeEventName } from './homescreen-event.utils';
import { homescreenEvents } from './homescreen-events.data';

const IS_HERE_TITLE_RE = /^<i>(.+?)<\/i> is here$/;

describe('getHseDisplayName', () => {
    it('uses the "<Name> is here" banner text when the event description follows that pattern, otherwise falls back', () => {
        for (const event of homescreenEvents) {
            const title = Object.values(event.tiers)
                .map(tier => tier?.descriptions?.[0])
                .find((description): description is string => !!description);

            const match = title ? IS_HERE_TITLE_RE.exec(title) : undefined;
            const expected = match?.[1] ?? humanizeEventName(event.eventName);

            expect(getHseDisplayName(event), event.eventName).toBe(expected);
        }
    });

    it('never falls back to the raw snake_case event id', () => {
        for (const event of homescreenEvents) {
            expect(getHseDisplayName(event)).not.toBe(event.eventName);
        }
    });
});
