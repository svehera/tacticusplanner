import { describe, expect, it } from 'vitest';

import { getCurrentHomeCalendarImage } from './home-calendar';

describe('getCurrentHomeCalendarImage', () => {
    it('keeps the 1.43 calendar until Sunday Nov 15 00:00 UTC', () => {
        expect(getCurrentHomeCalendarImage(new Date('2026-11-14T23:59:59Z'))).toBe('calendar/calendar_143.webp');
    });

    it('switches to the 1.44 calendar at Sunday Nov 15 00:00 UTC', () => {
        expect(getCurrentHomeCalendarImage(new Date('2026-11-15T00:00:00Z'))).toBe('calendar/calendar_144.webp');
    });
});
