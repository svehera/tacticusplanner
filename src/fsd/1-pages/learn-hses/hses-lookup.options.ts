import { HomescreenEventData, HseSchedule, getHseScheduleStatus } from '@/fsd/4-entities/homescreen_events';

export interface HseOption {
    /** Unique per option: a scheduled run is keyed by event and start time, so one HSE can appear several times. */
    value: string;
    eventName: string;
    label: string;
    gameModeIcon?: string;
}

export interface HseOptionsResult {
    /** Active and upcoming runs, in chronological order. */
    scheduled: HseOption[];
    /** Every event, alphabetically by display name. */
    others: HseOption[];
}

function formatUtcDate(date: Date, includeYear: boolean): string {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: includeYear ? 'numeric' : undefined,
        timeZone: 'UTC',
    });
}

/** "Aug 23 – Aug 26" in UTC. `endUtc` is exclusive, so the last day shown is the one containing `end - 1ms`. */
export function formatHseDateRange(schedule: HseSchedule, now: Date = new Date()): string {
    const start = new Date(schedule.startUtc);
    const end = new Date(Date.parse(schedule.endUtc) - 1);
    const includeYear = [start, end].some(date => date.getUTCFullYear() !== now.getUTCFullYear());
    return `${formatUtcDate(start, includeYear)} – ${formatUtcDate(end, includeYear)}`;
}

export function scheduledRunValue(schedule: HseSchedule): string {
    return `run:${schedule.eventName}:${schedule.startUtc}`;
}

/**
 * Builds the dropdown contents: current and upcoming runs first (chronological, each labelled with its
 * dates), then all events alphabetically. An event with a current/upcoming run appears in both lists.
 */
export function buildHseOptions(
    events: { event: HomescreenEventData; displayName: string }[],
    schedules: HseSchedule[],
    now: Date = new Date()
): HseOptionsResult {
    const nameByEvent = new Map(events.map(({ event, displayName }) => [event.eventName, displayName]));

    const iconByEvent = new Map(events.map(({ event }) => [event.eventName, event.gameModeIcon]));

    const scheduled = schedules
        .filter(schedule => nameByEvent.has(schedule.eventName))
        .filter(schedule => ['active', 'upcoming'].includes(getHseScheduleStatus(schedule, now)))
        .toSorted((a, b) => Date.parse(a.startUtc) - Date.parse(b.startUtc))
        .map(schedule => ({
            value: scheduledRunValue(schedule),
            eventName: schedule.eventName,
            label: `${nameByEvent.get(schedule.eventName)} (${formatHseDateRange(schedule, now)})`,
            gameModeIcon: iconByEvent.get(schedule.eventName),
        }));

    const others = events
        .toSorted((a, b) => a.displayName.localeCompare(b.displayName))
        .map(({ event, displayName }) => ({
            value: event.eventName,
            eventName: event.eventName,
            label: displayName,
            gameModeIcon: event.gameModeIcon,
        }));

    return { scheduled, others };
}
