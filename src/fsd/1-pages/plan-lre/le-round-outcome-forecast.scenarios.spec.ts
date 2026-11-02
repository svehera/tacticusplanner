/**
 * End-to-end scenarios for the round forecast: how far does the character get after each round when the
 * player buys bonus delivery, bundles and "Oh, So Close!" shards, and earns daily delivery payouts?
 *
 * Uses the real Lucius milestone/chest/progression data. Assumptions shared by every scenario:
 *  - the event hasn't started, so round 1 is upcoming and rounds 2 and 3 are in the future
 *  - every token scores 135 points (200 tokens = the 27,000 point maximum) and clears 1.5 objectives on average
 *  - all free missions are done every round, plus all paid missions when bonus delivery is bought
 */
import { describe, expect, it } from 'vitest';

import { Rarity, RarityStars } from '@/fsd/5-shared/model';

// eslint-disable-next-line import-x/no-internal-modules
import lucius from '@/fsd/4-entities/lre/data/10-Lucius.json';

import { ILegendaryEvent } from '@/fsd/3-features/lre';

import { LeRoundOutcomeForecastService } from './le-round-outcome-forecast.service';
import { DailyMultiplier, ILreProgressModel } from './lre.models';
import { EventProgress } from './token-estimation-service';

const NOW = new Date('2026-05-01T00:00:00.000Z').getTime();
const POINTS_PER_TOKEN = 135;
const TOKEN_COUNT = 200;

const event = {
    id: lucius.id,
    eventStage: 1,
    finished: false,
    nextEventDateUtc: '2026-06-01T00:00:00.000Z',
    unitSnowprintId: lucius.unitSnowprintId,
    name: lucius.name,
} as unknown as ILegendaryEvent;

const model = {
    eventId: lucius.id,
    eventName: lucius.name,
    notes: '',
    regularMissions: [],
    premiumMissions: [],
    pointsMilestones: lucius.pointsMilestones,
    chestsMilestones: lucius.chestsMilestones,
    progression: lucius.progression,
    shardsPerChest: lucius.shardsPerChest,
    occurrenceProgress: ([1, 2, 3] as const).map(eventOccurrence => ({
        eventOccurrence,
        freeMissionsProgress: 0,
        premiumMissionsProgress: 0,
        bundleCurrency: 0,
        ohSoCloseShards: 0,
    })),
    tracksProgress: [],
} as unknown as ILreProgressModel;

const freshProgress: EventProgress = {
    totalPoints: 0,
    totalCurrency: 0,
    totalShards: 0,
    currentRarity: Rarity.Legendary,
    currentStars: RarityStars.None,
    currentShards: 0,
    nextMilestone: 'Unlock',
    addlPointsForNextMilestone: 0,
    addlCurrencyForNextMilestone: 0,
    addlShardsForNextMilestone: 0,
    currentClaimedChestIndex: -1,
};

interface Scenario {
    /** Buy bonus delivery in every round (6 extra tokens, +15 per payout, paid missions). */
    bonusDelivery?: boolean;
    multiplier?: DailyMultiplier;
    /** Replaces the tokenomics estimate of average objectives cleared at the daily payouts. */
    avgObjectives?: number;
    /** Currency bought from bundles in rounds 1, 2 and 3. */
    bundles?: [number, number, number];
    /** Buy "Oh, So Close!" shards in rounds 1, 2 and 3 when eligible. */
    ohSoClose?: [boolean, boolean, boolean];
}

const forecast = ({
    bonusDelivery = false,
    multiplier = 1,
    avgObjectives,
    bundles = [0, 0, 0],
    ohSoClose = [false, false, false],
}: Scenario = {}) => {
    const roundConfigs = LeRoundOutcomeForecastService.createInitialLeForecastRoundConfig(model, event, NOW).map(
        config => ({
            ...config,
            freeMissions: 10,
            buyBonusDelivery: bonusDelivery,
            paidMissions: bonusDelivery ? 10 : 0,
            bundleCurrency: bundles[config.round - 1],
            buyOhSoCloseShards: ohSoClose[config.round - 1],
            dailyMultiplier: multiplier,
            avgObjectivesPerDay: avgObjectives,
        })
    );

    return LeRoundOutcomeForecastService.computeLeRoundForecasts({
        legendaryEvent: event,
        model,
        currentProgress: freshProgress,
        tokenIncrements: Array.from({ length: TOKEN_COUNT }, () => POINTS_PER_TOKEN),
        tokenObjectives: Array.from({ length: TOKEN_COUNT }, (_, index) => (index % 2 === 0 ? 2 : 1)),
        initialObjectivesCleared: 0,
        roundConfigs,
        nowMillis: NOW,
    });
};

const UNLOCKED = { rarity: Rarity.Legendary, stars: RarityStars.RedThreeStars };
const BLUE_STAR = { rarity: Rarity.Legendary, stars: RarityStars.OneBlueStar };
const MYTHIC = { rarity: Rarity.Mythic, stars: RarityStars.OneBlueStar };
const FULL_CLEAR = { rarity: Rarity.Mythic, stars: RarityStars.TwoBlueStars };

const outcomes = (scenario?: Scenario) =>
    forecast(scenario).map(round => ({ rarity: round.endingRarity, stars: round.endingStars }));

/** Orders ascension outcomes so scenarios can be compared; higher is further along. */
const progressScore = (round: { endingRarity: Rarity; endingStars: RarityStars; endingShards: number }) =>
    round.endingRarity * 1000 + round.endingStars * 10 + round.endingShards / 1000;

const round1DailyDelivery = (multiplier: DailyMultiplier) => forecast({ multiplier })[0].dailyDeliveryCurrency;

describe('round forecast scenarios (bonus delivery, bundles, daily delivery)', () => {
    it('with no purchases the character is not even unlocked after round 1, but is fully cleared by round 3', () => {
        expect(outcomes()).toEqual([{ rarity: Rarity.Legendary, stars: RarityStars.None }, BLUE_STAR, FULL_CLEAR]);
    });

    it('bonus delivery with a x4 daily multiplier unlocks in round 1 and reaches mythic in round 2', () => {
        expect(outcomes({ bonusDelivery: true, multiplier: 4 })).toEqual([UNLOCKED, MYTHIC, FULL_CLEAR]);
    });

    it('twelve 600 bundles on top of that reach a blue star in round 1 and mythic in round 2', () => {
        const [round1, round2] = forecast({ bonusDelivery: true, multiplier: 4, bundles: [7200, 0, 0] });

        expect({ rarity: round1.endingRarity, stars: round1.endingStars }).toEqual(BLUE_STAR);
        expect({ rarity: round2.endingRarity, stars: round2.endingStars }).toEqual(MYTHIC);
    });

    it('enough bundles in round 1 reach a blue star in round 1 and a full clear in round 2', () => {
        expect(outcomes({ bonusDelivery: true, multiplier: 4, bundles: [9000, 0, 0] })).toEqual([
            BLUE_STAR,
            FULL_CLEAR,
            FULL_CLEAR,
        ]);
    });

    it('buying the last shards with "Oh, So Close!" turns a near-miss into a round 1 blue star', () => {
        const withoutOffer = forecast({ bonusDelivery: true, multiplier: 4, bundles: [6000, 0, 0] })[0];
        expect(withoutOffer.endingStars).toBe(RarityStars.RedFiveStars);
        expect(withoutOffer.ohSoCloseEligible).toBe(true);

        const withOffer = forecast({
            bonusDelivery: true,
            multiplier: 4,
            bundles: [6000, 0, 0],
            ohSoClose: [true, false, false],
        })[0];
        expect({ rarity: withOffer.endingRarity, stars: withOffer.endingStars }).toEqual(BLUE_STAR);
        expect(withOffer.boughtOhSoCloseShards).toBe(withoutOffer.shardsNeededForNextMilestone);
        // Not an unlock, so the cheaper 50 blackstone per shard rate applies.
        expect(withOffer.ohSoCloseBlackstoneCost).toBe(500 + 50 * withOffer.boughtOhSoCloseShards);
    });

    it('a higher average objective count at the daily payouts gets further than the tokenomics estimate', () => {
        const estimated = forecast({ bonusDelivery: true, multiplier: 4 });
        const optimistic = forecast({ bonusDelivery: true, multiplier: 4, avgObjectives: 250 });

        expect(optimistic[0].dailyDeliveryCurrency).toBeGreaterThan(estimated[0].dailyDeliveryCurrency);
        expect(optimistic[0].dailyDeliveryCurrency).toBe(7 * 4 * 250);
        expect(optimistic[0].endingStars).toBe(RarityStars.RedFiveStars);
        expect(optimistic[1]).toMatchObject({ endingRarity: Rarity.Mythic, endingStars: RarityStars.OneBlueStar });
    });

    it('never gets worse by buying more: every upgrade is at least as far along in every round', () => {
        const ladder: Scenario[] = [
            {},
            { multiplier: 2 },
            { multiplier: 4 },
            { bonusDelivery: true, multiplier: 4 },
            { bonusDelivery: true, multiplier: 4, bundles: [1500, 0, 0] },
            { bonusDelivery: true, multiplier: 4, bundles: [7200, 0, 0] },
            { bonusDelivery: true, multiplier: 4, bundles: [7200, 3000, 0] },
        ];
        const results = ladder.map(scenario => forecast(scenario));

        for (let step = 1; step < results.length; step++) {
            for (let round = 0; round < 3; round++) {
                expect(progressScore(results[step][round])).toBeGreaterThanOrEqual(
                    progressScore(results[step - 1][round])
                );
            }
        }
    });

    it('a x1 / x2 / x4 multiplier pays proportionally more daily delivery currency', () => {
        expect(round1DailyDelivery(2)).toBe(round1DailyDelivery(1) * 2);
        expect(round1DailyDelivery(4)).toBe(round1DailyDelivery(1) * 4);
    });
});
