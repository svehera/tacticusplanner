export interface HomeCalendar {
    /** Path under `src/assets/images`. */
    image: string;
    /** First moment (UTC) this calendar is shown; absent for the oldest entry. */
    showFromUtc?: string;
}

/** Oldest first. Add the new image here with the date Snowprint's season starts. */
export const HOME_CALENDARS: HomeCalendar[] = [
    { image: 'calendar/calendar_143.webp' },
    { image: 'calendar/calendar_144.webp', showFromUtc: '2026-11-15T00:00:00Z' },
];

/** The newest calendar whose `showFromUtc` has passed. */
export function getCurrentHomeCalendarImage(
    now: Date = new Date(),
    calendars: HomeCalendar[] = HOME_CALENDARS
): string {
    const shown = calendars.filter(
        calendar => !calendar.showFromUtc || Date.parse(calendar.showFromUtc) <= now.getTime()
    );
    return shown.at(-1)?.image ?? calendars[0].image;
}
