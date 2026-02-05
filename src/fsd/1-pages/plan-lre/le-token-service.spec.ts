import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ILegendaryEvent } from '@/fsd/3-features/lre';

import { LeTokenService } from './le-token-service';

const ONE_HOUR_MILLIS = 60 * 60 * 1000;
const ONE_DAY_MILLIS = 24 * ONE_HOUR_MILLIS;

const createMockEvent = (overrides: Partial<ILegendaryEvent>): ILegendaryEvent => {
    return {
        ...overrides,
        id: 1,
        unitName: 'Test Unit',
        unitSnowprintId: 'test-unit',
        name: 'Test Event',
        eventStage: 1,
    } as ILegendaryEvent;
};

describe('LeTokenService', () => {
    const now = new Date('2024-01-15T12:00:00.000Z');
    const nowMillis = now.getTime();

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(now);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('getEventStartTimeMillis', () => {
        it('should return 0 if the event is finished', () => {
            const event = createMockEvent({ nextEventDateUtc: now.toUTCString(), finished: true });
            expect(LeTokenService.getEventStartTimeMillis(event)).toBe(0);
        });

        it('should return the start time in milliseconds', () => {
            const event = createMockEvent({ nextEventDateUtc: now.toUTCString() });
            expect(LeTokenService.getEventStartTimeMillis(event)).toBe(nowMillis);
        });
    });

    describe('getEventEndTimeMillis', () => {
        it('should return 0 if the event is finished', () => {
            const event = createMockEvent({ nextEventDateUtc: now.toUTCString(), finished: true });
            expect(LeTokenService.getEventEndTimeMillis(event)).toBe(0);
        });

        it('should return the end time, 7 days after the start time', () => {
            const event = createMockEvent({ nextEventDateUtc: now.toUTCString() });
            const expectedEndTime = nowMillis + 7 * ONE_DAY_MILLIS;
            expect(LeTokenService.getEventEndTimeMillis(event)).toBe(expectedEndTime);
        });
    });

    describe('getMillisRemainingInIteration', () => {
        const event = createMockEvent({ nextEventDateUtc: now.toUTCString() });

        it('should return full duration if event has not started', () => {
            const beforeEventMillis = nowMillis - ONE_DAY_MILLIS;
            expect(LeTokenService.getMillisRemainingInIteration(event, beforeEventMillis)).toBe(7 * ONE_DAY_MILLIS);
        });

        it('should return 0 if event has ended', () => {
            const afterEventMillis = nowMillis + 8 * ONE_DAY_MILLIS;
            expect(LeTokenService.getMillisRemainingInIteration(event, afterEventMillis)).toBe(0);
        });

        it('should return remaining milliseconds if event is active', () => {
            const duringEventMillis = nowMillis + 2 * ONE_DAY_MILLIS;
            const expectedRemaining = 5 * ONE_DAY_MILLIS;
            expect(LeTokenService.getMillisRemainingInIteration(event, duringEventMillis)).toBe(expectedRemaining);
        });
    });

    describe('getFreeTokensRemainingInIteration', () => {
        const event = createMockEvent({ nextEventDateUtc: now.toUTCString() });

        it('should return full tokens if event has not started', () => {
            const beforeEventMillis = nowMillis - ONE_DAY_MILLIS;
            expect(LeTokenService.getFreeTokensRemainingInIteration(event, beforeEventMillis, 0)).toBe(61); // 7*8-1+6
        });

        it('should calculate remaining tokens during the event', () => {
            const duringEventMillis = nowMillis + ONE_DAY_MILLIS; // 1 day in
            const expected = Math.floor((6 * ONE_DAY_MILLIS) / (3 * ONE_HOUR_MILLIS));
            expect(LeTokenService.getFreeTokensRemainingInIteration(event, duringEventMillis, 0)).toBe(expected);
        });

        it('should include a forced token if nextTokenMillisUtc is provided and within event time', () => {
            const nextTokenTime = nowMillis + ONE_HOUR_MILLIS;
            const expected = 1 + Math.floor((7 * ONE_DAY_MILLIS - ONE_HOUR_MILLIS) / (3 * ONE_HOUR_MILLIS));
            expect(LeTokenService.getFreeTokensRemainingInIteration(event, nowMillis, 0, nextTokenTime)).toBe(expected);
        });

        it('should respect custom regen delay', () => {
            const regenDelay = 4 * 3600; // 4 hours
            const expected = Math.floor((7 * ONE_DAY_MILLIS) / (regenDelay * 1000));
            expect(LeTokenService.getFreeTokensRemainingInIteration(event, nowMillis, 0, undefined, regenDelay)).toBe(
                expected
            );
        });
    });

    describe('getAdTokensRemainingInIteration', () => {
        const event = createMockEvent({ nextEventDateUtc: now.toUTCString() });

        it('should return full ad tokens if event has not started', () => {
            const beforeEventMillis = nowMillis - ONE_DAY_MILLIS;
            expect(LeTokenService.getAdTokensRemainingInIteration(event, false, beforeEventMillis)).toBe(7);
        });

        it('should calculate remaining ad tokens during the event', () => {
            const duringEventMillis = nowMillis + 2.5 * ONE_DAY_MILLIS; // 2.5 days in
            expect(LeTokenService.getAdTokensRemainingInIteration(event, true, duringEventMillis)).toBe(4); // 7 - 3 = 4
        });

        it('should return 0 if event is over', () => {
            const afterEventMillis = nowMillis + 8 * ONE_DAY_MILLIS;
            expect(LeTokenService.getAdTokensRemainingInIteration(event, false, afterEventMillis)).toBe(0);
        });
    });

    describe('getPremiumTokensRemainingInIteration', () => {
        const event = createMockEvent({ nextEventDateUtc: now.toUTCString() });

        it('should return 0 if premium is not purchased', () => {
            expect(LeTokenService.getPremiumTokensRemainingInIteration(event, false, nowMillis - 1)).toBe(0);
        });

        it('should return 0 if event has started', () => {
            expect(LeTokenService.getPremiumTokensRemainingInIteration(event, true, nowMillis + 1)).toBe(0);
        });

        it('should return premium tokens if purchased and event has not started', () => {
            expect(LeTokenService.getPremiumTokensRemainingInIteration(event, true, nowMillis - 1)).toBe(6);
        });
    });

    describe('getFreeTokensRemainingInEvent', () => {
        it('should sum tokens from current and future iterations', () => {
            const event = createMockEvent({ nextEventDateUtc: now.toUTCString(), eventStage: 1 });
            // Mocking the helper to isolate the logic of this function
            // We are 1 day into the event.
            const oneDayIn = nowMillis + ONE_DAY_MILLIS;

            // Free tokens remaining in current iteration (6 days left)
            // 6 days * 24 hours/day = 144 hours. 144 / 3 hours/token = 48 tokens.
            const expectedTokensInCurrentIteration = Math.floor((6 * ONE_DAY_MILLIS) / (3 * ONE_HOUR_MILLIS));

            // There are 2 more iterations (stages 2 and 3).
            // Each full iteration gives 61 free tokens.
            const expectedTokensInFutureIterations = 2 * 61;

            const total = LeTokenService.getFreeTokensRemainingInEvent(event, oneDayIn, 0);
            expect(total).toBe(expectedTokensInCurrentIteration + expectedTokensInFutureIterations);
        });
    });

    describe('getAdTokensRemainingInEvent', () => {
        it('should sum tokens from current and future iterations', () => {
            const event = createMockEvent({ nextEventDateUtc: now.toUTCString(), eventStage: 1 });
            const total = LeTokenService.getAdTokensRemainingInEvent(event, false, nowMillis);
            expect(total).toBe(3 * 7);
        });
    });

    describe('getPremiumTokensRemainingInEvent', () => {
        it('should return 0 if no premium is purchased', () => {
            const event = createMockEvent({ nextEventDateUtc: now.toUTCString(), eventStage: 1 });
            expect(LeTokenService.getPremiumTokensRemainingInEvent(event, false, false, false, nowMillis)).toBe(0);
        });

        it('should return tokens for all purchased future events', () => {
            const event = createMockEvent({ nextEventDateUtc: now.toUTCString(), eventStage: 1 });
            // Event hasn't started, so all 3 stages are considered
            const beforeStart = nowMillis - 1;
            expect(LeTokenService.getPremiumTokensRemainingInEvent(event, true, false, true, beforeStart)).toBe(12); // 2 * 6
        });

        it('should return tokens for purchased future events when event is active', () => {
            const event = createMockEvent({ nextEventDateUtc: now.toUTCString(), eventStage: 2 });
            // Event is active, so only stage 2 and 3 are considered
            expect(LeTokenService.getPremiumTokensRemainingInEvent(event, false, true, true, nowMillis)).toBe(12); // 2 * 6
        });
    });

    describe('getIterationForToken', () => {
        const event = createMockEvent({ nextEventDateUtc: now.toUTCString(), eventStage: 1 });
        const beforeStart = nowMillis - 1;

        it('should return current iteration if tokenIndex is within current remaining tokens', () => {
            const iteration = LeTokenService.getIterationForToken(10, 0, true, event, false, false, false, beforeStart);
            expect(iteration).toBe(0); // stage 1
        });

        it('should return next iteration if tokenIndex is for the next event', () => {
            // Total tokens for first event = 61 (free) + 7 (ad) = 68
            const iteration = LeTokenService.getIterationForToken(70, 0, true, event, false, false, false, beforeStart);
            expect(iteration).toBe(1); // stage 2
        });

        it('should return last iteration if tokenIndex is for the last event', () => {
            // Total for first two events = 68 + 68 = 136
            const iteration = LeTokenService.getIterationForToken(
                140,
                0,
                true,
                event,
                false,
                false,
                false,
                beforeStart
            );
            expect(iteration).toBe(2); // stage 3
        });

        it('should return undefined if tokenIndex is out of bounds', () => {
            // Total for all three events = 68 * 3 = 204
            const iteration = LeTokenService.getIterationForToken(
                250,
                0,
                true,
                event,
                false,
                false,
                false,
                beforeStart
            );
            expect(iteration).toBeUndefined();
        });

        it('should account for premium tokens', () => {
            // Total for first event with premium = 68 + 6 = 74
            const iteration = LeTokenService.getIterationForToken(75, 0, true, event, true, false, false, beforeStart);
            expect(iteration).toBe(1); // stage 2
        });
    });
});
