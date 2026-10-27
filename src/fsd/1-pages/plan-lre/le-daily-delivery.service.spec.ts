import { describe, expect, it } from 'vitest';

import { ILegendaryEvent, RequirementStatus } from '@/fsd/3-features/lre';

import { LeDailyDeliveryService } from './le-daily-delivery.service';
import { ILreProgressModel } from './lre.models';

const DAY = 24 * 60 * 60 * 1000;
const START = new Date('2026-04-12T00:00:00.000Z').getTime();

const event = {
    id: 1,
    eventStage: 3,
    finished: false,
    nextEventDateUtc: '2026-04-12T00:00:00.000Z',
} as ILegendaryEvent;
const model = (syncedProgress?: object) => ({ syncedProgress }) as unknown as ILreProgressModel;
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

describe('LeDailyDeliveryService', () => {
    it('counts cleared objectives using status, falling back to the legacy flag', () => {
        const tracks = [
            {
                battles: [
                    {
                        requirementsProgress: [
                            { status: RequirementStatus.Cleared, completed: false },
                            { status: RequirementStatus.NotCleared, completed: true },
                            { completed: true },
                            { completed: false },
                        ],
                    },
                ],
            },
        ] as never;
        // With a status, only Cleared counts; without one, the legacy flag decides.
        expect(LeDailyDeliveryService.countClearedObjectives(tracks)).toBe(2);
    });

    it('gives a full round 61 free + 7 ad tokens, plus 6 immediately with bonus delivery', () => {
        expect(sum(LeDailyDeliveryService.getTokensPerDay(event, model(), false, false, START - DAY))).toBe(68);
        expect(LeDailyDeliveryService.getTokensPerDay(event, model(), true, false, START - DAY)[0]).toBe(14 + 1 + 6);
        expect(sum(LeDailyDeliveryService.getTokensPerDay(event, model(), true, false, START - DAY))).toBe(74);
    });

    it('only counts remaining days for an active round', () => {
        const now = START + 3 * DAY + 1000;
        const perDay = LeDailyDeliveryService.getTokensPerDay(
            event,
            model({ currentTokens: 5, hasUsedAdForExtraTokenToday: true, hasPremiumPayout: false }),
            true,
            true,
            now
        );
        expect(perDay.slice(0, 3)).toEqual([0, 0, 0]);
        expect(perDay[3]).toBeGreaterThanOrEqual(5);
        expect(LeDailyDeliveryService.getFirstPayoutDay(event, true, now)).toBe(3);
    });

    it('spends tokens as they become available and averages the remaining payouts', () => {
        const estimate = LeDailyDeliveryService.estimateObjectives({
            tokensPerDay: [1, 1, 0, 0, 0, 0, 0],
            tokensToUse: 2,
            tokenObjectives: [10, 5],
            tokenStart: 0,
            startingObjectives: 100,
            firstPayoutDay: 0,
        });
        expect(estimate.clearedByDayEnd).toEqual([110, 115, 115, 115, 115, 115, 115]);
        expect(estimate.endingObjectives).toBe(115);
        expect(estimate.averageAtPayouts).toBeCloseTo((110 + 6 * 115) / 7);

        const late = LeDailyDeliveryService.estimateObjectives({
            tokensPerDay: [1, 1, 0, 0, 0, 0, 0],
            tokensToUse: 2,
            tokenObjectives: [10, 5],
            tokenStart: 0,
            startingObjectives: 100,
            firstPayoutDay: 2,
        });
        expect(late.averageAtPayouts).toBe(115);
    });
});
