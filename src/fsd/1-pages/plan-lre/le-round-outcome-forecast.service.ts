import { Rarity, RarityStars } from '@/fsd/5-shared/model';

import { ILegendaryEvent } from '@/fsd/3-features/lre';

import { LeTokenService } from './le-token-service';
import { ILreProgressModel } from './lre.models';
import { EventProgress } from './token-estimation-service';

type RoundNumber = 1 | 2 | 3;
export type LeForecastRoundStatus = 'finished' | 'active' | 'upcoming' | 'future';

export interface LeForecastRoundConfig {
    round: RoundNumber;
    freeMissions: number;
    buyBonusDelivery: boolean;
    paidMissions: number;
    buyCurrencyBundle: boolean;
    buyOhSoCloseShards: boolean;
}

export interface LeForecastRoundResult {
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
    boughtOhSoCloseShards: number;
}

type AscensionMilestone = {
    label: string;
    incrementalShards: number;
    rarity: Rarity;
    stars: RarityStars;
};

const FULL_ROUND_FREE_TOKENS = 61;
const FULL_ROUND_AD_TOKENS = 7;
const BONUS_DELIVERY_TOKENS = 6;
const MISSION_CURRENCY = 25;
const BONUS_DELIVERY_EXTRA_CURRENCY = 15;
const CURRENCY_BUNDLE_CURRENCY = 300;
const OH_SO_CLOSE_MAX_SHARDS = 75;

const clampMissionCount = (value: number) => Math.min(10, Math.max(0, value));

const getAscensionMilestones = (model: ILreProgressModel): AscensionMilestone[] => {
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

    if ('mythic' in model.progression) {
        milestones.push({
            label: 'Mythic 1★',
            incrementalShards: model.progression.mythic,
            rarity: Rarity.Mythic,
            stars: RarityStars.OneBlueStar,
        });
    }

    if ('twoBlueStars' in model.progression) {
        milestones.push({
            label: 'Blue 2★',
            incrementalShards: model.progression.twoBlueStars,
            rarity: Rarity.Mythic,
            stars: RarityStars.TwoBlueStars,
        });
    }

    return milestones;
};

const getNextAscensionMilestoneIndex = (
    ascensionMilestones: AscensionMilestone[],
    currentRarity: Rarity,
    currentStars: RarityStars
) => {
    if (currentStars === RarityStars.None) {
        return 0;
    }

    const currentIndex = ascensionMilestones.findIndex(
        milestone => milestone.rarity === currentRarity && milestone.stars === currentStars
    );

    return currentIndex === -1 ? ascensionMilestones.length : currentIndex + 1;
};

const getCurrentRoundStatus = (
    legendaryEvent: ILegendaryEvent,
    nowMillis: number,
    round: RoundNumber
): LeForecastRoundStatus => {
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
};

const getStatuses = (legendaryEvent: ILegendaryEvent, nowMillis: number) =>
    ([1, 2, 3] as const).map(round => ({ round, status: getCurrentRoundStatus(legendaryEvent, nowMillis, round) }));

export const getLegendaryEventRoundStatuses = (legendaryEvent: ILegendaryEvent, nowMillis: number) =>
    getStatuses(legendaryEvent, nowMillis);

const getFullRoundTokens = (buyBonusDelivery: boolean) =>
    FULL_ROUND_FREE_TOKENS + FULL_ROUND_AD_TOKENS + (buyBonusDelivery ? BONUS_DELIVERY_TOKENS : 0);

const getCurrentRoundTokens = (
    legendaryEvent: ILegendaryEvent,
    model: ILreProgressModel,
    buyBonusDelivery: boolean,
    nowMillis: number
) => {
    const currentTokens = model.syncedProgress?.currentTokens ?? 0;
    const freeTokensTotal = LeTokenService.getFreeTokensRemainingInIteration(
        legendaryEvent,
        nowMillis,
        currentTokens,
        model.syncedProgress?.nextTokenMillisUtc,
        model.syncedProgress?.regenDelayInSeconds
    );
    const adTokens = LeTokenService.getAdTokensRemainingInIteration(
        legendaryEvent,
        model.syncedProgress?.hasUsedAdForExtraTokenToday ?? false,
        nowMillis
    );
    const alreadyHasBonusDelivery = !!model.syncedProgress?.hasPremiumPayout;
    const bonusTokens = buyBonusDelivery && !alreadyHasBonusDelivery ? BONUS_DELIVERY_TOKENS : 0;

    return freeTokensTotal + adTokens + bonusTokens;
};

const getCumulativeChestCosts = (model: ILreProgressModel) => {
    let runningTotal = 0;

    return model.chestsMilestones.map(chest => {
        runningTotal += chest.engramCost;
        return runningTotal;
    });
};

const getPointCurrencyEarned = (
    model: ILreProgressModel,
    startingPoints: number,
    endingPoints: number,
    buyBonusDelivery: boolean
) =>
    model.pointsMilestones
        .filter(milestone => milestone.cumulativePoints > startingPoints && milestone.cumulativePoints <= endingPoints)
        .reduce(
            (total, milestone) =>
                total + milestone.engramPayout + (buyBonusDelivery ? BONUS_DELIVERY_EXTRA_CURRENCY : 0),
            0
        );

const getMilestoneLabel = (ascensionMilestones: AscensionMilestone[], index: number) =>
    ascensionMilestones[index]?.label ?? 'Full Clear';

export const createInitialLeForecastRoundConfig = (
    model: ILreProgressModel,
    legendaryEvent: ILegendaryEvent,
    nowMillis: number
): LeForecastRoundConfig[] => {
    const statuses = getStatuses(legendaryEvent, nowMillis);

    return ([1, 2, 3] as const).map(round => {
        const occurrence = model.occurrenceProgress.find(item => item.eventOccurrence === round);
        const status = statuses.find(item => item.round === round)?.status ?? 'future';
        const isCurrentActiveRound = status === 'active';

        return {
            round,
            freeMissions: occurrence?.freeMissionsProgress ?? 0,
            buyBonusDelivery:
                (isCurrentActiveRound && !!model.syncedProgress?.hasPremiumPayout) ||
                (occurrence?.premiumMissionsProgress ?? 0) > 0,
            paidMissions: occurrence?.premiumMissionsProgress ?? 0,
            buyCurrencyBundle: occurrence?.bundlePurchased ?? false,
            buyOhSoCloseShards: false,
        };
    });
};

export const computeLeRoundForecasts = ({
    legendaryEvent,
    model,
    currentProgress,
    tokenIncrements,
    roundConfigs,
    nowMillis,
}: {
    legendaryEvent: ILegendaryEvent;
    model: ILreProgressModel;
    currentProgress: EventProgress;
    tokenIncrements: number[];
    roundConfigs: LeForecastRoundConfig[];
    nowMillis: number;
}): LeForecastRoundResult[] => {
    const statuses = getStatuses(legendaryEvent, nowMillis);
    const configsByRound = new Map(roundConfigs.map(config => [config.round, config]));
    const occurrenceByRound = new Map(
        model.occurrenceProgress.map(occurrence => [occurrence.eventOccurrence, occurrence])
    );
    const chestCosts = getCumulativeChestCosts(model);
    const ascensionMilestones = getAscensionMilestones(model);

    let tokenIndex = 0;
    let totalPoints = currentProgress.totalPoints;
    let totalCurrency = currentProgress.totalCurrency;
    let currentRarity = currentProgress.currentRarity;
    let currentStars = currentProgress.currentStars;
    let currentShards = currentProgress.currentShards;
    let currentClaimedChestIndex = currentProgress.currentClaimedChestIndex;

    return statuses.map(({ round, status }) => {
        const config = configsByRound.get(round) ?? {
            round,
            freeMissions: 0,
            buyBonusDelivery: false,
            paidMissions: 0,
            buyCurrencyBundle: false,
            buyOhSoCloseShards: false,
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
                nextMilestone: getMilestoneLabel(
                    ascensionMilestones,
                    getNextAscensionMilestoneIndex(ascensionMilestones, currentRarity, currentStars)
                ),
                shardsNeededForNextMilestone: 0,
                ohSoCloseEligible: false,
                ohSoCloseShardCost: 0,
                boughtOhSoCloseShards: 0,
            };
        }

        const occurrence = occurrenceByRound.get(round);
        const missionCurrencyPerMission =
            MISSION_CURRENCY + (config.buyBonusDelivery ? BONUS_DELIVERY_EXTRA_CURRENCY : 0);
        const currentFreeMissions = status === 'active' ? (occurrence?.freeMissionsProgress ?? 0) : 0;
        const currentPaidMissions = status === 'active' ? (occurrence?.premiumMissionsProgress ?? 0) : 0;
        const currentBundlePurchased = status === 'active' ? (occurrence?.bundlePurchased ?? false) : false;

        const freeMissions = clampMissionCount(config.freeMissions);
        const paidMissions = config.buyBonusDelivery ? clampMissionCount(config.paidMissions) : 0;

        const additionalFreeMissions = Math.max(0, freeMissions - currentFreeMissions);
        const additionalPaidMissions = Math.max(0, paidMissions - currentPaidMissions);
        const additionalBundleCurrency =
            config.buyCurrencyBundle && !currentBundlePurchased ? CURRENCY_BUNDLE_CURRENCY : 0;

        const tokensAvailable =
            status === 'active'
                ? getCurrentRoundTokens(legendaryEvent, model, config.buyBonusDelivery, nowMillis)
                : getFullRoundTokens(config.buyBonusDelivery);

        const tokensUsed = Math.min(tokensAvailable, tokenIncrements.length - tokenIndex);
        const pointsEarned = tokenIncrements
            .slice(tokenIndex, tokenIndex + tokensUsed)
            .reduce((sum, value) => sum + value, 0);
        tokenIndex += tokensUsed;

        const endingPoints = totalPoints + pointsEarned;
        const pointCurrencyEarned = getPointCurrencyEarned(model, totalPoints, endingPoints, config.buyBonusDelivery);
        const missionCurrencyEarned = (additionalFreeMissions + additionalPaidMissions) * missionCurrencyPerMission;
        const currencyEarned = pointCurrencyEarned + missionCurrencyEarned + additionalBundleCurrency;
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

        let nextMilestoneIndex = getNextAscensionMilestoneIndex(ascensionMilestones, currentRarity, currentStars);
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
            shardsNeededForNextMilestone <= OH_SO_CLOSE_MAX_SHARDS;

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
            nextMilestone: getMilestoneLabel(ascensionMilestones, nextMilestoneIndex),
            shardsNeededForNextMilestone: remainingShardsForNextMilestone,
            ohSoCloseEligible,
            ohSoCloseShardCost: shardsNeededForNextMilestone,
            boughtOhSoCloseShards,
        };
    });
};
