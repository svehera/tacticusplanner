import type { ISurvivalEvent } from '@/fsd/4-entities/survival';

/** Chronological order of survival events. An event not listed here ranks after every known event. */
const SURVIVAL_EVENT_ORDER: readonly string[] = [
    'season_may_2026_event',
    'season_september_2026_event',
    'season_crescendo_01_event',
];

export function getSurvivalEventRank(event: ISurvivalEvent): number {
    const index = SURVIVAL_EVENT_ORDER.indexOf(event.eventName);
    return index === -1 ? Number.POSITIVE_INFINITY : index;
}
