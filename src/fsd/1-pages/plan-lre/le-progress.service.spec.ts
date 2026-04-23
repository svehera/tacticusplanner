/* eslint-disable import-x/no-internal-modules */
import { describe, it, expect } from 'vitest';

import { LegendaryEventEnum } from '@/fsd/4-entities/lre';
import { dante } from '@/fsd/4-entities/lre/data';

import { LeProgressService } from './le-progress.service';
import { ILeProgress, ILreProgressModel } from './lre.models';

function makeSyncedProgress(
    fields: Partial<ILeProgress> &
        Pick<ILeProgress, 'currentPoints' | 'currentCurrency' | 'currentShards' | 'currentClaimedChestIndex'>
): ILeProgress {
    return {
        lastUpdateMillisUtc: 0,
        hasUsedAdForExtraTokenToday: false,
        currentTokens: 6,
        maxTokens: 12,
        hasPremiumPayout: false,
        ...fields,
    };
}

function makeSyncedProgressModel(syncedProgress: ILeProgress): ILreProgressModel {
    return {
        eventId: LegendaryEventEnum.Dante,
        eventName: 'Dante',
        notes: '',
        occurrenceProgress: [],
        tracksProgress: [],
        regularMissions: dante.regularMissions,
        premiumMissions: dante.premiumMissions,
        syncedProgress,
        pointsMilestones: dante.pointsMilestones,
        chestsMilestones: dante.chestsMilestones,
        progression: dante.progression,
        shardsPerChest: dante.shardsPerChest,
    };
}

describe('LeProgressService.computeProgress', () => {
    describe('synced progress path', () => {
        it('reports 13,000 when player has 1,444 points, 65 currency in hand, 2 chests opened (50 shards)', () => {
            // API-reported state: 1,444 points, 65 engrams in hand, 2 chests opened (50 shards).
            // currentClaimedChestIndex=2 is the raw 1-based API count stored as-is.
            // Chests 1+2 cost 60+80=140 engrams; total accumulated = 140 + 65 = 205.
            // currencyForNextMilestone = 3,350 (16 chests for unlock).
            // currencyLeft = 3350 − 205 = 3145. Draining from milestone 5 onward, the running
            // total crosses 3145 at milestone 28 (13,000 pts), so 13,000 is the correct threshold.
            const model = makeSyncedProgressModel(
                makeSyncedProgress({
                    currentPoints: 1444,
                    currentCurrency: 65,
                    currentShards: 50,
                    currentClaimedChestIndex: 2, // raw 1-based API count stored as-is
                })
            );
            const result = LeProgressService.computeProgress(model, false);

            expect(result.currentPoints).toBe(1444);
            expect(result.pointsForNextMilestone).toBeLessThanOrEqual(13_000);
            expect(result.pointsForNextMilestone).toBe(13_000);
        });

        it('reports pointsForNextMilestone ≤ 13,000 when player has 12,261 points and 375 shards (needs one more chest to unlock)', () => {
            // API-reported state: 12,261 points scored, 160 engrams in hand,
            // 375 shards accumulated (15 chests opened), currentClaimedChestIndex=15 from API.
            // convertExternalProgress stores this as index 14 (0-based).
            // no premium event active.
            //
            // The player needs only 25 more shards (1 chest, costing 350 engrams).
            // They already hold 160 engrams, so only 190 more are needed from point
            // milestone payouts. Milestone 27 (12,500 pts) pays out 300 engrams — enough
            // to cover the remaining 190. Therefore the next unlock threshold is 12,500
            // points, not 13,000 or 13,500.
            const model = makeSyncedProgressModel(
                makeSyncedProgress({
                    currentPoints: 12_261,
                    currentCurrency: 160,
                    currentShards: 375,
                    currentClaimedChestIndex: 15, // raw 1-based API count stored as-is
                })
            );
            const result = LeProgressService.computeProgress(model, false);

            expect(result.currentPoints).toBe(12_261);
            expect(result.pointsForNextMilestone).toBeLessThanOrEqual(13_000);
            // The correct threshold given the held currency is 12,500.
            expect(result.pointsForNextMilestone).toBe(12_500);
        });
    });
});
