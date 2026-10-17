import { describe, expect, it } from 'vitest';

import { aunshi, LegendaryEventService } from '@/fsd/4-entities/lre';

describe('LegendaryEventService', () => {
    describe('getActiveEvent', () => {
        it('Should return the current active event', () => {
            const today = new Date();
            const events = [
                {
                    ...aunshi,
                    id: 1,
                    unitSnowprintId: 'alice',
                    name: 'Alice',
                    eventStage: 3,
                    finished: true,
                },
                {
                    ...aunshi,
                    id: 2,
                    unitSnowprintId: 'Bob',
                    name: 'Bob',
                    eventStage: 2,
                    nextEventDateUtc: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toDateString(),
                    finished: false,
                },
                {
                    ...aunshi,
                    id: 3,
                    unitSnowprintId: 'charlie',
                    name: 'Charlie',
                    eventStage: 1,
                    nextEventDateUtc: new Date(today.getTime() - 40 * 24 * 60 * 60 * 1000).toDateString(),
                    finished: false,
                },
                {
                    ...aunshi,
                    id: 4,
                    unitSnowprintId: 'dave',
                    name: 'Dave',
                    eventStage: 1,
                    nextEventDateUtc: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toDateString(),
                    finished: false,
                },
            ];
            const activeEvent = LegendaryEventService.getActiveEvent(events);
            expect(activeEvent).toBeDefined();
            expect(activeEvent?.name).toEqual('Dave');
        });
    });

    describe('sortForDisplay', () => {
        const DAY = 24 * 60 * 60 * 1000;
        const now = Date.parse('2026-10-17T12:00:00Z');
        const at = (days: number) => new Date(now + days * DAY).toUTCString();
        const names = (items: Array<{ n: string; d?: string }>) =>
            LegendaryEventService.sortForDisplay(items, x => x.d, now).map(x => x.n);

        it('puts the upcoming event first when none is live, then past newest first', () => {
            expect(
                names([
                    { n: 'old', d: at(-80) },
                    { n: 'recent', d: at(-14) },
                    { n: 'next', d: at(22) },
                ])
            ).toEqual(['next', 'recent', 'old']);
        });

        it('puts the live event first, then the upcoming one, then past newest first', () => {
            expect(
                names([
                    { n: 'old', d: at(-80) },
                    { n: 'future', d: at(28) },
                    { n: 'live', d: at(-3) },
                    { n: 'recent', d: at(-40) },
                ])
            ).toEqual(['live', 'future', 'recent', 'old']);
        });

        it('treats an event that started over 7 days ago as past', () => {
            expect(
                names([
                    { n: 'ended', d: at(-8) },
                    { n: 'older', d: at(-50) },
                ])
            ).toEqual(['ended', 'older']);
        });

        it('puts undated events last', () => {
            expect(names([{ n: 'tba' }, { n: 'past', d: at(-20) }])).toEqual(['past', 'tba']);
        });
    });
});
