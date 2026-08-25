/* eslint-disable import-x/no-internal-modules */
import { useContext, useMemo } from 'react';

import { StoreContext } from '@/reducers/store.provider';

import { CharactersService } from '@/fsd/4-entities/character';
import {
    getHseDisplayName,
    getHseSchedule,
    getHseScheduleStatus,
    getHseTierKeyForRoster,
    homescreenEvents,
    HomescreenEventData,
    hseEarnsRaidPoints,
    HseSchedule,
    HseScheduleStatus,
    resolveHseTier,
} from '@/fsd/4-entities/homescreen_events';
import { MowsService } from '@/fsd/4-entities/mow';
import { hasBlueStarUnit } from '@/fsd/4-entities/shops';

const UPCOMING_WINDOW_MS = 48 * 60 * 60 * 1000;

interface HseScheduleCandidate {
    event: HomescreenEventData;
    schedule: HseSchedule;
    status: HseScheduleStatus;
}

/**
 * Small, non-dismissible heads-up banner for the Daily Raids page: warns 48 hours before a
 * scheduled HSE that earns points via campaign-battle raiding starts, and shows a different
 * banner while it's live. Renders nothing when no qualifying HSE is upcoming/active, or when the
 * upcoming/active HSE doesn't earn raid points at all (e.g. donation/composition-based events).
 */
export const HseScheduleBanner = () => {
    const { characters, mows, playerMetadata } = useContext(StoreContext);

    const tierKey = useMemo(() => {
        const resolvedCharacters = CharactersService.resolveStoredCharacters(characters);
        const resolvedMows = MowsService.resolveAllFromStorage(mows);
        return getHseTierKeyForRoster(
            playerMetadata.powerLevel ?? 1,
            hasBlueStarUnit([...resolvedCharacters, ...resolvedMows])
        );
    }, [characters, mows, playerMetadata.powerLevel]);

    const match = useMemo(() => {
        const now = Date.now();
        const candidates: HseScheduleCandidate[] = homescreenEvents
            .map(event => ({ event, schedule: getHseSchedule(event.eventName) }))
            .filter((x): x is { event: HomescreenEventData; schedule: HseSchedule } => !!x.schedule)
            .map(x => ({ ...x, status: getHseScheduleStatus(x.schedule, new Date(now)) }))
            .filter(
                x =>
                    x.status === 'active' ||
                    (x.status === 'upcoming' && Date.parse(x.schedule.startUtc) - now <= UPCOMING_WINDOW_MS)
            );

        const chosen = candidates.find(x => x.status === 'active') ?? candidates.find(x => x.status === 'upcoming');
        if (!chosen) return;

        const resolved = resolveHseTier(chosen.event, tierKey);
        if (!resolved || !hseEarnsRaidPoints(resolved.tier, chosen.event.eventName)) return;

        return { status: chosen.status, displayName: getHseDisplayName(chosen.event) };
    }, [tierKey]);

    if (!match) return;

    if (match.status === 'active') {
        return (
            <div className="mb-2 rounded-md border border-(--primary) bg-(--primary)/10 px-3 py-2 text-sm font-medium text-(--fg)">
                {match.displayName} is live and earns points from campaign-battle raiding.
            </div>
        );
    }

    return (
        <div className="text-warning-fg bg-warning border-warning mb-2 rounded-md border px-3 py-2 text-sm font-medium">
            {match.displayName} starts within 48 hours and earns points from campaign-battle raiding — plan your energy
            around it.
        </div>
    );
};
