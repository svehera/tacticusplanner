import { ILegendaryEventStatic } from './static-data.model';

import { allLegendaryEvents } from './index';

export class LegendaryEventService {
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

    public static getUnfinishedLegendaryEvents(): ILegendaryEventStatic[] {
        return allLegendaryEvents.filter(e => !e.finished);
    }

    public static getLegendaryEvents() {
        return allLegendaryEvents;
    }

    public static getActiveLreUnitId(): string | undefined {
        return this.getActiveEvent().unitSnowprintId;
    }
}
