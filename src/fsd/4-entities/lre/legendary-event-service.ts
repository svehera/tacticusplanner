import { allLegendaryEvents } from './data';
import { ILegendaryEventStatic } from './static-data.model';

type UnfinishedScheduledEvent = Required<Pick<ILegendaryEventStatic, 'nextEventDateUtc'>> & ILegendaryEventStatic;

function unfishedScheduledEvent(e: ILegendaryEventStatic): e is UnfinishedScheduledEvent {
    return !e.finished && e.nextEventDateUtc !== undefined;
}

export class LegendaryEventService {
    public static getActiveEvent(events?: ILegendaryEventStatic[]): ILegendaryEventStatic | undefined {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const sortedEvents = (events ?? allLegendaryEvents)
            .filter(unfishedScheduledEvent)
            // Consider events which have started in the last 7 days or will start in the future
            .filter(e => new Date(e.nextEventDateUtc) > sevenDaysAgo)
            .sort((a, b) => {
                return new Date(a.nextEventDateUtc).getTime() - new Date(b.nextEventDateUtc).getTime();
            });
        if (sortedEvents.length > 0) {
            return sortedEvents[0];
        }
        return undefined;
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
