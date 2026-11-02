import { Rarity, RarityStars } from '@/fsd/5-shared/model';

import { ILegendaryEvent } from '@/fsd/3-features/lre';

import { BONUS_DELIVERY_TOKENS, EVENT_DAYS, LeDailyDeliveryService } from './le-daily-delivery.service';
import { LeTokenService } from './le-token-service';
import { DailyMultiplier, ILreForecastRoundConfig, ILreProgressModel } from './lre.models';
import { EventProgress } from './token-estimation-service';

type RoundNumber = 1 | 2 | 3;
type LeForecastRoundStatus = 'finished' | 'active' | 'upcoming' | 'future';

type LeForecastRoundConfig = ILreForecastRoundConfig;

interface LeForecastRoundResult {
    round: RoundNumber;
    status: LeForecastRoundStatus;
    message?: string;
    tokensAvailable: number;
    tokensUsed: number;
    pointsEarned: number;
    endingPoints: number;
    currencyEarned: number;
    endingCurrency: number;
    chestsOpened: number;
    endingRarity: Rarity;
    endingStars: RarityStars;
    endingShards: number;
    nextMilestone: string;
    shardsNeededForNextMilestone: number;
    ohSoCloseEligible: boolean;
    ohSoCloseShardCost: number;
    ohSoCloseBlackstoneCost: number;
    boughtOhSoCloseShards: number;
    /** Estimated average cleared objectives at this round's remaining daily payouts. */
    estimatedAvgObjectives: number;
    startObjectives: number;
    endObjectives: number;
    dailyPayouts: number;
    dailyDeliveryCurrency: number;
}

type AscensionMilestone = {
    label: string;
    incrementalShards: number;
    rarity: Rarity;
    stars: RarityStars;
};

export class LeRoundOutcomeForecastService {
    public static readonly FULL_ROUND_FREE_TOKENS = 61;
    public static readonly FULL_ROUND_AD_TOKENS = 7;
    public static readonly BONUS_DELIVERY_TOKENS = BONUS_DELIVERY_TOKENS;
    public static readonly MISSION_CURRENCY = 25;
    public static readonly BONUS_DELIVERY_EXTRA_CURRENCY = 15;
    public static readonly OH_SO_CLOSE_MAX_SHARDS = 75;
    public static readonly OH_SO_CLOSE_BASE_COST = 500;
    public static readonly OH_SO_CLOSE_UNLOCK_COST_PER_SHARD = 100;
    public static readonly OH_SO_CLOSE_PROMOTION_COST_PER_SHARD = 50;

    /** Blackstone cost of the "Oh, So Close!" offer for a given shard gap — the in-game price is
     *  500 + 100/shard to close an Unlock gap, or 500 + 50/shard for any later promotion gap. */
    public static getOhSoCloseBlackstoneCost(missingShards: number, isUnlock: boolean): number {
        const perShardCost = isUnlock
            ? this.OH_SO_CLOSE_UNLOCK_COST_PER_SHARD
            : this.OH_SO_CLOSE_PROMOTION_COST_PER_SHARD;
        return this.OH_SO_CLOSE_BASE_COST + perShardCost * missingShards;
    }

    /** Clamps a mission count to the valid range [0, 10]. */
    public static clampMissionCount(value: number): number {
        return Math.min(10, Math.max(0, value));
    }

    /** Builds ordered ascension milestones from event progression thresholds. */
    public static getAscensionMilestones(model: ILreProgressModel): AscensionMilestone[] {
        const milestones: AscensionMilestone[] = [
            {
                label: 'Unlock',
                incrementalShards: model.progression.unlock,
                rarity: Rarity.Legendary,
                stars: RarityStars.RedThreeStars,
            },
            {
                label: 'Red 4★',
                incrementalShards: model.progression.fourStars,
                rarity: Rarity.Legendary,
                stars: RarityStars.RedFourStars,
            },
            {
                label: 'Red 5★',
                incrementalShards: model.progression.fiveStars,
                rarity: Rarity.Legendary,
                stars: RarityStars.RedFiveStars,
            },
            {
                label: 'Blue 1★',
                incrementalShards: model.progression.blueStar,
                rarity: Rarity.Legendary,
                stars: RarityStars.OneBlueStar,
            },
        ];

        if (model.progression.mythic !== undefined) {
            milestones.push({
                label: 'Mythic 1★',
                incrementalShards: model.progression.mythic,
                rarity: Rarity.Mythic,
                stars: RarityStars.OneBlueStar,
            });
        }

        if (model.progression.twoBlueStars !== undefined) {
            milestones.push({
                label: 'Blue 2★',
                incrementalShards: model.progression.twoBlueStars,
                rarity: Rarity.Mythic,
                stars: RarityStars.TwoBlueStars,
            });
        }

        return milestones;
    }

    /** Returns the index of the next ascension milestone based on current rarity and stars. */
    public static getNextAscensionMilestoneIndex(
        ascensionMilestones: AscensionMilestone[],
        currentRarity: Rarity,
        currentStars: RarityStars
    ): number {
        if (currentStars === RarityStars.None) {
            return 0;
        }

        const currentIndex = ascensionMilestones.findIndex(
            milestone => milestone.rarity === currentRarity && milestone.stars === currentStars
        );

        return currentIndex === -1 ? ascensionMilestones.length : currentIndex + 1;
    }

    /** Determines a round status from event timing and stage information. */
    public static getCurrentRoundStatus(
        legendaryEvent: ILegendaryEvent,
        nowMillis: number,
        round: RoundNumber
    ): LeForecastRoundStatus {
        if (legendaryEvent.finished) {
            return 'finished';
        }

        const eventStart = LeTokenService.getEventStartTimeMillis(legendaryEvent);
        const eventEnd = LeTokenService.getEventEndTimeMillis(legendaryEvent);

        if (nowMillis < eventStart) {
            if (round < legendaryEvent.eventStage) return 'finished';
            return round === legendaryEvent.eventStage ? 'upcoming' : 'future';
        }

        if (nowMillis <= eventEnd) {
            if (round < legendaryEvent.eventStage) return 'finished';
            return round === legendaryEvent.eventStage ? 'active' : 'future';
        }

        if (round <= legendaryEvent.eventStage) {
            return 'finished';
        }

        return 'future';
    }

    /** Returns statuses for rounds 1..3. */
    public static getLegendaryEventRoundStatuses(legendaryEvent: ILegendaryEvent, nowMillis: number) {
        return ([1, 2, 3] as const).map(round => ({
            round,
            status: this.getCurrentRoundStatus(legendaryEvent, nowMillis, round),
        }));
    }

    /** Returns full-round token capacity using selected bonus-delivery setting. */
    public static getFullRoundTokens(buyBonusDelivery: boolean): number {
        return (
            this.FULL_ROUND_FREE_TOKENS +
            this.FULL_ROUND_AD_TOKENS +
            (buyBonusDelivery ? this.BONUS_DELIVERY_TOKENS : 0)
        );
    }

    /** Returns current-round remaining tokens from sync state plus optional bonus-delivery tokens. */
    public static getCurrentRoundTokens(
        legendaryEvent: ILegendaryEvent,
        model: ILreProgressModel,
        buyBonusDelivery: boolean,
        nowMillis: number
    ): number {
        return LeDailyDeliveryService.getTokensPerDay(legendaryEvent, model, buyBonusDelivery, true, nowMillis).reduce(
            (sum, value) => sum + value,
            0
        );
    }

    /** Builds cumulative chest costs from milestone costs. */
    public static getCumulativeChestCosts(model: ILreProgressModel): number[] {
        let runningTotal = 0;

        return model.chestsMilestones.map(chest => {
            runningTotal += chest.engramCost;
            return runningTotal;
        });
    }

    /** Returns currency gained from newly crossed point milestones in this round. */
    public static getPointCurrencyEarned(
        model: ILreProgressModel,
        startingPoints: number,
        endingPoints: number,
        buyBonusDelivery: boolean
    ): number {
        return model.pointsMilestones
            .filter(
                milestone => milestone.cumulativePoints > startingPoints && milestone.cumulativePoints <= endingPoints
            )
            .reduce(
                (total, milestone) =>
                    total + milestone.engramPayout + (buyBonusDelivery ? this.BONUS_DELIVERY_EXTRA_CURRENCY : 0),
                0
            );
    }

    /** Returns milestone label or full-clear fallback. */
    public static getMilestoneLabel(ascensionMilestones: AscensionMilestone[], index: number): string {
        return ascensionMilestones[index]?.label ?? 'Full Clear';
    }

    /**
     * Creates per-round forecast settings: defaults from stored occurrence progress, overridden by any
     * saved forecast inputs. Values the sync has already locked in for the active round act as floors.
     */
    public static createInitialLeForecastRoundConfig(
        model: ILreProgressModel,
        legendaryEvent: ILegendaryEvent,
        nowMillis: number
    ): LeForecastRoundConfig[] {
        const statuses = this.getLegendaryEventRoundStatuses(legendaryEvent, nowMillis);

        return ([1, 2, 3] as const).map(round => {
            const occurrence = model.occurrenceProgress.find(item => item.eventOccurrence === round);
            const status = statuses.find(item => item.round === round)?.status ?? 'future';
            const isCurrentActiveRound = status === 'active';
            const lockedBonusDelivery = isCurrentActiveRound && !!model.syncedProgress?.hasPremiumPayout;
            const seeded: LeForecastRoundConfig = {
                round,
                freeMissions: occurrence?.freeMissionsProgress ?? 0,
                buyBonusDelivery: lockedBonusDelivery || (occurrence?.premiumMissionsProgress ?? 0) > 0,
                paidMissions: occurrence?.premiumMissionsProgress ?? 0,
                bundleCurrency: occurrence?.bundleCurrency ?? 0,
                buyOhSoCloseShards: false,
                dailyMultiplier: 1 as DailyMultiplier,
                avgObjectivesPerDay: undefined,
            };
            const saved = model.forecastConfigs?.[round];
            if (!saved) return seeded;

            const floor = (value: number, minimum: number) => (isCurrentActiveRound ? Math.max(value, minimum) : value);
            const buyBonusDelivery = saved.buyBonusDelivery || lockedBonusDelivery;
            return {
                ...saved,
                round,
                freeMissions: floor(saved.freeMissions, seeded.freeMissions),
                buyBonusDelivery,
                paidMissions: buyBonusDelivery ? floor(saved.paidMissions, seeded.paidMissions) : 0,
                bundleCurrency: floor(saved.bundleCurrency, seeded.bundleCurrency),
            };
        });
    }

    /** Simulates cumulative outcomes for rounds 1..3 using token and purchase assumptions. */
    public static computeLeRoundForecasts({
        legendaryEvent,
        model,
        currentProgress,
        tokenIncrements,
        roundConfigs,
        nowMillis,
        tokenObjectives = [],
        initialObjectivesCleared = 0,
    }: {
        legendaryEvent: ILegendaryEvent;
        model: ILreProgressModel;
        currentProgress: EventProgress;
        tokenIncrements: number[];
        roundConfigs: LeForecastRoundConfig[];
        nowMillis: number;
        /** Objectives cleared by each token, parallel to `tokenIncrements`. */
        tokenObjectives?: number[];
        /** Objectives already cleared before the first forecast token is spent. */
        initialObjectivesCleared?: number;
    }): LeForecastRoundResult[] {
        const statuses = this.getLegendaryEventRoundStatuses(legendaryEvent, nowMillis);
        const configsByRound = new Map(roundConfigs.map(config => [config.round, config]));
        const occurrenceByRound = new Map(
            model.occurrenceProgress.map(occurrence => [occurrence.eventOccurrence, occurrence])
        );
        const chestCosts = this.getCumulativeChestCosts(model);
        const ascensionMilestones = this.getAscensionMilestones(model);

        let tokenIndex = 0;
        let totalPoints = currentProgress.totalPoints;
        let totalCurrency = currentProgress.totalCurrency;
        let currentRarity = currentProgress.currentRarity;
        let currentStars = currentProgress.currentStars;
        let currentShards = currentProgress.currentShards;
        let currentClaimedChestIndex = currentProgress.currentClaimedChestIndex;
        let totalObjectives = initialObjectivesCleared;

        return statuses.map(({ round, status }) => {
            const config = configsByRound.get(round) ?? {
                round,
                freeMissions: 0,
                buyBonusDelivery: false,
                paidMissions: 0,
                bundleCurrency: 0,
                buyOhSoCloseShards: false,
                dailyMultiplier: 1 as DailyMultiplier,
            };

            if (status === 'finished') {
                return {
                    round,
                    status,
                    message: 'Round has already finished.',
                    tokensAvailable: 0,
                    tokensUsed: 0,
                    pointsEarned: 0,
                    endingPoints: totalPoints,
                    currencyEarned: 0,
                    endingCurrency: totalCurrency,
                    chestsOpened: 0,
                    endingRarity: currentRarity,
                    endingStars: currentStars,
                    endingShards: currentShards,
                    nextMilestone: this.getMilestoneLabel(
                        ascensionMilestones,
                        this.getNextAscensionMilestoneIndex(ascensionMilestones, currentRarity, currentStars)
                    ),
                    shardsNeededForNextMilestone: 0,
                    ohSoCloseEligible: false,
                    ohSoCloseShardCost: 0,
                    ohSoCloseBlackstoneCost: 0,
                    boughtOhSoCloseShards: 0,
                    estimatedAvgObjectives: 0,
                    startObjectives: totalObjectives,
                    endObjectives: totalObjectives,
                    dailyPayouts: 0,
                    dailyDeliveryCurrency: 0,
                };
            }

            const occurrence = occurrenceByRound.get(round);
            const missionCurrencyPerMission =
                this.MISSION_CURRENCY + (config.buyBonusDelivery ? this.BONUS_DELIVERY_EXTRA_CURRENCY : 0);
            const currentFreeMissions = status === 'active' ? (occurrence?.freeMissionsProgress ?? 0) : 0;
            const currentPaidMissions = status === 'active' ? (occurrence?.premiumMissionsProgress ?? 0) : 0;
            const currentBundleCurrency = status === 'active' ? (occurrence?.bundleCurrency ?? 0) : 0;

            const freeMissions = this.clampMissionCount(config.freeMissions);
            const paidMissions = config.buyBonusDelivery ? this.clampMissionCount(config.paidMissions) : 0;

            const additionalFreeMissions = Math.max(0, freeMissions - currentFreeMissions);
            const additionalPaidMissions = Math.max(0, paidMissions - currentPaidMissions);
            const additionalBundleCurrency = Math.max(0, config.bundleCurrency - currentBundleCurrency);

            const isActive = status === 'active';
            const tokensPerDay = LeDailyDeliveryService.getTokensPerDay(
                legendaryEvent,
                model,
                config.buyBonusDelivery,
                isActive,
                nowMillis
            );
            const tokensAvailable = tokensPerDay.reduce((sum, value) => sum + value, 0);

            const tokensUsed = Math.min(tokensAvailable, tokenIncrements.length - tokenIndex);
            const firstPayoutDay = LeDailyDeliveryService.getFirstPayoutDay(legendaryEvent, isActive, nowMillis);
            const objectives = LeDailyDeliveryService.estimateObjectives({
                tokensPerDay,
                tokensToUse: tokensUsed,
                tokenObjectives,
                tokenStart: tokenIndex,
                startingObjectives: totalObjectives,
                firstPayoutDay,
            });
            const dailyPayouts = EVENT_DAYS - firstPayoutDay;
            const avgObjectives = config.avgObjectivesPerDay ?? objectives.averageAtPayouts;
            const dailyDeliveryCurrency = Math.round(dailyPayouts * config.dailyMultiplier * avgObjectives);
            const startObjectives = totalObjectives;
            totalObjectives = objectives.endingObjectives;
            const pointsEarned = tokenIncrements
                .slice(tokenIndex, tokenIndex + tokensUsed)
                .reduce((sum, value) => sum + value, 0);
            tokenIndex += tokensUsed;

            const endingPoints = totalPoints + pointsEarned;
            const pointCurrencyEarned = this.getPointCurrencyEarned(
                model,
                totalPoints,
                endingPoints,
                config.buyBonusDelivery
            );
            const missionCurrencyEarned = (additionalFreeMissions + additionalPaidMissions) * missionCurrencyPerMission;
            const currencyEarned =
                pointCurrencyEarned + missionCurrencyEarned + additionalBundleCurrency + dailyDeliveryCurrency;
            totalPoints = endingPoints;
            totalCurrency += currencyEarned;

            let chestsOpened = 0;
            while (
                currentClaimedChestIndex + 1 < chestCosts.length &&
                totalCurrency >= chestCosts[currentClaimedChestIndex + 1]
            ) {
                currentClaimedChestIndex += 1;
                currentShards += model.shardsPerChest;
                chestsOpened += 1;
            }

            let nextMilestoneIndex = this.getNextAscensionMilestoneIndex(
                ascensionMilestones,
                currentRarity,
                currentStars
            );
            while (
                nextMilestoneIndex < ascensionMilestones.length &&
                currentShards >= ascensionMilestones[nextMilestoneIndex].incrementalShards
            ) {
                currentShards -= ascensionMilestones[nextMilestoneIndex].incrementalShards;
                currentRarity = ascensionMilestones[nextMilestoneIndex].rarity;
                currentStars = ascensionMilestones[nextMilestoneIndex].stars;
                nextMilestoneIndex += 1;
            }

            const shardsNeededForNextMilestone =
                nextMilestoneIndex < ascensionMilestones.length
                    ? Math.max(0, ascensionMilestones[nextMilestoneIndex].incrementalShards - currentShards)
                    : 0;
            const ohSoCloseEligible =
                nextMilestoneIndex < ascensionMilestones.length &&
                shardsNeededForNextMilestone > 0 &&
                shardsNeededForNextMilestone <= this.OH_SO_CLOSE_MAX_SHARDS;
            const ohSoCloseBlackstoneCost = ohSoCloseEligible
                ? this.getOhSoCloseBlackstoneCost(shardsNeededForNextMilestone, nextMilestoneIndex === 0)
                : 0;

            let boughtOhSoCloseShards = 0;
            if (config.buyOhSoCloseShards && ohSoCloseEligible) {
                boughtOhSoCloseShards = shardsNeededForNextMilestone;
                currentShards += boughtOhSoCloseShards;

                while (
                    nextMilestoneIndex < ascensionMilestones.length &&
                    currentShards >= ascensionMilestones[nextMilestoneIndex].incrementalShards
                ) {
                    currentShards -= ascensionMilestones[nextMilestoneIndex].incrementalShards;
                    currentRarity = ascensionMilestones[nextMilestoneIndex].rarity;
                    currentStars = ascensionMilestones[nextMilestoneIndex].stars;
                    nextMilestoneIndex += 1;
                }
            }

            const remainingShardsForNextMilestone =
                nextMilestoneIndex < ascensionMilestones.length
                    ? Math.max(0, ascensionMilestones[nextMilestoneIndex].incrementalShards - currentShards)
                    : 0;

            return {
                round,
                status,
                tokensAvailable,
                tokensUsed,
                pointsEarned,
                endingPoints: totalPoints,
                currencyEarned,
                endingCurrency: totalCurrency,
                chestsOpened,
                endingRarity: currentRarity,
                endingStars: currentStars,
                endingShards: currentShards,
                nextMilestone: this.getMilestoneLabel(ascensionMilestones, nextMilestoneIndex),
                shardsNeededForNextMilestone: remainingShardsForNextMilestone,
                ohSoCloseEligible,
                ohSoCloseShardCost: shardsNeededForNextMilestone,
                ohSoCloseBlackstoneCost,
                boughtOhSoCloseShards,
                estimatedAvgObjectives: Math.round(objectives.averageAtPayouts),
                startObjectives,
                endObjectives: objectives.endingObjectives,
                dailyPayouts,
                dailyDeliveryCurrency,
            };
        });
    }
}
