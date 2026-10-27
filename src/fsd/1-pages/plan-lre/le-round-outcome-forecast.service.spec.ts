import { describe, expect, it } from 'vitest';

import { Rarity, RarityStars } from '@/fsd/5-shared/model';

import { ILegendaryEvent } from '@/fsd/3-features/lre';

import { LeRoundOutcomeForecastService } from './le-round-outcome-forecast.service';
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
                bundleCurrency: 300,
                ohSoCloseShards: 0,
            },
            {
                eventOccurrence: 2,
                freeMissionsProgress: 10,
                premiumMissionsProgress: 10,
                bundleCurrency: 300,
                ohSoCloseShards: 0,
            },
            {
                eventOccurrence: 3,
                freeMissionsProgress: 0,
                premiumMissionsProgress: 0,
                bundleCurrency: 0,
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

        expect(
            LeRoundOutcomeForecastService.getLegendaryEventRoundStatuses(
                event,
                new Date('2026-04-01T00:00:00.000Z').getTime()
            )
        ).toEqual([
            { round: 1, status: 'finished' },
            { round: 2, status: 'finished' },
            { round: 3, status: 'upcoming' },
        ]);
    });

    it('forecasts an upcoming round and applies point milestones, missions, and chests', () => {
        const event = createLegendaryEvent();
        const model = createModel();
        const progress = createProgress();
        const roundConfigs = LeRoundOutcomeForecastService.createInitialLeForecastRoundConfig(
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
                      bundleCurrency: 0,
                      dailyMultiplier: 1 as const,
                      buyOhSoCloseShards: false,
                  }
                : config
        );

        const [round1, round2, round3] = LeRoundOutcomeForecastService.computeLeRoundForecasts({
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
        const roundConfigs = LeRoundOutcomeForecastService.createInitialLeForecastRoundConfig(
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

        const round3 = LeRoundOutcomeForecastService.computeLeRoundForecasts({
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
        // Unlock gap of 70 shards: 500 base + 100/shard.
        expect(round3.ohSoCloseBlackstoneCost).toBe(500 + 100 * 70);
    });

    it('prices the Oh, So Close offer at 500 + 50/shard for a promotion gap (not an Unlock gap)', () => {
        const event = createLegendaryEvent();
        const model = createModel();
        const progress: EventProgress = {
            ...createOhSoCloseProgress(),
            currentStars: RarityStars.RedThreeStars,
            currentShards: 50, // fourStars threshold is 120 -> 70 shards missing, within the 75 limit
        };
        const roundConfigs = LeRoundOutcomeForecastService.createInitialLeForecastRoundConfig(
            model,
            event,
            new Date('2026-04-01T00:00:00.000Z').getTime()
        ).map(config => (config.round === 3 ? { ...config, buyOhSoCloseShards: false } : config));

        const round3 = LeRoundOutcomeForecastService.computeLeRoundForecasts({
            legendaryEvent: event,
            model,
            currentProgress: progress,
            tokenIncrements: [],
            roundConfigs,
            nowMillis: new Date('2026-04-01T00:00:00.000Z').getTime(),
        })[2];

        expect(round3.ohSoCloseEligible).toBe(true);
        expect(round3.shardsNeededForNextMilestone).toBe(70);
        expect(round3.ohSoCloseBlackstoneCost).toBe(500 + 50 * 70);
    });
});

describe('LeRoundOutcomeForecastService daily delivery and bundles', () => {
    const now = new Date('2026-04-01T00:00:00.000Z').getTime();
    const forecastRound3 = (override: Record<string, unknown>) => {
        const event = createLegendaryEvent();
        const model = createModel();
        const roundConfigs = LeRoundOutcomeForecastService.createInitialLeForecastRoundConfig(model, event, now).map(
            config =>
                config.round === 3
                    ? { ...config, freeMissions: 10, buyBonusDelivery: false, paidMissions: 0, ...override }
                    : config
        );
        return LeRoundOutcomeForecastService.computeLeRoundForecasts({
            legendaryEvent: event,
            model,
            currentProgress: createProgress(),
            tokenIncrements: [250],
            tokenObjectives: [10],
            initialObjectivesCleared: 100,
            roundConfigs,
            nowMillis: now,
        })[2];
    };

    it('pays multiplier * estimated objectives at each of the 7 daily payouts', () => {
        const round3 = forecastRound3({ dailyMultiplier: 2 });
        expect(round3.estimatedAvgObjectives).toBe(110);
        expect(round3.startObjectives).toBe(100);
        expect(round3.endObjectives).toBe(110);
        expect(round3.dailyPayouts).toBe(7);
        expect(round3.dailyDeliveryCurrency).toBe(7 * 2 * 110);
        expect(round3.currencyEarned).toBe(305 + 7 * 2 * 110);
    });

    it('uses the user override for average objectives instead of the estimate', () => {
        const round3 = forecastRound3({ dailyMultiplier: 4, avgObjectivesPerDay: 200 });
        expect(round3.dailyDeliveryCurrency).toBe(7 * 4 * 200);
    });

    it('adds an arbitrary bundle currency total separately from daily delivery', () => {
        const base = forecastRound3({});
        const withBundles = forecastRound3({ bundleCurrency: 150 + 600 + 600 });
        expect(withBundles.currencyEarned - base.currencyEarned).toBe(1350);
        expect(withBundles.dailyDeliveryCurrency).toBe(base.dailyDeliveryCurrency);
    });
});

describe('LeRoundOutcomeForecastService saved forecast inputs', () => {
    const now = new Date('2026-04-01T00:00:00.000Z').getTime();

    it('uses saved inputs in place of the defaults derived from occurrence progress', () => {
        const model = {
            ...createModel(),
            forecastConfigs: {
                3: {
                    round: 3,
                    freeMissions: 4,
                    buyBonusDelivery: true,
                    paidMissions: 2,
                    bundleCurrency: 750,
                    buyOhSoCloseShards: true,
                    dailyMultiplier: 4,
                    avgObjectivesPerDay: 123,
                },
            },
        } as ILreProgressModel;

        const round3 = LeRoundOutcomeForecastService.createInitialLeForecastRoundConfig(
            model,
            createLegendaryEvent(),
            now
        )[2];

        expect(round3).toEqual(model.forecastConfigs![3]);
    });

    it('keeps synced progress as a floor for the active round', () => {
        const event = createLegendaryEvent({ eventStage: 3, nextEventDateUtc: '2026-04-01T00:00:00.000Z' });
        const model = {
            ...createModel(),
            syncedProgress: { hasPremiumPayout: true },
            occurrenceProgress: [
                ...createModel().occurrenceProgress.slice(0, 2),
                {
                    eventOccurrence: 3,
                    freeMissionsProgress: 6,
                    premiumMissionsProgress: 5,
                    bundleCurrency: 300,
                    ohSoCloseShards: 0,
                },
            ],
            forecastConfigs: {
                3: {
                    round: 3,
                    freeMissions: 2,
                    buyBonusDelivery: false,
                    paidMissions: 0,
                    bundleCurrency: 150,
                    buyOhSoCloseShards: false,
                    dailyMultiplier: 2,
                },
            },
        } as unknown as ILreProgressModel;

        const round3 = LeRoundOutcomeForecastService.createInitialLeForecastRoundConfig(
            model,
            event,
            new Date('2026-04-02T00:00:00.000Z').getTime()
        )[2];

        expect(round3).toMatchObject({
            freeMissions: 6,
            buyBonusDelivery: true,
            paidMissions: 5,
            bundleCurrency: 300,
            dailyMultiplier: 2,
        });
    });
});

describe('LeRoundOutcomeForecastService.getOhSoCloseBlackstoneCost', () => {
    it('prices an Unlock gap at 500 base + 100/shard', () => {
        expect(LeRoundOutcomeForecastService.getOhSoCloseBlackstoneCost(10, true)).toBe(500 + 100 * 10);
        expect(LeRoundOutcomeForecastService.getOhSoCloseBlackstoneCost(0, true)).toBe(500);
    });

    it('prices a promotion gap at 500 base + 50/shard', () => {
        expect(LeRoundOutcomeForecastService.getOhSoCloseBlackstoneCost(10, false)).toBe(500 + 50 * 10);
        expect(LeRoundOutcomeForecastService.getOhSoCloseBlackstoneCost(0, false)).toBe(500);
    });
});
