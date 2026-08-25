/**
 * Hand-edited UTC start/end times for home-screen event runs. The server day boundary is
 * 00:00:00 UTC. Add an entry here whenever a new HSE run is announced or observed; multiple runs
 * of the same event may be listed (e.g. repeat runs) — `getHseSchedule` returns the last match.
 */
export interface HseSchedule {
    /** Matches `HomescreenEventData.eventName`, e.g. "arsenal_of_war". */
    eventName: string;
    /** ISO 8601 UTC, e.g. "2026-08-01T00:00:00Z". */
    startUtc: string;
    /** ISO 8601 UTC, exclusive. */
    endUtc: string;
}

export const hseSchedules: HseSchedule[] = [
    { eventName: 'machine_hunt', startUtc: '2026-08-23T08:00:00Z', endUtc: '2026-08-27T00:00:00Z' },
    {
        eventName: 'hse_trait_boost_terminator_armour',
        startUtc: '2026-09-01T08:00:00Z',
        endUtc: '2026-09-05T08:00:00Z',
    },
];

export function getHseSchedule(eventName: string): HseSchedule | undefined {
    return hseSchedules.toReversed().find(schedule => schedule.eventName === eventName);
}

export type HseScheduleStatus = 'active' | 'upcoming' | 'past' | 'unknown';

export function getHseScheduleStatus(schedule: HseSchedule | undefined, now: Date = new Date()): HseScheduleStatus {
    if (!schedule) return 'unknown';
    const nowMs = now.getTime();
    const startMs = Date.parse(schedule.startUtc);
    const endMs = Date.parse(schedule.endUtc);
    if (nowMs < startMs) return 'upcoming';
    if (nowMs >= endMs) return 'past';
    return 'active';
}

/** Whole UTC calendar days spanned by the schedule, minimum 1. */
export function getHseDurationDays(schedule: HseSchedule): number {
    const ms = Date.parse(schedule.endUtc) - Date.parse(schedule.startUtc);
    return Math.max(1, Math.ceil(ms / 86_400_000));
}

/** Whole days remaining from `now` through `endUtc`, clamped to [0, total duration]. Only meaningful for an active event. */
export function getHseRemainingDays(schedule: HseSchedule, now: Date = new Date()): number {
    const totalDays = getHseDurationDays(schedule);
    const remainingMs = Date.parse(schedule.endUtc) - now.getTime();
    return Math.max(0, Math.min(totalDays, Math.ceil(remainingMs / 86_400_000)));
}
