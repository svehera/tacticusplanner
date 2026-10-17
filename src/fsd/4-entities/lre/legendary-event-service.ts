import { createSafeGetter } from '@/fsd/5-shared/lib';

import { allLegendaryEvents } from './data';
import { ILegendaryEventStatic } from './static-data.model';

const DAY_MS = 24 * 60 * 60 * 1000;

type UnfinishedScheduledEvent = Required<Pick<ILegendaryEventStatic, 'nextEventDateUtc'>> & ILegendaryEventStatic;

function isUnfinishedScheduledEvent(event: ILegendaryEventStatic): event is UnfinishedScheduledEvent {
    return !event.finished && !!event.nextEventDateUtc;
}

const safeGet = createSafeGetter<typeof allLegendaryEvents>();

export class LegendaryEventService {
    /**
     * @returns the start dates of the active event (if there is one in progress at the moment) and
     *          the next several events.
     */
    public static getLegendaryEventStartDates(): Date[] {
        const kMaxEventsToReturn = 3;
        const activeEvent = this.getActiveEvent();
        const startDates: Date[] = [];
        if (activeEvent !== undefined && activeEvent.nextEventDateUtc) {
            startDates.push(new Date(activeEvent.nextEventDateUtc));
        } else {
            // Find the most recent past event to use as a starting point.
            const now = Date.now();
            const pastEvents = allLegendaryEvents
                .map(event => ({ event, startDate: Date.parse(safeGet(event, 'nextEventDateUtc') ?? '') }))
                .filter(({ startDate }) => Number.isFinite(startDate) && startDate < now)
                .toSorted((a, b) => b.startDate - a.startDate);
            if (pastEvents.length > 0) {
                startDates.push(new Date(pastEvents[0].startDate));
            } else {
                const knownStartTimeMillis = 1_766_880_000_000; // This was the start of Farsight 1, it's arbitrary.

                const now = Date.now();
                for (let index = 0; ; ++index) {
                    const newStart = knownStartTimeMillis + index * this.getTimeBetweenLegendaryEvents();
                    if (
                        newStart > now ||
                        (newStart <= now && newStart + this.getLegendaryEventDurationMillis() > now)
                    ) {
                        startDates.push(new Date(newStart));
                        break;
                    }
                }
            }
        }
        for (let index = 1; index < kMaxEventsToReturn; index++) {
            startDates.push(new Date(startDates[index - 1].getTime() + this.getTimeBetweenLegendaryEvents()));
        }
        return startDates;
    }

    /** @returns the number of milliseconds in a legendary event. */
    public static getLegendaryEventDurationMillis(): number {
        return 7 * 24 * 60 * 60 * 1000; // 7 days
    }

    /** @returns the number of milliseconds between the start of two legendary events. */
    public static getTimeBetweenLegendaryEvents(): number {
        return 5 * 7 * 24 * 60 * 60 * 1000; // 5 weeks
    }

    public static getActiveEvent(events?: ILegendaryEventStatic[]): ILegendaryEventStatic | undefined {
        const sevenDaysAgoTs = Date.now() - 7 * DAY_MS;
        const sortedEvents = (events ?? allLegendaryEvents)
            .filter(event => isUnfinishedScheduledEvent(event))
            .map(event => ({ event, startDate: Date.parse(event.nextEventDateUtc) }))
            // started in the last 7 days (exclusive) or any future date
            .filter(({ startDate }) => Number.isFinite(startDate) && startDate > sevenDaysAgoTs)
            .toSorted((a, b) => a.startDate - b.startDate);
        return sortedEvents[0]?.event;
    }

    /**
     * Orders unfinished events for menus: the live event (or, if none is live, the next upcoming one)
     * first; then the next upcoming one when an event is live (a future patch can be announced
     * mid-event); then everything else newest start date first. Items without a valid date go last.
     */
    public static sortForDisplay<T>(
        items: readonly T[],
        getStartDateUtc: (item: T) => string | undefined,
        nowMillis: number = Date.now()
    ): T[] {
        const dated = items
            .map(item => ({ item, start: Date.parse(getStartDateUtc(item) ?? '') }))
            .filter(({ start }) => Number.isFinite(start));
        const undated = items.filter(item => !Number.isFinite(Date.parse(getStartDateUtc(item) ?? '')));

        const live = dated
            .filter(({ start }) => start <= nowMillis && nowMillis < start + this.getLegendaryEventDurationMillis())
            .toSorted((a, b) => a.start - b.start);
        const upcoming = dated.filter(({ start }) => start > nowMillis).toSorted((a, b) => a.start - b.start);

        const head = live.length > 0 ? [live[0], ...upcoming.slice(0, 1)] : upcoming.slice(0, 1);
        const headItems = new Set(head.map(x => x.item));
        const rest = dated.filter(x => !headItems.has(x.item)).toSorted((a, b) => b.start - a.start);

        return [...[...head, ...rest].map(x => x.item), ...undated];
    }

    public static getUnfinishedEvents(): ILegendaryEventStatic[] {
        return allLegendaryEvents.filter(event => !event.finished);
    }

    public static getEventByCharacterSnowprintId(snowprintId: string): ILegendaryEventStatic | undefined {
        return allLegendaryEvents.find(event => event.unitSnowprintId === snowprintId);
    }

    public static getUnfinishedLegendaryEventCharacterSnowprintIds(): string[] {
        return allLegendaryEvents.filter(event => !event.finished).map(event => event.unitSnowprintId);
    }

    public static getLegendaryEvents() {
        return allLegendaryEvents;
    }

    public static getActiveLreUnitId(): string | undefined {
        return this.getActiveEvent()?.unitSnowprintId;
    }
}
