import { hseSchedules, type HseSchedule } from './data';
import { homescreenEvents } from './homescreen-events.data';

/**
 * Every known event run: the `schedule` embedded in each event's JSON plus the hand-edited
 * `hseSchedules`. A run listed in both places (same event and start) is returned once.
 */
export const allHseSchedules: HseSchedule[] = (() => {
    const seen = new Set<string>();
    const result: HseSchedule[] = [];
    const embedded = homescreenEvents.flatMap(event =>
        (event.schedule ?? []).map(run => ({ eventName: event.eventName, startUtc: run.startUtc, endUtc: run.endUtc }))
    );
    for (const run of [...embedded, ...hseSchedules]) {
        const key = `${run.eventName}|${run.startUtc}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(run);
    }
    return result;
})();
