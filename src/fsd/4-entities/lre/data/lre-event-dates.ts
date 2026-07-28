import { LegendaryEventEnum } from '../enums';

export interface ILreEventDates {
    finished: boolean;
    nextEventDate?: string;
    nextEventDateUtc?: string;
}

/**
 * The new machine-generated per-character LRE data has no concept of dates or a
 * "finished" flag, so these are hand-maintained here instead. Pre-populated from
 * the old hand-rolled files' last known values at the time of migration.
 */
export const lreEventDates: Record<number, ILreEventDates> = {
    [LegendaryEventEnum.Dante]: { finished: true },
    [LegendaryEventEnum.Trajann]: {
        finished: true,
        nextEventDate: 'May 17, 2026',
        nextEventDateUtc: 'Sun, 17 May 2026 00:00:00 GMT',
    },
    [LegendaryEventEnum.Lucius]: {
        finished: false,
        nextEventDate: 'July 26, 2026',
        nextEventDateUtc: 'Sun, 26 July 2026 00:00:00 GMT',
    },
    [LegendaryEventEnum.Farsight]: {
        finished: false,
        nextEventDate: 'June 21, 2026',
        nextEventDateUtc: 'Sun, 21 June 2026 00:00:00 GMT',
    },
    [LegendaryEventEnum.Uthar]: {
        finished: false,
        nextEventDate: 'March 08, 2026',
        nextEventDateUtc: 'Sun, 08 March 2026 00:00:00 GMT',
    },
    [LegendaryEventEnum.Lysander]: {
        finished: false,
        nextEventDate: 'August 30, 2026',
        nextEventDateUtc: 'Sun, 30 August 2026 00:00:00 GMT',
    },
};
