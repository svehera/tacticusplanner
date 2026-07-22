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
