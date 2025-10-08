import { allLegendaryEvents } from './data';
import { ILegendaryEventStatic } from './static-data.model';

const DAY_MS = 24 * 60 * 60 * 1000;

type UnfinishedScheduledEvent = Required<Pick<ILegendaryEventStatic, 'nextEventDateUtc'>> & ILegendaryEventStatic;

function isUnfinishedScheduledEvent(event: ILegendaryEventStatic): event is UnfinishedScheduledEvent {
    return !event.finished && !!event.nextEventDateUtc;
}

export class LegendaryEventService {
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
