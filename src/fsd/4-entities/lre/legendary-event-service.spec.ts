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
});
