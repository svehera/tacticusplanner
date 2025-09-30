import { ILegendaryEventStatic } from './static-data.model';

import { allLegendaryEvents } from './index';

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
            startDates.push(new Date(startDates[i - 1].getTime() + this.getLegendaryEventDurationMillis()));
        }
        return startDates;
    }

    /** @returns the number of milliseconds in a legendary event. */
    public static getLegendaryEventDurationMillis(): number {
        return 7 * 24 * 60 * 60 * 1000; // 7 days
    }

    public static getActiveEvent(): ILegendaryEventStatic {
        let ret: ILegendaryEventStatic | undefined = undefined;
        for (const event of allLegendaryEvents.filter(e => !e.finished)) {
            if (event.finished) continue;
            if (event.nextEventDateUtc) {
                const nextEventDate = new Date(event.nextEventDateUtc);
                if (nextEventDate > new Date()) {
                    if (!ret || nextEventDate < new Date(ret.nextEventDateUtc!)) {
                        ret = event;
                    }
                }
            }
        }
        return ret!;
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
        return this.getActiveEvent().unitSnowprintId;
    }
}
