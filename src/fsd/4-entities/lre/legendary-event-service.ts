import { ILegendaryEventStatic } from './static-data.model';
import { allLegendaryEvents } from './static-lre-data';

const DAY_MS = 24 * 60 * 60 * 1000;

type UnfinishedScheduledEvent = Required<Pick<ILegendaryEventStatic, 'nextEventDateUtc'>> & ILegendaryEventStatic;

function isUnfinishedScheduledEvent(event: ILegendaryEventStatic): event is UnfinishedScheduledEvent {
    return !event.finished && !!event.nextEventDateUtc;
}

export class LegendaryEventService {
    /**
     * @returns the start dates of the active event (if there is one in progress at the moment) and
     *          the next several events.
     */
    public static getLegendaryEventStartDates(): Date[] {
        const kMaxEventsToReturn = 3;
        const activeEvent = this.getActiveEvent();
        const startDates: Date[] = [];
        if (activeEvent && activeEvent.nextEventDateUtc) {
            startDates.push(new Date(activeEvent.nextEventDateUtc));
        }
        for (let i = 1; i < kMaxEventsToReturn; i++) {
            startDates.push(new Date(startDates[i - 1].getTime() + this.getTimeBetweenLegendaryEvents()));
        }
        return startDates;
    }

    /** @returns the number of milliseconds in a legendary event. */
    public static getLegendaryEventDurationMillis(): number {
        return 7 * 24 * 60 * 60 * 1000; // 7 days
    }

    /** @returns the number of milliseconds in a legendary event. */
    public static getTimeBetweenLegendaryEvents(): number {
        return 5 * 7 * 24 * 60 * 60 * 1000; // 5 weeks
    }

    public static getActiveEvent(events?: ILegendaryEventStatic[]): ILegendaryEventStatic | undefined {
        const sevenDaysAgoTs = Date.now() - 7 * DAY_MS;
        const sortedEvents = (events ?? allLegendaryEvents)
            .filter(isUnfinishedScheduledEvent)
            .map(event => ({ event, startDate: Date.parse(event.nextEventDateUtc) }))
            // started in the last 7 days (exclusive) or any future date
            .filter(({ startDate }) => Number.isFinite(startDate) && startDate > sevenDaysAgoTs)
            .sort((a, b) => a.startDate - b.startDate);
        return sortedEvents[0]?.event;
    }

    public static getUnfinishedEvents(): ILegendaryEventStatic[] {
        return allLegendaryEvents.filter(e => !e.finished);
    }

    public static getEventByCharacterSnowprintId(snowprintId: string): ILegendaryEventStatic | undefined {
        return allLegendaryEvents.find(e => e.unitSnowprintId === snowprintId);
    }

    public static getUnfinishedLegendaryEventCharacterSnowprintIds(): string[] {
        return allLegendaryEvents.filter(e => !e.finished).map(e => e.unitSnowprintId);
    }

    public static getLegendaryEvents() {
        return allLegendaryEvents;
    }

    public static getActiveLreUnitId(): string | undefined {
        return this.getActiveEvent()?.unitSnowprintId;
    }
}
