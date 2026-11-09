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
        finished: true,
        nextEventDate: 'July 26, 2026',
        nextEventDateUtc: 'Sun, 26 July 2026 00:00:00 GMT',
    },
    [LegendaryEventEnum.Farsight]: {
        finished: false,
        nextEventDate: 'January 17, 2027',
        nextEventDateUtc: 'Sun, 17 January 2027 00:00:00 GMT',
    },
    [LegendaryEventEnum.Uthar]: {
        finished: false,
        nextEventDate: 'October 04, 2026',
        nextEventDateUtc: 'Sun, 04 October 2026 00:00:00 GMT',
    },
    [LegendaryEventEnum.Lysander]: {
        finished: false,
        nextEventDate: 'December 13, 2026',
        nextEventDateUtc: 'Sun, 13 December 2026 00:00:00 GMT',
    },
    [LegendaryEventEnum.FabiusBile]: {
        finished: false,
        nextEventDate: 'November 08, 2026',
        nextEventDateUtc: 'Sun, 08 November 2026 00:00:00 GMT',
    },
};
