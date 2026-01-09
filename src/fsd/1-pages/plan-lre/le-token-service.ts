import { ILegendaryEvent } from '@/fsd/3-features/lre';

const ONE_HOUR_MILLIS = 60 * 60 * 1000;
const ONE_DAY_MILLIS = 24 * ONE_HOUR_MILLIS;
const FREE_TOKENS_PER_EVENT = 7 * 8 - 1 + 6; // 7 days, every 3 hours + extra tokens
const AD_TOKENS_PER_EVENT = 7;
const PREMIUM_TOKENS_PER_EVENT = 6;

export class LeTokenService {
    public static getEventStartTimeMillis(event: ILegendaryEvent): number {
        const startDate = new Date(event.nextEventDateUtc ?? '');
        return startDate.getTime();
    }

    public static getEventEndTimeMillis(event: ILegendaryEvent): number {
        return this.getEventStartTimeMillis(event) + ONE_DAY_MILLIS * 7;
    }

    /**
     * Returns the number of milliseconds remaining in the event, or undefined if
     * the event is not active.
     */
    public static getMillisRemainingInIteration(event: ILegendaryEvent, nowMillis: number): number {
        if (nowMillis < this.getEventStartTimeMillis(event)) return ONE_DAY_MILLIS * 7;
        if (nowMillis > this.getEventEndTimeMillis(event)) return 0;
        return ONE_DAY_MILLIS * 7 - (nowMillis - this.getEventStartTimeMillis(event));
    }

    private static getTokensRemainingInEventHelper(
        event: ILegendaryEvent,
        nowMillis: number,
        tokensPerEvent: number,
        millisPerToken: number
    ): number {
        if (nowMillis > this.getEventEndTimeMillis(event) && event.eventStage > 3) return 0;
        let fullEvents = 3 - event.eventStage + 1;
        if (nowMillis < this.getEventStartTimeMillis(event)) return fullEvents * tokensPerEvent;
        --fullEvents;
        const millisRemaining = this.getMillisRemainingInIteration(event, nowMillis);
        if (millisRemaining === undefined) return fullEvents * tokensPerEvent;
        const tokensThisEvent = Math.floor(millisRemaining / millisPerToken);
        return fullEvents * tokensPerEvent + tokensThisEvent;
    }

    /** Returns the total number of free tokens remaining across all iterations of this event. */
    public static getFreeTokensRemainingInEvent(event: ILegendaryEvent, nowMillis: number): number {
        return this.getTokensRemainingInEventHelper(event, nowMillis, FREE_TOKENS_PER_EVENT, 3 * ONE_HOUR_MILLIS);
    }

    /** Returns the total number of ad tokens remaining across all iterations of this event. */
    public static getAdTokensRemainingInEvent(event: ILegendaryEvent, nowMillis: number): number {
        return this.getTokensRemainingInEventHelper(event, nowMillis, AD_TOKENS_PER_EVENT, ONE_DAY_MILLIS);
    }

    /**
     * Returns the total number of premium tokens remaining across all iterations of this event,
     * based on the user's input of whether they purchased or intend to purchase the bonus
     * delivery (premium missions) for each iteration.
     */
    public static getPremiumTokensRemainingInEvent(
        event: ILegendaryEvent,
        premiumPurchasedFirstEvent: boolean,
        premiumPurchasedSecondEvent: boolean,
        premiumPurchasedThirdEvent: boolean,
        nowMillis: number
    ): number {
        const premiums = [premiumPurchasedFirstEvent, premiumPurchasedSecondEvent, premiumPurchasedThirdEvent];
        const startStage = this.getEventStartTimeMillis(event) > nowMillis ? event.eventStage - 1 : event.eventStage;
        return (
            premiums.filter((_, index) => index >= startStage).reduce((acc, val) => acc + (val ? 1 : 0), 0) *
            PREMIUM_TOKENS_PER_EVENT
        );
    }

    /**
     * Returns the number of tokens remaining in this iteration of the event.
     */
    public static getFreeTokensRemainingInIteration(event: ILegendaryEvent, nowMillis: number): number {
        const millisRemaining = this.getMillisRemainingInIteration(event, nowMillis);
        if (nowMillis < this.getEventStartTimeMillis(event)) return FREE_TOKENS_PER_EVENT;
        return Math.floor(millisRemaining / (3 * ONE_HOUR_MILLIS));
    }

    /**
     * Returns the number of ad tokens remaining in this iteration of the event.
     */
    public static getAdTokensRemainingInIteration(event: ILegendaryEvent, nowMillis: number): number {
        const millisRemaining = this.getMillisRemainingInIteration(event, nowMillis);
        return Math.floor(millisRemaining / ONE_DAY_MILLIS);
    }

    /** Returns the number of premium tokens remaining in this iteration of the event. */
    public static getPremiumTokensRemainingInIteration(
        event: ILegendaryEvent,
        premiumPurchased: boolean,
        nowMillis: number
    ): number {
        if (!premiumPurchased || nowMillis > this.getEventStartTimeMillis(event)) return 0;
        return PREMIUM_TOKENS_PER_EVENT;
    }

    /**
     * Returns which iteration of the event the user can expect to use their token, 0 means the
     * first event, etc. undefined if the user would run out of events before the particular token
     * would be used.
     *
     * currentTokensRemaining is taken as passed, but is, for the time being, always zero. Once we
     * get LE data in the API (if ever), we can read this from the API to get a more accurate
     * picture.
     */
    public static getIterationForToken(
        tokenIndex: number,
        currentTokensRemaining: number,
        event: ILegendaryEvent,
        premiumPurchasedFirstEvent: boolean,
        premiumPurchasedSecondEvent: boolean,
        premiumPurchasedThirdEvent: boolean,
        nowMillis: number
    ): number | undefined {
        const premiums = [premiumPurchasedFirstEvent, premiumPurchasedSecondEvent, premiumPurchasedThirdEvent];
        const tokensRemaining =
            currentTokensRemaining +
            this.getFreeTokensRemainingInIteration(event, nowMillis) +
            this.getAdTokensRemainingInIteration(event, nowMillis) +
            this.getPremiumTokensRemainingInIteration(event, premiums[event.eventStage - 1], nowMillis);
        console.log(
            'event tokenIndex currentTokensRemaining eventStage premiums, nowMillis:',
            event,
            tokenIndex,
            currentTokensRemaining,
            event.eventStage,
            premiums,
            nowMillis
        );
        console.log(
            'free ad premium: ',
            this.getFreeTokensRemainingInIteration(event, nowMillis),
            this.getAdTokensRemainingInIteration(event, nowMillis),
            this.getPremiumTokensRemainingInIteration(event, premiums[event.eventStage - 1], nowMillis)
        );
        console.log('tokensremaining eventStage:', tokensRemaining, event.eventStage);
        if (tokenIndex < tokensRemaining) return event.eventStage - 1;
        tokenIndex -= tokensRemaining;
        for (let iteration = event.eventStage + 1; iteration <= 3; ++iteration) {
            if (
                tokenIndex <
                FREE_TOKENS_PER_EVENT + AD_TOKENS_PER_EVENT + (premiums[iteration - 1] ? PREMIUM_TOKENS_PER_EVENT : 0)
            ) {
                return iteration - 1;
            }
            tokenIndex -=
                FREE_TOKENS_PER_EVENT + AD_TOKENS_PER_EVENT + (premiums[iteration - 1] ? PREMIUM_TOKENS_PER_EVENT : 0);
        }
        return undefined;
    }
}
