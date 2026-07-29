import { ShopEventData } from '@/fsd/4-entities/shops';

import { DAYS } from './shop-events.constants';
import type { Day } from './shop-events.constants';

/**
 * The 7-day weekday sequence for an event, starting at the actual UTC weekday of `event.startUtc`
 * (e.g. a Wednesday-start event yields `['WED','THU',...,'MON','TUE']`). Position `i` in this array
 * is "day `i` of any week of this event" - shop events don't necessarily start on a Monday, so this
 * replaces the fixed `DAYS` order wherever day-of-week needs to line up with real calendar dates.
 */
export function getEventDayOrder(event: ShopEventData): Day[] {
    const mondayBasedStart = (new Date(event.startUtc).getUTCDay() + 6) % 7; // Mon=0..Sun=6
    return Array.from({ length: 7 }, (_, index) => DAYS[(mondayBasedStart + index) % 7]);
}

export function getEventDate(event: ShopEventData, week: number, day: Day): string {
    const dayIndex = getEventDayOrder(event).indexOf(day);
    const offsetMs = ((week - 1) * 7 + dayIndex) * 86_400_000;
    const d = new Date(event.startUtc + offsetMs);
    const month = d.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
    const dayNumber = d.getUTCDate().toString().padStart(2, '0');
    return `${month} ${dayNumber}`;
}

export interface EventDateIndexEntry {
    week: number;
    day: Day;
}

export interface EventDateIndex {
    allDates: EventDateIndexEntry[];
    /** Index into `allDates` corresponding to today, or -1 if today falls outside the event window. */
    todayIndex: number;
    /** Default selected index: today if in-event, else the first day (before) or last day (after). */
    defaultIndex: number;
}

/** Builds the full day-by-day index for an event, derived from its start date and week count. */
export function buildEventDateIndex(event: ShopEventData): EventDateIndex {
    const dayOrder = getEventDayOrder(event);
    const totalDays = event.weeks.length * 7;
    const allDates: EventDateIndexEntry[] = Array.from({ length: totalDays }, (_, index) => ({
        week: Math.floor(index / 7) + 1,
        day: dayOrder[index % 7],
    }));

    const now = new Date();
    const utcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const offsetDays = Math.round((utcMs - event.startUtc) / 86_400_000);

    const todayIndex = offsetDays >= 0 && offsetDays < totalDays ? offsetDays : -1;
    const defaultIndex = todayIndex >= 0 ? todayIndex : offsetDays < 0 ? 0 : totalDays - 1;

    return { allDates, todayIndex, defaultIndex };
}
