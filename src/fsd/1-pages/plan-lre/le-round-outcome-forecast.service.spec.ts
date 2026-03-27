import { describe, expect, it } from 'vitest';

import { Rarity, RarityStars } from '@/fsd/5-shared/model';

import { ILegendaryEvent } from '@/fsd/3-features/lre';

import {
    computeLeRoundForecasts,
    createInitialLeForecastRoundConfig,
    getLegendaryEventRoundStatuses,
} from './le-round-outcome-forecast.service';
import { ILreProgressModel } from './lre.models';
import { EventProgress } from './token-estimation-service';

const createLegendaryEvent = (overrides: Partial<ILegendaryEvent> = {}): ILegendaryEvent =>
    ({
        id: 1,
        eventStage: 3,
        finished: false,
        nextEventDateUtc: '2026-04-12T00:00:00.000Z',
        unitSnowprintId: 'bloodDante',
        name: 'Dante',
        ...overrides,
    }) as ILegendaryEvent;

const createModel = (): ILreProgressModel =>
    ({
        eventId: 1,
        eventName: 'Dante',
        notes: '',
        regularMissions: [],
        premiumMissions: [],
        shardsPerChest: 25,
        pointsMilestones: [
            { milestone: 1, cumulativePoints: 100, engramPayout: 25 },
            { milestone: 2, cumulativePoints: 250, engramPayout: 30 },
        ],
        chestsMilestones: [
            { chestLevel: 1, engramCost: 60 },
            { chestLevel: 2, engramCost: 80 },
            { chestLevel: 3, engramCost: 100 },
        ],
        progression: {
            unlock: 400,
            fourStars: 120,
            fiveStars: 180,
            blueStar: 200,
            mythic: 250,
            twoBlueStars: 150,
        },
        occurrenceProgress: [
            {
                eventOccurrence: 1,
                freeMissionsProgress: 10,
                premiumMissionsProgress: 10,
                bundlePurchased: true,
                ohSoCloseShards: 0,
            },
            {
                eventOccurrence: 2,
                freeMissionsProgress: 10,
                premiumMissionsProgress: 10,
                bundlePurchased: true,
                ohSoCloseShards: 0,
            },
            {
                eventOccurrence: 3,
                freeMissionsProgress: 0,
                premiumMissionsProgress: 0,
                bundlePurchased: false,
                ohSoCloseShards: 0,
            },
        ],
        tracksProgress: [],
    }) as unknown as ILreProgressModel;

const createProgress = (): EventProgress => ({
    totalPoints: 0,
    totalCurrency: 0,
    totalShards: 0,
    currentRarity: Rarity.Legendary,
    currentStars: RarityStars.None,
    currentShards: 330,
    nextMilestone: 'Unlock',
    addlPointsForNextMilestone: 0,
    addlCurrencyForNextMilestone: 0,
    addlShardsForNextMilestone: 70,
    currentClaimedChestIndex: -1,
});

const createOhSoCloseProgress = (): EventProgress => ({
    totalPoints: 0,
    totalCurrency: 0,
    totalShards: 0,
    currentRarity: Rarity.Legendary,
    currentStars: RarityStars.None,
    currentShards: 330,
    nextMilestone: 'Unlock',
    addlPointsForNextMilestone: 0,
    addlCurrencyForNextMilestone: 0,
    addlShardsForNextMilestone: 70,
    currentClaimedChestIndex: -1,
});

describe('le-round-outcome-forecast.service', () => {
    it('marks prior rounds finished and current upcoming round correctly before the next event starts', () => {
        const event = createLegendaryEvent({ eventStage: 3, nextEventDateUtc: '2026-04-12T00:00:00.000Z' });

        expect(getLegendaryEventRoundStatuses(event, new Date('2026-04-01T00:00:00.000Z').getTime())).toEqual([
            { round: 1, status: 'finished' },
            { round: 2, status: 'finished' },
            { round: 3, status: 'upcoming' },
        ]);
    });

    it('forecasts an upcoming round and applies point milestones, missions, and chests', () => {
        const event = createLegendaryEvent();
        const model = createModel();
        const progress = createProgress();
        const roundConfigs = createInitialLeForecastRoundConfig(
            model,
            event,
            new Date('2026-04-01T00:00:00.000Z').getTime()
        ).map(config =>
            config.round === 3
                ? {
                      ...config,
                      freeMissions: 10,
                      buyBonusDelivery: false,
                      paidMissions: 0,
                      buyCurrencyBundle: false,
                      buyOhSoCloseShards: false,
                  }
                : config
        );

        const [round1, round2, round3] = computeLeRoundForecasts({
            legendaryEvent: event,
            model,
            currentProgress: progress,
            tokenIncrements: [250],
            roundConfigs,
            nowMillis: new Date('2026-04-01T00:00:00.000Z').getTime(),
        });

        expect(round1.status).toBe('finished');
        expect(round2.status).toBe('finished');
        expect(round3.status).toBe('upcoming');
        expect(round3.tokensUsed).toBe(1);
        expect(round3.pointsEarned).toBe(250);
        expect(round3.currencyEarned).toBe(305);
        expect(round3.chestsOpened).toBe(3);
        expect(round3.boughtOhSoCloseShards).toBe(0);
        expect(round3.endingStars).toBe(RarityStars.RedThreeStars);
        expect(round3.endingRarity).toBe(Rarity.Legendary);
        expect(round3.endingShards).toBe(5);
        expect(round3.nextMilestone).toBe('Red 4★');
        expect(round3.shardsNeededForNextMilestone).toBe(115);
    });

    it('applies Oh, So Close shards when a round ends within the allowed shard distance', () => {
        const event = createLegendaryEvent();
        const model = createModel();
        const progress = createOhSoCloseProgress();
        const roundConfigs = createInitialLeForecastRoundConfig(
            model,
            event,
            new Date('2026-04-01T00:00:00.000Z').getTime()
        ).map(config =>
            config.round === 3
                ? {
                      ...config,
                      buyOhSoCloseShards: true,
                  }
                : config
        );

        const round3 = computeLeRoundForecasts({
            legendaryEvent: event,
            model,
            currentProgress: progress,
            tokenIncrements: [],
            roundConfigs,
            nowMillis: new Date('2026-04-01T00:00:00.000Z').getTime(),
        })[2];

        expect(round3.ohSoCloseEligible).toBe(true);
        expect(round3.boughtOhSoCloseShards).toBe(70);
        expect(round3.endingStars).toBe(RarityStars.RedThreeStars);
        expect(round3.endingShards).toBe(0);
        expect(round3.nextMilestone).toBe('Red 4★');
        expect(round3.shardsNeededForNextMilestone).toBe(120);
    });
});
