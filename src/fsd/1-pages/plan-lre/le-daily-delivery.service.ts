import { ILegendaryEvent, RequirementStatus } from '@/fsd/3-features/lre';

import { LeTokenService } from './le-token-service';
import { ILreProgressModel, ILreTrackProgress } from './lre.models';

const ONE_DAY_MILLIS = 24 * 60 * 60 * 1000;
const DEFAULT_REGEN_MILLIS = 3 * 60 * 60 * 1000;

export const EVENT_DAYS = 7;
export const BONUS_DELIVERY_TOKENS = 6;

/** Free tokens that become available on each day of a full round: 6 up-front, 8 per day, minus one. */
const FREE_TOKENS_BY_DAY: readonly number[] = [14, 8, 8, 8, 8, 8, 7];

export interface DailyObjectiveEstimate {
    /** Cumulative objectives cleared at the end of each of the 7 days. */
    clearedByDayEnd: number[];
    /** Mean objectives cleared at the daily payouts that are still to come. */
    averageAtPayouts: number;
    /** Objectives cleared at the end of the round. */
    endingObjectives: number;
}

/**
 * Models the "daily delivery": at the end of each of the 7 days of a round, the player is paid
 * `multiplier * objectives cleared so far`. Objectives are cleared by spending tokens, so we
 * estimate the per-day cleared count from when tokens become available.
 */
export class LeDailyDeliveryService {
    /** Counts every fully cleared objective (restriction or ace) across all tracks. */
    public static countClearedObjectives(tracksProgress: readonly ILreTrackProgress[]): number {
        let count = 0;
        for (const track of tracksProgress) {
            for (const battle of track.battles) {
                for (const requirement of battle.requirementsProgress) {
                    const cleared =
                        requirement.status === undefined
                            ? requirement.completed
                            : requirement.status === RequirementStatus.Cleared;
                    if (cleared) count += 1;
                }
            }
        }
        return count;
    }

    /** Zero-based index of the day containing `nowMillis`, clamped to the event's 7 days. */
    public static getDayIndex(legendaryEvent: ILegendaryEvent, timeMillis: number): number {
        const start = LeTokenService.getEventStartTimeMillis(legendaryEvent);
        return Math.min(EVENT_DAYS - 1, Math.max(0, Math.floor((timeMillis - start) / ONE_DAY_MILLIS)));
    }

    /** Zero-based index of the first day whose end-of-day payout has not happened yet. */
    public static getFirstPayoutDay(legendaryEvent: ILegendaryEvent, isActive: boolean, nowMillis: number): number {
        if (!isActive) return 0;
        const start = LeTokenService.getEventStartTimeMillis(legendaryEvent);
        for (let day = 0; day < EVENT_DAYS; day++) {
            if (start + (day + 1) * ONE_DAY_MILLIS > nowMillis) return day;
        }
        return EVENT_DAYS;
    }

    /**
     * Number of tokens that become available on each of the 7 days. For an active round, tokens
     * already held count toward the current day, and elapsed days are zero.
     */
    public static getTokensPerDay(
        legendaryEvent: ILegendaryEvent,
        model: ILreProgressModel,
        buyBonusDelivery: boolean,
        isActive: boolean,
        nowMillis: number
    ): number[] {
        const perDay: number[] = Array.from({ length: EVENT_DAYS }, () => 0);

        if (!isActive) {
            for (let day = 0; day < EVENT_DAYS; day++) {
                perDay[day] = FREE_TOKENS_BY_DAY[day] + 1;
            }
            if (buyBonusDelivery) perDay[0] += BONUS_DELIVERY_TOKENS;
            return perDay;
        }

        const start = LeTokenService.getEventStartTimeMillis(legendaryEvent);
        const end = LeTokenService.getEventEndTimeMillis(legendaryEvent);
        const synced = model.syncedProgress;
        const currentDay = this.getDayIndex(legendaryEvent, nowMillis);
        const add = (timeMillis: number, count = 1) => {
            perDay[this.getDayIndex(legendaryEvent, timeMillis)] += count;
        };

        // Free tokens: those already held, then every regen tick until the round ends.
        add(nowMillis, synced?.currentTokens ?? 0);
        const regenMillis = synced?.regenDelayInSeconds ? synced.regenDelayInSeconds * 1000 : DEFAULT_REGEN_MILLIS;
        const nextToken = synced?.nextTokenMillisUtc;
        const firstTick = nextToken ?? nowMillis;
        if (nextToken !== undefined && nextToken < end) add(nextToken);
        if (firstTick < end) {
            const ticks = Math.floor((end - firstTick) / regenMillis);
            for (let tick = 1; tick <= ticks; tick++) add(firstTick + tick * regenMillis);
        }

        // Ad tokens: one per day, today's only if it hasn't been used.
        if (!synced?.hasUsedAdForExtraTokenToday) add(nowMillis);
        for (let day = currentDay + 1; day < EVENT_DAYS; day++) add(start + day * ONE_DAY_MILLIS);

        // Bonus delivery: tokens arrive immediately, unless already bought (then they're in hand).
        if (buyBonusDelivery && !synced?.hasPremiumPayout) add(nowMillis, BONUS_DELIVERY_TOKENS);

        return perDay;
    }

    /**
     * Spends `tokensToUse` tokens from the shared queue starting at `tokenStart`, as soon as each
     * becomes available, and reports how many objectives are cleared at the end of each day.
     */
    public static estimateObjectives({
        tokensPerDay,
        tokensToUse,
        tokenObjectives,
        tokenStart,
        startingObjectives,
        firstPayoutDay,
    }: {
        tokensPerDay: readonly number[];
        tokensToUse: number;
        tokenObjectives: readonly number[];
        tokenStart: number;
        startingObjectives: number;
        firstPayoutDay: number;
    }): DailyObjectiveEstimate {
        let cleared = startingObjectives;
        let used = 0;
        const clearedByDayEnd: number[] = [];

        for (let day = 0; day < EVENT_DAYS; day++) {
            const tokensToday = Math.min(tokensPerDay[day] ?? 0, tokensToUse - used);
            for (let index = 0; index < tokensToday; index++) {
                cleared += tokenObjectives[tokenStart + used + index] ?? 0;
            }
            used += tokensToday;
            clearedByDayEnd.push(cleared);
        }

        const payoutDays = clearedByDayEnd.slice(firstPayoutDay);
        const averageAtPayouts =
            payoutDays.length > 0 ? payoutDays.reduce((sum, value) => sum + value, 0) / payoutDays.length : 0;

        return { clearedByDayEnd, averageAtPayouts, endingObjectives: cleared };
    }
}
