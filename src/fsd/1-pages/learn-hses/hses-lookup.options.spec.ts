import { describe, expect, it } from 'vitest';

import { HomescreenEventData, HseSchedule } from '@/fsd/4-entities/homescreen_events';

import { buildHseOptions, formatHseDateRange } from './hses-lookup.options';

const event = (eventName: string, displayName: string) => ({
    event: { eventName } as HomescreenEventData,
    displayName,
});

const events = [event('b_event', 'Bravo'), event('a_event', 'Alpha'), event('c_event', 'Charlie')];
const now = new Date('2026-09-10T12:00:00Z');

const run = (eventName: string, startUtc: string, endUtc: string): HseSchedule => ({ eventName, startUtc, endUtc });

describe('buildHseOptions', () => {
    it('lists active and upcoming runs chronologically, skipping past runs', () => {
        const { scheduled } = buildHseOptions(
            events,
            [
                run('c_event', '2026-09-20T00:00:00Z', '2026-09-24T00:00:00Z'),
                run('a_event', '2026-08-01T00:00:00Z', '2026-08-05T00:00:00Z'),
                run('b_event', '2026-09-09T00:00:00Z', '2026-09-12T00:00:00Z'),
            ],
            now
        );
        expect(scheduled.map(x => x.eventName)).toEqual(['b_event', 'c_event']);
    });

    it('shows from and to dates, with an exclusive end', () => {
        const { scheduled } = buildHseOptions(
            events,
            [run('b_event', '2026-09-09T00:00:00Z', '2026-09-12T00:00:00Z')],
            now
        );
        expect(scheduled[0].label).toBe('Bravo (Sep 9 – Sep 11)');
    });

    it('lists the same event once per run with distinct values', () => {
        const { scheduled } = buildHseOptions(
            events,
            [
                run('a_event', '2026-09-11T00:00:00Z', '2026-09-13T00:00:00Z'),
                run('a_event', '2026-09-20T00:00:00Z', '2026-09-22T00:00:00Z'),
            ],
            now
        );
        expect(scheduled).toHaveLength(2);
        expect(new Set(scheduled.map(x => x.value)).size).toBe(2);
    });

    it('lists every event alphabetically in the other group, including those that are scheduled', () => {
        const { others } = buildHseOptions(
            events,
            [run('c_event', '2026-09-20T00:00:00Z', '2026-09-24T00:00:00Z')],
            now
        );
        expect(others.map(x => x.label)).toEqual(['Alpha', 'Bravo', 'Charlie']);
    });
});

describe('formatHseDateRange', () => {
    it('includes the year when a date is outside the current year', () => {
        expect(formatHseDateRange(run('a', '2026-12-30T00:00:00Z', '2027-01-03T00:00:00Z'), now)).toBe(
            'Dec 30, 2026 – Jan 2, 2027'
        );
    });
});
