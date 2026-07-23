import type { HomescreenEventData, HomescreenEventTier, HomescreenEventTierKey } from './homescreen-event.model';

export function humanizeEventName(eventName: string): string {
    return eventName
        .split('_')
        .map(word => {
            if (word.toLowerCase() === 'hse') return 'HSE';
            if (/^\d/.test(word)) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
}

const IS_HERE_TITLE_RE = /^<i>(.+?)<\/i> is here$/;

/**
 * The player-facing event name, taken from the "<Name> is here" banner in the event's own
 * description text when present (the JSON `eventName`/id is often an internal codename, e.g.
 * `trait_boost_flying` displays as "Flying Boost" rather than "Trait Boost: Flying"). Falls back
 * to `humanizeEventName` for the few events whose description doesn't follow that exact pattern.
 */
export function getHseDisplayName(event: HomescreenEventData): string {
    const title = Object.values(event.tiers)
        .map(tier => tier?.descriptions?.[0])
        .find((description): description is string => !!description);

    const match = title ? IS_HERE_TITLE_RE.exec(title) : undefined;
    return match?.[1] ?? humanizeEventName(event.eventName);
}

/**
 * Resolves the tier to display for an event, given a preferred tier key (typically computed from
 * the player's power level / roster). Falls back to the event's `default` tier for events that
 * don't split rewards by power level.
 */
export function resolveHseTier(
    event: HomescreenEventData,
    preferredKey: HomescreenEventTierKey
): { key: HomescreenEventTierKey; tier: HomescreenEventTier } | undefined {
    const preferred = event.tiers[preferredKey];
    if (preferred) return { key: preferredKey, tier: preferred };

    const fallback = event.tiers.default;
    if (fallback) return { key: 'default', tier: fallback };

    return undefined;
}
